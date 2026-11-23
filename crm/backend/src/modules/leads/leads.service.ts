import { LEAD_STAGES, OWNER_ROLES, QUALIFICATION_THRESHOLD, type LeadStageKey } from '../../config/constants.js';
import type { Container } from '../../container.js';
import { BusinessRuleError, ConflictError, NotFoundError, ValidationError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { AuthUser } from '../../types/fastify.js';
import { roleHasPermission } from '../../plugins/authorization.plugin.js';
import { recordAudit, diffFields } from '../audit/audit.repository.js';
import { findActiveUserById } from '../users/users.repository.js';
import { pagination } from '../common/response.js';
import { assertOwnedOrViewAll, maskContact, ownerScope } from './lead-access.js';
import { scoreLead } from './lead-scoring.js';
import { getScoreExplain } from '../ai/ai-scoring.service.js';
import type { CreateLeadBody, ListLeadsQuery, UpdateLeadBody, QualifyLeadBody, ChangeStageBody, CreateActivityBody } from './leads.types.js';
import {
  findLeadById,
  findLiveLeadByEmail,
  insertActivity,
  insertAssignmentHistory,
  insertLeadRow,
  insertStageHistory,
  listActivities,
  listAssignmentHistory,
  listLeadRows,
  listStageHistory,
  softDeleteLeadRow,
  updateLeadRow,
  type LeadRow,
} from './leads.repository.js';

const STAGE_KEYS = LEAD_STAGES.map((s) => s.key) as readonly string[];
const REOPENABLE_FROM_LOST: readonly LeadStageKey[] = ['contacted', 'nurturing'];
const AUTO_QUALIFY_FROM: readonly LeadStageKey[] = ['new_lead', 'contacted'];

export function toLeadDto(row: LeadRow, user: AuthUser) {
  const contact = maskContact({ email: row.email, phone: row.phone }, user);
  const canSeePii = roleHasPermission(user.role, 'leads.pii');
  return {
    id: row.id,
    name: row.name,
    email: contact.email,
    phone: contact.phone,
    company: row.company,
    country: row.country,
    serviceInterest: row.serviceInterest,
    budgetRange: row.budgetRange,
    timeline: row.timeline,
    message: canSeePii ? row.message : null,
    captureChannel: row.captureChannel,
    leadSource: row.leadSource,
    source: row.source,
    formSource: row.formSource,
    utm: { source: row.utmSource, medium: row.utmMedium, campaign: row.utmCampaign, term: row.utmTerm, content: row.utmContent },
    campaignId: row.campaignId,
    referralId: row.referralId,
    stage: row.stage,
    priority: row.priority,
    score: row.score,
    aiScore: row.aiScore ?? null,
    aiScoreReason: row.aiScoreReason ?? null,
    aiSummary: row.aiSummary ?? null,
    enrichmentData: row.enrichmentData ?? null,
    duplicateGroupId: row.duplicateGroupId ?? null,
    qualificationStatus: row.qualificationStatus,
    ownerId: row.ownerId,
    discoveryRequested: row.discoveryRequested,
    marketingConsent: row.marketingConsent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createLeadsService(deps: Container) {
  const { db, logger } = deps;
  const log = logger.child({ module: 'leads' });

  async function loadVisible(user: AuthUser, id: string): Promise<LeadRow> {
    const lead = await findLeadById(db, id);
    if (!lead) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'The requested lead was not found.');
    assertOwnedOrViewAll(user, lead.ownerId);
    return lead;
  }

  async function assertEligibleOwner(ownerId: string): Promise<void> {
    const owner = await findActiveUserById(db, ownerId);
    if (!owner || !(OWNER_ROLES as readonly string[]).includes(owner.role)) {
      throw new ValidationError('The selected owner is not an active sales user.', [{ field: 'ownerId', message: 'Invalid owner.' }]);
    }
  }

  return {
    async list(user: AuthUser, query: ListLeadsQuery) {
      const scope = ownerScope(user);
      const { rows, total } = await listLeadRows(
        db,
        {
          q: query.q,
          stage: query.stage,
          priority: query.priority,
          qualificationStatus: query.qualificationStatus,
          ownerId: query.ownerId,
          scopeOwnerId: scope,
          source: query.source,
          serviceInterest: query.serviceInterest,
          country: query.country,
          campaignId: query.campaignId,
          createdFrom: query.createdFrom ? new Date(`${query.createdFrom}T00:00:00.000Z`) : undefined,
          createdTo: query.createdTo ? new Date(`${query.createdTo}T23:59:59.999Z`) : undefined,
        },
        { limit: query.pageSize, offset: (query.page - 1) * query.pageSize, sort: query.sort, order: query.order },
      );
      return { items: rows.map((r) => toLeadDto(r, user)), page: pagination(query.page, query.pageSize, total) };
    },

    async create(user: AuthUser, input: CreateLeadBody) {
      await deps.options.validateFields(input, {
        serviceInterest: 'service_interest',
        budgetRange: 'budget_range',
        timeline: 'timeline',
        captureChannel: 'capture_channel',
        leadSource: 'lead_source',
      });
      const email = input.email.toLowerCase();
      const duplicate = await findLiveLeadByEmail(db, email);
      if (duplicate) {
        throw new ConflictError(ErrorCodes.DUPLICATE_LEAD, 'A lead with this email address already exists.');
      }
      // Executives without pipeline-wide visibility own what they create.
      const ownerId = input.ownerId ?? (ownerScope(user) ? user.id : null);
      if (input.ownerId) await assertEligibleOwner(input.ownerId);
      const score = scoreLead({
        budgetRange: input.budgetRange,
        timeline: input.timeline,
        hasCompany: Boolean(input.company),
        serviceInterest: input.serviceInterest,
      });
      const now = deps.now();

      const row = await db.transaction(async (tx) => {
        const created = await insertLeadRow(tx, {
          email,
          name: input.name,
          phone: input.phone ?? null,
          company: input.company ?? null,
          country: input.country ?? null,
          serviceInterest: input.serviceInterest ?? null,
          budgetRange: input.budgetRange ?? null,
          timeline: input.timeline ?? null,
          message: input.message ?? null,
          captureChannel: input.captureChannel ?? null,
          leadSource: input.leadSource ?? null,
          source: 'manual',
          formSource: 'internal_crm',
          campaignId: input.campaignId ?? null,
          referralId: input.referralId ?? null,
          stage: 'new_lead',
          priority: input.priority,
          score: score.score,
          ownerId,
          qualificationStatus: 'unqualified',
          marketingConsent: input.marketingConsent,
          marketingConsentAt: input.marketingConsent ? now : null,
          privacyPolicyVersion: 'internal',
          consentRecordedAt: now,
        });
        await insertStageHistory(tx, { leadId: created.id, fromStage: null, toStage: 'new_lead', actorId: user.id, reason: 'created' });
        if (ownerId) {
          await insertAssignmentHistory(tx, { leadId: created.id, fromOwnerId: null, toOwnerId: ownerId, actorId: user.id });
        }
        await insertActivity(tx, { leadId: created.id, type: 'system', body: 'Lead created manually', actorId: user.id });
        await recordAudit(tx, { actorId: user.id, action: 'lead.created', entityType: 'lead', entityId: created.id, metadata: { source: 'manual' } });
        return created;
      });
      log.info({ event: 'lead.created', leadId: row.id, actorUserId: user.id, source: 'manual' }, 'Lead created successfully');
      return toLeadDto(row, user);
    },

    async get(user: AuthUser, id: string) {
      return toLeadDto(await loadVisible(user, id), user);
    },

    async update(user: AuthUser, id: string, input: UpdateLeadBody) {
      await deps.options.validateFields(input, {
        serviceInterest: 'service_interest',
        budgetRange: 'budget_range',
        timeline: 'timeline',
        captureChannel: 'capture_channel',
        leadSource: 'lead_source',
      });
      const before = await loadVisible(user, id);
      const updated = await db.transaction(async (tx) => {
        const row = await updateLeadRow(tx, id, input);
        if (!row) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'The requested lead was not found.');
        await recordAudit(tx, { actorId: user.id, action: 'lead.updated', entityType: 'lead', entityId: id, metadata: diffFields(before, input) });
        return row;
      });
      log.info({ event: 'lead.updated', leadId: id, actorUserId: user.id, fields: Object.keys(input) }, 'Lead updated');
      return toLeadDto(updated, user);
    },

    async changeStage(user: AuthUser, id: string, input: ChangeStageBody) {
      const lead = await loadVisible(user, id);
      if (!STAGE_KEYS.includes(input.stage)) throw new ValidationError('Unknown stage.', [{ field: 'stage', message: 'Invalid stage.' }], ErrorCodes.INVALID_STAGE);
      if (lead.stage === input.stage) {
        throw new BusinessRuleError(ErrorCodes.INVALID_TRANSITION, 'The lead is already in this stage.');
      }
      if (lead.stage === 'won') {
        throw new BusinessRuleError(ErrorCodes.INVALID_TRANSITION, 'Won leads cannot change stage. Manage the customer record instead.');
      }
      if (lead.stage === 'lost' && !REOPENABLE_FROM_LOST.includes(input.stage as LeadStageKey)) {
        throw new BusinessRuleError(ErrorCodes.INVALID_TRANSITION, 'Lost leads can only be reopened to Contacted or Nurturing.');
      }

      const updated = await db.transaction(async (tx) => {
        const row = await updateLeadRow(tx, id, { stage: input.stage });
        if (!row) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'The requested lead was not found.');
        await insertStageHistory(tx, { leadId: id, fromStage: lead.stage, toStage: input.stage, actorId: user.id, reason: input.reason ?? null });
        await recordAudit(tx, {
          actorId: user.id,
          action: 'lead.stage_changed',
          entityType: 'lead',
          entityId: id,
          metadata: { from: lead.stage, to: input.stage },
        });
        return row;
      });
      log.info({ event: 'lead.stage_changed', leadId: id, actorUserId: user.id, from: lead.stage, to: input.stage }, 'Lead stage changed');
      return toLeadDto(updated, user);
    },

    async assign(user: AuthUser, id: string, ownerId: string | null, reason?: string) {
      const lead = await loadVisible(user, id);
      if (ownerId) await assertEligibleOwner(ownerId);
      if (lead.ownerId === ownerId) throw new BusinessRuleError(ErrorCodes.BUSINESS_RULE_VIOLATION, 'The lead already has this owner.');
      const updated = await db.transaction(async (tx) => {
        const row = await updateLeadRow(tx, id, { ownerId });
        if (!row) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'The requested lead was not found.');
        await insertAssignmentHistory(tx, { leadId: id, fromOwnerId: lead.ownerId, toOwnerId: ownerId, actorId: user.id });
        await insertActivity(tx, { leadId: id, type: 'system', body: reason ?? 'Owner changed', actorId: user.id, metadata: { from: lead.ownerId, to: ownerId } });
        await recordAudit(tx, { actorId: user.id, action: 'lead.assigned', entityType: 'lead', entityId: id, metadata: { toOwnerId: ownerId } });
        return row;
      });
      log.info({ event: 'lead.assigned', leadId: id, actorUserId: user.id, toOwnerId: ownerId }, 'Lead assignment changed');
      return toLeadDto(updated, user);
    },

    async qualify(user: AuthUser, id: string, input: QualifyLeadBody) {
      await deps.options.validateFields(input, { budgetRange: 'budget_range', timeline: 'timeline' });
      const lead = await loadVisible(user, id);
      const budgetRange = input.budgetRange ?? lead.budgetRange ?? undefined;
      const timeline = input.timeline ?? lead.timeline ?? undefined;
      const score = scoreLead({
        budgetRange,
        timeline,
        decisionMaker: input.decisionMaker,
        hasCompany: Boolean(lead.company),
        serviceInterest: lead.serviceInterest,
        discoveryRequested: lead.discoveryRequested,
      });
      const qualified = score.score >= QUALIFICATION_THRESHOLD;
      const advance = qualified && AUTO_QUALIFY_FROM.includes(lead.stage as LeadStageKey);

      const updated = await db.transaction(async (tx) => {
        const row = await updateLeadRow(tx, id, {
          budgetRange: budgetRange ?? null,
          timeline: timeline ?? null,
          score: score.score,
          priority: score.priority,
          qualificationStatus: qualified ? 'qualified' : 'unqualified',
          stage: advance ? 'qualified' : lead.stage,
        });
        if (!row) throw new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'The requested lead was not found.');
        if (advance) {
          await insertStageHistory(tx, { leadId: id, fromStage: lead.stage, toStage: 'qualified', actorId: user.id, reason: 'qualification' });
        }
        await insertActivity(tx, {
          leadId: id,
          type: 'system',
          body: input.notes ?? `Qualification scored ${score.score}/100`,
          actorId: user.id,
          metadata: { score: score.score, breakdown: score.breakdown, qualified },
        });
        await recordAudit(tx, {
          actorId: user.id,
          action: 'lead.qualified',
          entityType: 'lead',
          entityId: id,
          metadata: { score: score.score, qualified },
        });
        return row;
      });
      log.info({ event: 'lead.qualified', leadId: id, actorUserId: user.id, score: score.score, qualified }, 'Lead qualification recorded');
      return { lead: toLeadDto(updated, user), score: score.score, priority: score.priority, qualified, breakdown: score.breakdown };
    },

    async listActivities(user: AuthUser, id: string, page: number, pageSize: number) {
      await loadVisible(user, id);
      const { rows, total } = await listActivities(db, id, { limit: pageSize, offset: (page - 1) * pageSize });
      return {
        items: rows.map((r) => ({ id: r.id, type: r.type, body: r.body, actorId: r.actorId, createdAt: r.createdAt.toISOString() })),
        page: pagination(page, pageSize, total),
      };
    },

    async createActivity(user: AuthUser, id: string, input: CreateActivityBody) {
      await loadVisible(user, id);
      await insertActivity(db, { leadId: id, type: input.type, body: input.body, actorId: user.id });
      return { leadId: id, type: input.type };
    },

    async history(user: AuthUser, id: string) {
      await loadVisible(user, id);
      const [stages, assignments] = await Promise.all([listStageHistory(db, id), listAssignmentHistory(db, id)]);
      return {
        stages: stages.map((s) => ({ from: s.fromStage, to: s.toStage, actorId: s.actorId, reason: s.reason, at: s.createdAt.toISOString() })),
        assignments: assignments.map((a) => ({ from: a.fromOwnerId, to: a.toOwnerId, actorId: a.actorId, at: a.createdAt.toISOString() })),
      };
    },

    async remove(user: AuthUser, id: string) {
      await loadVisible(user, id);
      await db.transaction(async (tx) => {
        await softDeleteLeadRow(tx, id);
        await recordAudit(tx, { actorId: user.id, action: 'lead.deleted', entityType: 'lead', entityId: id });
      });
      log.info({ event: 'lead.deleted', leadId: id, actorUserId: user.id }, 'Lead soft-deleted');
    },

    async scoreExplain(user: AuthUser, id: string) {
      await loadVisible(user, id);
      return getScoreExplain(deps, id);
    },
  };
}

