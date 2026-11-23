import type { Container } from '../../container.js';
import { EVENT_TYPES } from '../../config/constants.js';
import { enqueueOutboxEvent } from '../../jobs/queues/outbox.repository.js';
import type { DbExecutor } from '../../db/client.js';
import { findLeadById } from '../leads/leads.repository.js';
import { updateLeadRow } from '../leads/leads.repository.js';
import { aiQueryAuditLogs } from '../../db/schema/index.js';

export interface ScoreExplainResult {
  leadId: string;
  deterministicScore: number;
  aiScore: number | null;
  aiScoreReason: string | null;
  aiAvailable: boolean;
  refreshing: boolean;
}

/**
 * Returns the current AI score for a lead and optionally enqueues a refresh.
 * Falls back gracefully when AI is unavailable.
 */
export async function getScoreExplain(deps: Container, leadId: string): Promise<ScoreExplainResult> {
  const lead = await findLeadById(deps.db, leadId);
  if (!lead) return { leadId, deterministicScore: 0, aiScore: null, aiScoreReason: null, aiAvailable: false, refreshing: false };

  const aiAvailable = await deps.ai.isAvailable();
  const needsRefresh = aiAvailable && lead.aiScore === null;

  if (needsRefresh) {
    await enqueueOutboxEvent(deps.db, {
      type: EVENT_TYPES.AI_SCORE_LEAD,
      aggregateType: 'lead',
      aggregateId: leadId,
      payload: { leadId },
      maxAttempts: 5,
    });
  }

  return {
    leadId,
    deterministicScore: lead.score,
    aiScore: lead.aiScore ?? null,
    aiScoreReason: lead.aiScoreReason ?? null,
    aiAvailable,
    refreshing: needsRefresh,
  };
}

/** Synchronously compute AI score for a lead (used in qualification flow when AI is live). */
export async function computeAiScoreSync(
  deps: Container,
  db: DbExecutor,
  leadId: string,
): Promise<{ aiScore: number; aiScoreReason: string } | null> {
  if (!(await deps.ai.isAvailable())) return null;

  const lead = await findLeadById(db, leadId);
  if (!lead) return null;

  try {
    const result = await deps.ai.complete({
      kind: 'score_lead',
      system: `You are a B2B sales qualification assistant. Given a lead's details, produce a JSON object with:
- score: integer 0-100
- reason: 2-3 sentence explanation

Respond ONLY with valid JSON: {"score": <number>, "reason": "<string>"}`,
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

    const parsed = JSON.parse(result.text) as { score: number; reason: string };
    const aiScore = Math.min(100, Math.max(0, Math.round(parsed.score)));
    const aiScoreReason = parsed.reason;

    await db.insert(aiQueryAuditLogs).values({
      queryKind: 'score_lead',
      prompt: `leadId:${leadId}`,
      tokensUsed: result.inputTokens + result.outputTokens,
      modelId: result.modelId,
      durationMs: result.durationMs,
    });

    return { aiScore, aiScoreReason };
  } catch (err) {
    deps.logger.warn({ leadId, err }, 'AI sync scoring failed, continuing with deterministic score');
    return null;
  }
}
