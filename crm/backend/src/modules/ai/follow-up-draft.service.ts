import { desc, eq } from 'drizzle-orm';
import type { Container } from '../../container.js';
import { conversations, leadActivities } from '../../db/schema/index.js';
import { NotFoundError, BusinessRuleError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import { findLeadById, insertActivity } from '../leads/leads.repository.js';
import { assertOwnedOrViewAll } from '../leads/lead-access.js';
import type { AuthUser } from '../../types/fastify.js';

export function createFollowUpDraftService(deps: Container) {
  const { db } = deps;

  return {
    async generate(user: AuthUser, leadId: string, channel: 'email' | 'whatsapp') {
      const lead = await findLeadById(db, leadId);
      if (!lead) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'Lead not found.');
      assertOwnedOrViewAll(user, lead.ownerId);

      if (!(await deps.ai.isAvailable())) {
        throw new BusinessRuleError(
          ErrorCodes.BUSINESS_RULE_VIOLATION,
          'AI is not configured. Set ANTHROPIC_API_KEY to enable follow-up drafts.',
        );
      }

      // Gather prior activities (last 10)
      const recentActivities = await db
        .select({ type: leadActivities.type, body: leadActivities.body, createdAt: leadActivities.createdAt })
        .from(leadActivities)
        .where(eq(leadActivities.leadId, leadId))
        .orderBy(desc(leadActivities.createdAt))
        .limit(10);

      // Gather latest conversation summary if any
      const latestConv = await db
        .select({ summary: conversations.summary, objections: conversations.objections })
        .from(conversations)
        .where(eq(conversations.leadId, leadId))
        .orderBy(desc(conversations.createdAt))
        .limit(1);

      const channelInstructions =
        channel === 'email'
          ? 'Write a professional follow-up email with subject line and body. Keep it concise — 3-4 short paragraphs.'
          : 'Write a short, friendly WhatsApp follow-up message. Max 150 words, conversational tone.';

      const result = await deps.ai.complete({
        kind: 'draft_followup',
        system: `You are a B2B sales assistant writing a personalized follow-up message.
${channelInstructions}
Address the lead's specific interests and any objections mentioned. Do not use placeholder text — write a real, ready-to-send draft.`,
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              serviceInterest: lead.serviceInterest,
              budgetRange: lead.budgetRange,
              timeline: lead.timeline,
              stage: lead.stage,
              recentActivities: recentActivities.map((a) => ({ type: a.type, body: a.body })),
              latestConversationSummary: latestConv[0]?.summary ?? null,
              latestObjections: latestConv[0]?.objections ?? [],
              channel,
            }),
          },
        ],
      });

      // Log as a note activity so the draft is visible in the timeline
      await insertActivity(db, {
        leadId,
        type: 'note',
        body: `AI-generated ${channel} draft:\n\n${result.text}`,
        actorId: user.id,
        metadata: { aiGenerated: true, channel },
      });

      return {
        leadId,
        channel,
        draft: result.text,
        tokensUsed: result.inputTokens + result.outputTokens,
      };
    },
  };
}
