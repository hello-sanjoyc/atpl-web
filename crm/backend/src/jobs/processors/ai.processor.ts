import { eq } from 'drizzle-orm';
import { EVENT_TYPES } from '../../config/constants.js';
import type { Container } from '../../container.js';
import { aiQueryAuditLogs } from '../../db/schema/index.js';
import { findLeadById, updateLeadRow } from '../../modules/leads/leads.repository.js';
import { detectDuplicatesForLead, assignDuplicateGroup } from '../../modules/ai/duplicate-detection.service.js';
import { enrichLead } from '../../modules/ai/ai-enrichment.service.js';
import type { OutboxRecord } from '../queues/outbox.repository.js';
import type { ProcessOutcome } from './dispatcher.js';

/** Score a lead with AI and persist ai_score + ai_score_reason. */
async function processAiScoreLead(event: OutboxRecord, deps: Container): Promise<ProcessOutcome> {
  if (!(await deps.ai.isAvailable())) return { status: 'skipped', reason: 'ai_not_configured' };

  const lead = await findLeadById(deps.db, String(event.payload.leadId));
  if (!lead) return { status: 'skipped', reason: 'lead_not_found' };

  const start = Date.now();
  const result = await deps.ai.complete({
    kind: 'score_lead',
    system: `You are a B2B sales qualification assistant. Given a lead's details, produce a JSON object with:
- score: integer 0-100 representing buying intent and fit
- reason: 2-3 sentence explanation of the score

Respond ONLY with valid JSON matching: {"score": <number>, "reason": "<string>"}`,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          serviceInterest: lead.serviceInterest,
          budgetRange: lead.budgetRange,
          timeline: lead.timeline,
          hasCompany: Boolean(lead.company),
          stage: lead.stage,
          discoveryRequested: lead.discoveryRequested,
          existingScore: lead.score,
        }),
      },
    ],
  });

  let parsed: { score: number; reason: string };
  try {
    parsed = JSON.parse(result.text);
  } catch {
    deps.logger.warn({ leadId: lead.id }, 'AI score response was not valid JSON');
    return { status: 'skipped', reason: 'invalid_ai_response' };
  }

  await deps.db.transaction(async (tx) => {
    await updateLeadRow(tx, lead.id, {
      aiScore: Math.min(100, Math.max(0, Math.round(parsed.score))),
      aiScoreReason: parsed.reason,
    });
    await tx.insert(aiQueryAuditLogs).values({
      queryKind: 'score_lead',
      prompt: `leadId:${lead.id}`,
      tokensUsed: result.inputTokens + result.outputTokens,
      modelId: result.modelId,
      durationMs: result.durationMs,
    });
  });

  return { status: 'sent', reference: `score:${parsed.score}` };
}

/** Extract intelligence from a conversation and persist structured fields. */
async function processAiExtractConversation(event: OutboxRecord, deps: Container): Promise<ProcessOutcome> {
  if (!(await deps.ai.isAvailable())) return { status: 'skipped', reason: 'ai_not_configured' };

  const { conversations } = await import('../../db/schema/index.js');
  const conversationId = String(event.payload.conversationId);

  const rows = await deps.db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  const conv = rows[0];
  if (!conv) return { status: 'skipped', reason: 'conversation_not_found' };

  const result = await deps.ai.complete({
    kind: 'extract_conversation',
    system: `You are a sales intelligence assistant. Analyse this conversation and return a JSON object with:
- summary: 2-3 sentence summary
- requirements: array of strings (key requirements mentioned)
- objections: array of strings (objections or concerns raised)
- commitments: array of strings (things the prospect or rep committed to)
- actionItems: array of strings (follow-up actions)

Respond ONLY with valid JSON.`,
    messages: [{ role: 'user', content: conv.rawText }],
  });

  let parsed: { summary: string; requirements: string[]; objections: string[]; commitments: string[]; actionItems: string[] };
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return { status: 'skipped', reason: 'invalid_ai_response' };
  }

  await deps.db.transaction(async (tx) => {
    await tx
      .update(conversations)
      .set({
        summary: parsed.summary,
        requirements: parsed.requirements,
        objections: parsed.objections,
        commitments: parsed.commitments,
        actionItems: parsed.actionItems,
        processedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
    await tx.insert(aiQueryAuditLogs).values({
      queryKind: 'extract_conversation',
      prompt: `conversationId:${conversationId}`,
      tokensUsed: result.inputTokens + result.outputTokens,
      modelId: result.modelId,
      durationMs: result.durationMs,
    });
  });

  return { status: 'sent' };
}

/** Enrich a lead with company/industry data via AI inference. */
async function processAiEnrichLead(event: OutboxRecord, deps: Container): Promise<ProcessOutcome> {
  const leadId = String(event.payload.leadId);
  const result = await enrichLead(deps, leadId);
  return { status: result.status.startsWith('enriched') ? 'sent' : 'skipped', reason: result.status };
}

/** Detect and group duplicate leads. */
async function processAiDedupLead(event: OutboxRecord, deps: Container): Promise<ProcessOutcome> {
  const leadId = String(event.payload.leadId);
  const matches = await detectDuplicatesForLead(deps.db, leadId, deps.ai, deps.logger);

  const definiteDups = matches
    .filter((m) => m.confidence === 'definite' || m.confidence === 'probable')
    .map((m) => m.candidateId);

  if (definiteDups.length > 0) {
    await assignDuplicateGroup(deps.db, leadId, definiteDups);
    deps.logger.info({ leadId, duplicates: definiteDups.length }, 'Duplicate group assigned via async job');
    return { status: 'sent', reference: `group:${leadId}` };
  }

  return { status: 'skipped', reason: 'no_duplicates_found' };
}

export const AI_EVENT_HANDLERS: Partial<Record<string, (event: OutboxRecord, deps: Container) => Promise<ProcessOutcome>>> = {
  [EVENT_TYPES.AI_SCORE_LEAD]: processAiScoreLead,
  [EVENT_TYPES.AI_EXTRACT_CONVERSATION]: processAiExtractConversation,
  [EVENT_TYPES.AI_DEDUP_LEAD]: processAiDedupLead,
  [EVENT_TYPES.AI_ENRICH_LEAD]: processAiEnrichLead,
};

export async function processAiEvent(event: OutboxRecord, deps: Container): Promise<ProcessOutcome> {
  const handler = AI_EVENT_HANDLERS[event.type];
  if (!handler) return { status: 'skipped', reason: `no_handler_for_${event.type}` };
  return handler(event, deps);
}
