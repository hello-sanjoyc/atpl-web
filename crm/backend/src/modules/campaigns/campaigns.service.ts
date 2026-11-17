import type { Container } from '../../container.js';
import type { z } from 'zod';
import type { createCampaignBody } from './campaigns.schema.js';

type CreateCampaignInput = z.infer<typeof createCampaignBody>;
import { ConflictError, NotFoundError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { AuthUser } from '../../types/fastify.js';
import { recordAudit } from '../audit/audit.repository.js';
import { pagination } from '../common/response.js';
import {
  findCampaignById,
  findCampaignBySlug,
  findReferralById,
  insertAcquisitionCost,
  insertCampaign,
  insertReferral,
  listAcquisitionCosts,
  listCampaigns,
  listReferrals,
  updateCampaign,
  findReferralByCode,
} from './campaigns.repository.js';

export function createCampaignsService(deps: Container) {
  const { db, logger } = deps;
  const log = logger.child({ module: 'campaigns' });

  async function requireCampaign(id: string) {
    const row = await findCampaignById(db, id);
    if (!row) throw new NotFoundError(ErrorCodes.CAMPAIGN_NOT_FOUND, 'The requested campaign was not found.');
    return row;
  }

  return {
    async list(page: number, pageSize: number) {
      const { rows, total } = await listCampaigns(db, pageSize, (page - 1) * pageSize);
      return { items: rows, page: pagination(page, pageSize, total) };
    },

    async create(actor: AuthUser, input: CreateCampaignInput) {
      if (await findCampaignBySlug(db, input.slug)) {
        throw new ConflictError(ErrorCodes.CONFLICT, 'A campaign with this slug already exists.');
      }
      const row = await db.transaction(async (tx) => {
        const created = await insertCampaign(tx, {
          name: input.name,
          slug: input.slug,
          channel: input.channel,
          status: input.status,
          startsOn: input.startsOn ?? null,
          endsOn: input.endsOn ?? null,
          createdBy: actor.id,
        });
        await recordAudit(tx, { actorId: actor.id, action: 'campaign.created', entityType: 'campaign', entityId: created.id });
        return created;
      });
      log.info({ event: 'campaign.created', campaignId: row.id, actorUserId: actor.id }, 'Campaign created');
      return row;
    },

    async update(actor: AuthUser, id: string, patch: Record<string, unknown>) {
      await requireCampaign(id);
      const row = await db.transaction(async (tx) => {
        const updated = await updateCampaign(tx, id, patch);
        await recordAudit(tx, { actorId: actor.id, action: 'campaign.updated', entityType: 'campaign', entityId: id, metadata: { fields: Object.keys(patch) } });
        return updated;
      });
      return row;
    },

    async get(id: string) {
      return requireCampaign(id);
    },

    async addCost(actor: AuthUser, campaignId: string | null, input: {
      channel: string; amount: string; currency: string; periodStart: string; periodEnd: string; source: 'manual' | 'ad_platform_export';
    }) {
      if (campaignId) await requireCampaign(campaignId);
      const row = await db.transaction(async (tx) => {
        const created = await insertAcquisitionCost(tx, {
          campaignId,
          channel: input.channel,
          amount: input.amount,
          currency: input.currency,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          source: input.source,
          createdBy: actor.id,
        });
        await recordAudit(tx, {
          actorId: actor.id,
          action: 'acquisition_cost.created',
          entityType: 'acquisition_cost',
          entityId: created.id,
          metadata: { currency: input.currency, campaignId },
        });
        return created;
      });
      log.info({ event: 'acquisition_cost.created', costId: row.id, campaignId, currency: input.currency }, 'Acquisition cost recorded');
      return row;
    },

    async listCosts(campaignId: string) {
      await requireCampaign(campaignId);
      return listAcquisitionCosts(db, campaignId);
    },

    async createReferral(actor: AuthUser, input: { code: string; referrerName: string; referrerEmail?: string }) {
      if (await findReferralByCode(db, input.code)) throw new ConflictError(ErrorCodes.CONFLICT, 'This referral code is already in use.');
      const row = await db.transaction(async (tx) => {
        const created = await insertReferral(tx, {
          code: input.code.toUpperCase(),
          referrerName: input.referrerName,
          referrerEmail: input.referrerEmail?.toLowerCase() ?? null,
        });
        await recordAudit(tx, { actorId: actor.id, action: 'referral.created', entityType: 'referral', entityId: created.id });
        return created;
      });
      return row;
    },

    async listReferrals(page: number, pageSize: number) {
      const { rows, total } = await listReferrals(db, pageSize, (page - 1) * pageSize);
      return { items: rows, page: pagination(page, pageSize, total) };
    },

    async getReferral(id: string) {
      const row = await findReferralById(db, id);
      if (!row) throw new NotFoundError(ErrorCodes.NOT_FOUND, 'The requested referral was not found.');
      return row;
    },
  };
}
