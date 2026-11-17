import { and, desc, eq, sql, count } from 'drizzle-orm';
import { withDbTiming, type DbExecutor } from '../../db/client.js';
import { acquisitionCosts, campaigns, referrals } from '../../db/schema/index.js';

export type CampaignRow = typeof campaigns.$inferSelect;
export type ReferralRow = typeof referrals.$inferSelect;
export type AcquisitionCostRow = typeof acquisitionCosts.$inferSelect;

export async function findCampaignBySlug(db: DbExecutor, slug: string): Promise<CampaignRow | undefined> {
  const [row] = await withDbTiming('campaigns.find_by_slug', () =>
    db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1),
  );
  return row;
}

export async function findCampaignById(db: DbExecutor, id: string): Promise<CampaignRow | undefined> {
  const [row] = await withDbTiming('campaigns.find', () => db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1));
  return row;
}

export async function listCampaigns(db: DbExecutor, limit: number, offset: number) {
  return withDbTiming('campaigns.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(limit).offset(offset),
      db.select({ value: count() }).from(campaigns),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}

export async function insertCampaign(db: DbExecutor, values: typeof campaigns.$inferInsert): Promise<CampaignRow> {
  const [row] = await withDbTiming('campaigns.insert', () => db.insert(campaigns).values(values).returning());
  if (!row) throw new Error('Campaign insert returned no row');
  return row;
}

export async function updateCampaign(db: DbExecutor, id: string, patch: Partial<typeof campaigns.$inferInsert>) {
  const [row] = await withDbTiming('campaigns.update', () =>
    db.update(campaigns).set({ ...patch, updatedAt: new Date() }).where(eq(campaigns.id, id)).returning(),
  );
  return row;
}

export async function findReferralByCode(db: DbExecutor, code: string): Promise<ReferralRow | undefined> {
  const [row] = await withDbTiming('referrals.find_by_code', () =>
    db
      .select()
      .from(referrals)
      .where(sql`upper(${referrals.code}) = ${code.toUpperCase()}`)
      .limit(1),
  );
  return row;
}

export async function findReferralById(db: DbExecutor, id: string): Promise<ReferralRow | undefined> {
  const [row] = await withDbTiming('referrals.find', () => db.select().from(referrals).where(eq(referrals.id, id)).limit(1));
  return row;
}

export async function insertReferral(db: DbExecutor, values: typeof referrals.$inferInsert): Promise<ReferralRow> {
  const [row] = await withDbTiming('referrals.insert', () => db.insert(referrals).values(values).returning());
  if (!row) throw new Error('Referral insert returned no row');
  return row;
}

export async function listReferrals(db: DbExecutor, limit: number, offset: number) {
  return withDbTiming('referrals.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(referrals).orderBy(desc(referrals.createdAt)).limit(limit).offset(offset),
      db.select({ value: count() }).from(referrals),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}

export async function insertAcquisitionCost(db: DbExecutor, values: typeof acquisitionCosts.$inferInsert): Promise<AcquisitionCostRow> {
  const [row] = await withDbTiming('acquisition_costs.insert', () => db.insert(acquisitionCosts).values(values).returning());
  if (!row) throw new Error('Acquisition cost insert returned no row');
  return row;
}

export async function listAcquisitionCosts(db: DbExecutor, campaignId: string) {
  return withDbTiming('acquisition_costs.list', () =>
    db
      .select()
      .from(acquisitionCosts)
      .where(and(eq(acquisitionCosts.campaignId, campaignId)))
      .orderBy(desc(acquisitionCosts.periodStart)),
  );
}
