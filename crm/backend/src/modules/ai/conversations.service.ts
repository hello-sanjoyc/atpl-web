import { desc, eq } from 'drizzle-orm';
import type { Container } from '../../container.js';
import { EVENT_TYPES } from '../../config/constants.js';
import { conversations } from '../../db/schema/index.js';
import { enqueueOutboxEvent } from '../../jobs/queues/outbox.repository.js';
import { NotFoundError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import { findLeadById } from '../leads/leads.repository.js';
import { assertOwnedOrViewAll } from '../leads/lead-access.js';
import { pagination } from '../common/response.js';
import type { AuthUser } from '../../types/fastify.js';

export function createConversationsService(deps: Container) {
  const { db } = deps;

  return {
    async submit(user: AuthUser, leadId: string, input: { rawText: string; kind: string }) {
      const lead = await findLeadById(db, leadId);
      if (!lead) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'Lead not found.');
      assertOwnedOrViewAll(user, lead.ownerId);

      const [row] = await db
        .insert(conversations)
        .values({
          leadId,
          kind: input.kind,
          rawText: input.rawText,
          actorId: user.id,
        })
        .returning();

      // Enqueue async AI extraction
      await enqueueOutboxEvent(db, {
        type: EVENT_TYPES.AI_EXTRACT_CONVERSATION,
        aggregateType: 'conversation',
        aggregateId: row!.id,
        payload: { conversationId: row!.id, leadId },
        maxAttempts: 5,
      });

      return {
        id: row!.id,
        leadId,
        kind: row!.kind,
        processing: true,
        createdAt: row!.createdAt.toISOString(),
      };
    },

    async list(user: AuthUser, leadId: string) {
      const lead = await findLeadById(db, leadId);
      if (!lead) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'Lead not found.');
      assertOwnedOrViewAll(user, lead.ownerId);

      const rows = await db
        .select()
        .from(conversations)
        .where(eq(conversations.leadId, leadId))
        .orderBy(desc(conversations.createdAt));

      const items = rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        summary: r.summary,
        requirements: r.requirements,
        objections: r.objections,
        commitments: r.commitments,
        actionItems: r.actionItems,
        processedAt: r.processedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      }));

      return { items, page: pagination(1, items.length || 1, items.length) };
    },
  };
}
