import type { Container } from '../../container.js';
import { NotFoundError, ValidationError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { AuthUser } from '../../types/fastify.js';
import { recordAudit } from '../audit/audit.repository.js';
import { pagination } from '../common/response.js';
import { findLeadById } from '../leads/leads.repository.js';
import { assertOwnedOrViewAll, ownerScope } from '../leads/lead-access.js';
import { findOpportunityById } from '../opportunities/opportunities.repository.js';
import { findActiveUserById } from '../users/users.repository.js';
import { findFollowUpById, insertFollowUp, listFollowUps, updateFollowUp } from './follow-ups.repository.js';

export interface CreateFollowUpInput {
  leadId?: string;
  opportunityId?: string;
  customerId?: string;
  ownerId?: string;
  title: string;
  notes?: string;
  dueAt: string;
}

export function createFollowUpsService(deps: Container) {
  const { db, logger } = deps;
  const log = logger.child({ module: 'follow-ups' });

  return {
    async create(user: AuthUser, input: CreateFollowUpInput) {
      if (input.leadId) {
        const lead = await findLeadById(db, input.leadId);
        if (!lead) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'The linked lead was not found.');
        assertOwnedOrViewAll(user, lead.ownerId);
      }
      if (input.opportunityId) {
        const opp = await findOpportunityById(db, input.opportunityId);
        if (!opp) throw new NotFoundError(ErrorCodes.OPPORTUNITY_NOT_FOUND, 'The linked opportunity was not found.');
        assertOwnedOrViewAll(user, opp.ownerId, ErrorCodes.OPPORTUNITY_NOT_FOUND);
      }
      const ownerId = input.ownerId ?? user.id;
      if (ownerId !== user.id) {
        const owner = await findActiveUserById(db, ownerId);
        if (!owner) throw new ValidationError('The selected owner is not an active user.', [{ field: 'ownerId', message: 'Invalid owner.' }]);
      }
      const row = await db.transaction(async (tx) => {
        const created = await insertFollowUp(tx, {
          leadId: input.leadId ?? null,
          opportunityId: input.opportunityId ?? null,
          customerId: input.customerId ?? null,
          ownerId,
          title: input.title,
          dueAt: new Date(input.dueAt),
        });
        await recordAudit(tx, { actorId: user.id, action: 'follow_up.created', entityType: 'follow_up', entityId: created.id });
        return created;
      });
      log.info({ event: 'follow_up.created', followUpId: row.id, actorUserId: user.id }, 'Follow-up scheduled');
      return row;
    },

    async list(user: AuthUser, query: { status?: string; dueBefore?: string; ownerId?: string; page: number; pageSize: number }) {
      const scope = ownerScope(user) ?? query.ownerId;
      const { rows, total } = await listFollowUps(
        db,
        { ownerId: scope, status: query.status, dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined },
        { limit: query.pageSize, offset: (query.page - 1) * query.pageSize },
      );
      return { items: rows, page: pagination(query.page, query.pageSize, total) };
    },

    async complete(user: AuthUser, id: string) {
      const task = await findFollowUpById(db, id);
      if (!task || (ownerScope(user) && task.ownerId !== user.id)) {
        throw new NotFoundError(ErrorCodes.FOLLOW_UP_NOT_FOUND, 'The requested follow-up was not found.');
      }
      if (task.status !== 'open') throw new ValidationError('Only open follow-ups can be completed.', [{ field: 'status', message: 'Task is not open.' }]);
      const now = deps.now();
      const row = await db.transaction(async (tx) => {
        const updated = await updateFollowUp(tx, id, { status: 'completed', completedAt: now });
        await recordAudit(tx, { actorId: user.id, action: 'follow_up.completed', entityType: 'follow_up', entityId: id });
        return updated;
      });
      return row;
    },
  };
}
