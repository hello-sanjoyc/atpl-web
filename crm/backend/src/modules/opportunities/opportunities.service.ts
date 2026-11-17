import { LEAD_STAGE_FOR_OPPORTUNITY, OPPORTUNITY_STAGES, type OpportunityStageKey } from '../../config/constants.js';
import type { Container } from '../../container.js';
import { AuthorizationError, BusinessRuleError, NotFoundError, ValidationError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { AuthUser } from '../../types/fastify.js';
import { roleHasPermission } from '../../plugins/authorization.plugin.js';
import { recordAudit } from '../audit/audit.repository.js';
import { pagination } from '../common/response.js';
import { ensureCustomerForLead } from '../customers/customers.service.js';
import { findCustomerById } from '../customers/customers.repository.js';
import { assertOwnedOrViewAll, ownerScope } from '../leads/lead-access.js';
import { findLeadById, insertStageHistory, updateLeadRow, type LeadRow } from '../leads/leads.repository.js';
import { toMoney, formatMoney } from '../../utils/money.js';
import type { z } from 'zod';
import type { changeOpportunityStageBody, createOpportunityBody, listOpportunitiesQuery, recordProposalBody, updateOpportunityBody } from './opportunities.schema.js';
import {
  findOpportunityById,
  insertOpportunity,
  insertOpportunityStageHistory,
  listOpportunities,
  listOpportunityStageHistory,
  updateOpportunity,
  type OpportunityRow,
} from './opportunities.repository.js';

type CreateInput = z.infer<typeof createOpportunityBody>;
type UpdateInput = z.infer<typeof updateOpportunityBody>;
type StageInput = z.infer<typeof changeOpportunityStageBody>;
type ProposalInput = z.infer<typeof recordProposalBody>;
type ListQuery = z.infer<typeof listOpportunitiesQuery>;

const STAGE_DEFAULTS = Object.fromEntries(OPPORTUNITY_STAGES.map((s) => [s.key, s.probability])) as Record<OpportunityStageKey, string>;
const TERMINAL = new Set<string>(OPPORTUNITY_STAGES.filter((s) => s.terminal).map((s) => s.key));
const PIPELINE_ORDER = OPPORTUNITY_STAGES.map((s) => s.key) as readonly string[];

export function toOpportunityDto(row: OpportunityRow) {
  return {
    id: row.id,
    leadId: row.leadId,
    customerId: row.customerId,
    referralId: row.referralId,
    campaignId: row.campaignId,
    ownerId: row.ownerId,
    title: row.title,
    serviceInterest: row.serviceInterest,
    country: row.country,
    opportunityType: row.opportunityType,
    stage: row.stage,
    status: row.status,
    probability: row.probability,
    estimatedValue: row.estimatedValue,
    weightedValue: formatMoney(toMoney(row.estimatedValue).times(row.probability)),
    currency: row.currency,
    expectedCloseDate: row.expectedCloseDate,
    proposalSentAt: row.proposalSentAt?.toISOString() ?? null,
    proposalVersion: row.proposalVersion,
    wonValue: row.wonValue,
    wonAt: row.wonAt?.toISOString() ?? null,
    lostAt: row.lostAt?.toISOString() ?? null,
    lostReason: row.lostReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createOpportunitiesService(deps: Container) {
  const { db, logger, now } = deps;
  const log = logger.child({ module: 'opportunities' });

  async function loadVisible(user: AuthUser, id: string): Promise<OpportunityRow> {
    const row = await findOpportunityById(db, id);
    if (!row) throw new NotFoundError(ErrorCodes.OPPORTUNITY_NOT_FOUND, 'The requested opportunity was not found.');
    assertOwnedOrViewAll(user, row.ownerId, ErrorCodes.OPPORTUNITY_NOT_FOUND);
    return row;
  }

  return {
    async list(user: AuthUser, query: ListQuery) {
      const { rows, total } = await listOpportunities(
        db,
        {
          stage: query.stage,
          status: query.status,
          ownerId: query.ownerId,
          scopeOwnerId: ownerScope(user),
          opportunityType: query.opportunityType,
          currency: query.currency,
          closeFrom: query.closeFrom,
          closeTo: query.closeTo,
          country: query.country,
        },
        { limit: query.pageSize, offset: (query.page - 1) * query.pageSize, sort: query.sort, order: query.order },
      );
      return { items: rows.map(toOpportunityDto), page: pagination(query.page, query.pageSize, total) };
    },

    async create(user: AuthUser, input: CreateInput) {
      await deps.options.validateFields(input, {
        serviceInterest: 'service_interest',
        opportunityType: 'opportunity_type',
      });
      let lead: LeadRow | undefined;
      let country = input.country ?? null;
      let ownerId = input.ownerId ?? null;
      if (input.leadId) {
        lead = await findLeadById(db, input.leadId);
        if (!lead) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'The linked lead was not found.');
        assertOwnedOrViewAll(user, lead.ownerId, ErrorCodes.LEAD_NOT_FOUND);
        country = country ?? lead.country;
        ownerId = ownerId ?? lead.ownerId ?? (ownerScope(user) ? user.id : null);
      }
      if (input.customerId && !(await findCustomerById(db, input.customerId))) {
        throw new NotFoundError(ErrorCodes.CUSTOMER_NOT_FOUND, 'The linked customer was not found.');
      }
      if (!ownerId && ownerScope(user)) ownerId = user.id;

      const row = await db.transaction(async (tx) => {
        const created = await insertOpportunity(tx, {
          leadId: input.leadId ?? null,
          customerId: input.customerId ?? null,
          referralId: input.referralId ?? lead?.referralId ?? null,
          campaignId: input.campaignId ?? lead?.campaignId ?? null,
          ownerId,
          title: input.title,
          serviceInterest: input.serviceInterest ?? lead?.serviceInterest ?? null,
          country,
          opportunityType: input.opportunityType,
          stage: 'discovery',
          status: 'open',
          probability: STAGE_DEFAULTS.discovery,
          estimatedValue: input.estimatedValue,
          currency: input.currency,
          expectedCloseDate: input.expectedCloseDate ?? null,
        });
        await insertOpportunityStageHistory(tx, { opportunityId: created.id, fromStage: null, toStage: 'discovery', actorId: user.id, reason: 'created' });
        await recordAudit(tx, { actorId: user.id, action: 'opportunity.created', entityType: 'opportunity', entityId: created.id, metadata: { currency: input.currency, type: input.opportunityType } });
        return created;
      });
      log.info({ event: 'opportunity.created', opportunityId: row.id, actorUserId: user.id }, 'Opportunity created');
      return toOpportunityDto(row);
    },

    async get(user: AuthUser, id: string) {
      return toOpportunityDto(await loadVisible(user, id));
    },

    async update(user: AuthUser, id: string, input: UpdateInput) {
      await deps.options.validateFields(input, { serviceInterest: 'service_interest' });
      const current = await loadVisible(user, id);
      if (TERMINAL.has(current.stage)) {
        throw new BusinessRuleError(ErrorCodes.INVALID_TRANSITION, 'Closed opportunities cannot be edited.');
      }
      const row = await db.transaction(async (tx) => {
        const updated = await updateOpportunity(tx, id, input);
        if (!updated) throw new NotFoundError(ErrorCodes.OPPORTUNITY_NOT_FOUND, 'The requested opportunity was not found.');
        await recordAudit(tx, { actorId: user.id, action: 'opportunity.updated', entityType: 'opportunity', entityId: id, metadata: { fields: Object.keys(input) } });
        return updated;
      });
      return toOpportunityDto(row);
    },

    async changeStage(user: AuthUser, id: string, input: StageInput) {
      const current = await loadVisible(user, id);
      const target = input.stage as OpportunityStageKey;
      const closing = target === 'won' || target === 'lost';
      if (closing && !roleHasPermission(user.role, 'opportunities.close')) {
        throw new AuthorizationError('Your role cannot close opportunities.');
      }
      if (TERMINAL.has(current.stage)) {
        throw new BusinessRuleError(ErrorCodes.INVALID_TRANSITION, 'Closed opportunities cannot be reopened through the pipeline.');
      }
      if (current.stage === target) {
        throw new BusinessRuleError(ErrorCodes.INVALID_TRANSITION, 'The opportunity is already in this stage.');
      }
      if (PIPELINE_ORDER.indexOf(target) < PIPELINE_ORDER.indexOf(current.stage) && !closing) {
        throw new BusinessRuleError(ErrorCodes.INVALID_TRANSITION, 'Opportunities move forward through the pipeline. Record a new opportunity to restart.');
      }

      const at = now();
      const lead = current.leadId ? await findLeadById(db, current.leadId) : undefined;

      const row = await db.transaction(async (tx) => {
        const patch: Partial<typeof current> = {
          stage: target,
          probability: STAGE_DEFAULTS[target],
        };
        if (target === 'won') {
          const wonValue = toMoney(input.wonValue);
          if (wonValue.lt(0)) throw new ValidationError('wonValue cannot be negative.', [{ field: 'wonValue', message: 'Invalid amount.' }]);
          patch.status = 'won';
          patch.wonValue = formatMoney(wonValue);
          patch.wonAt = at;
          patch.probability = '1.0000';
        }
        if (target === 'lost') {
          patch.status = 'lost';
          patch.lostAt = at;
          patch.lostReason = input.lostReason ?? 'other';
          patch.probability = '0.0000';
        }
        if (target === 'proposal_sent' && !current.proposalSentAt) {
          patch.proposalSentAt = at;
          patch.proposalVersion = current.proposalVersion + 1;
        }

        const updated = await updateOpportunity(tx, id, patch);
        if (!updated) throw new NotFoundError(ErrorCodes.OPPORTUNITY_NOT_FOUND, 'The requested opportunity was not found.');

        await insertOpportunityStageHistory(tx, {
          opportunityId: id,
          fromStage: current.stage,
          toStage: target,
          actorId: user.id,
          reason: input.reason ?? input.lostReason ?? null,
        });

        if (target === 'won' && lead) {
          const customer = await ensureCustomerForLead(tx, lead, user.id);
          await updateOpportunity(tx, id, { customerId: customer.id });
        }

        if (lead) {
          const leadStage = LEAD_STAGE_FOR_OPPORTUNITY[target];
          if (leadStage && lead.stage !== 'won' && lead.stage !== leadStage) {
            await updateLeadRow(tx, lead.id, { stage: leadStage });
            await insertStageHistory(tx, { leadId: lead.id, fromStage: lead.stage, toStage: leadStage, actorId: user.id, reason: `opportunity:${id}` });
          }
        }

        const action = target === 'won' ? 'opportunity.won' : target === 'lost' ? 'opportunity.lost' : 'opportunity.stage_changed';
        await recordAudit(tx, {
          actorId: user.id,
          action,
          entityType: 'opportunity',
          entityId: id,
          metadata: { from: current.stage, to: target, currency: current.currency, ...(target === 'won' ? { wonValue: patch.wonValue } : {}) },
        });
        return updated;
      });

      log.info({ event: `opportunity.${target === 'won' ? 'won' : target === 'lost' ? 'lost' : 'stage_changed'}`, opportunityId: id, actorUserId: user.id, from: current.stage, to: target }, 'Opportunity stage changed');
      return toOpportunityDto(row);
    },

    async recordProposal(user: AuthUser, id: string, input: ProposalInput) {
      const current = await loadVisible(user, id);
      if (TERMINAL.has(current.stage)) throw new BusinessRuleError(ErrorCodes.INVALID_TRANSITION, 'Closed opportunities cannot receive proposals.');
      const row = await db.transaction(async (tx) => {
        const movingToProposal = PIPELINE_ORDER.indexOf(current.stage) < PIPELINE_ORDER.indexOf('proposal_sent');
        const updated = await updateOpportunity(tx, id, {
          estimatedValue: input.estimatedValue ?? current.estimatedValue,
          proposalSentAt: now(),
          proposalVersion: current.proposalVersion + 1,
          stage: movingToProposal ? 'proposal_sent' : current.stage,
          probability: movingToProposal ? STAGE_DEFAULTS.proposal_sent : current.probability,
        });
        if (!updated) throw new NotFoundError(ErrorCodes.OPPORTUNITY_NOT_FOUND, 'The requested opportunity was not found.');
        if (movingToProposal) {
          await insertOpportunityStageHistory(tx, { opportunityId: id, fromStage: current.stage, toStage: 'proposal_sent', actorId: user.id, reason: 'proposal' });
        }
        await recordAudit(tx, { actorId: user.id, action: 'opportunity.proposal_recorded', entityType: 'opportunity', entityId: id, metadata: { version: current.proposalVersion + 1 } });
        return updated;
      });
      return toOpportunityDto(row);
    },

    async history(user: AuthUser, id: string) {
      await loadVisible(user, id);
      const rows = await listOpportunityStageHistory(db, id);
      return rows.map((r) => ({ from: r.fromStage, to: r.toStage, actorId: r.actorId, reason: r.reason, at: r.createdAt.toISOString() }));
    },
  };
}

