import { and, asc, count, desc, eq, gte, ilike, isNull, lte, or, sql, type SQL } from 'drizzle-orm';
import { withDbTiming, type Database, type DbExecutor } from '../../db/client.js';
import {
  leadActivities,
  leadAssignmentHistory,
  leadStageHistory,
  leads,
} from '../../db/schema/index.js';

export type LeadRow = typeof leads.$inferSelect;
export type NewLeadRow = typeof leads.$inferInsert;

export interface LeadListFilter {
  q?: string;
  stage?: string;
  priority?: string;
  qualificationStatus?: string;
  ownerId?: string;
  /** Applied for executives: only records they own. */
  scopeOwnerId?: string;
  source?: string;
  serviceInterest?: string;
  country?: string;
  campaignId?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function buildLeadConditions(filter: LeadListFilter): SQL[] {
  const conditions: SQL[] = [isNull(leads.deletedAt)];
  if (filter.q) {
    const pattern = `%${escapeLike(filter.q)}%`;
    const search = or(ilike(leads.name, pattern), ilike(leads.email, pattern), ilike(leads.company, pattern));
    if (search) conditions.push(search);
  }
  if (filter.stage) conditions.push(eq(leads.stage, filter.stage));
  if (filter.priority) conditions.push(eq(leads.priority, filter.priority));
  if (filter.qualificationStatus) conditions.push(eq(leads.qualificationStatus, filter.qualificationStatus));
  if (filter.ownerId) conditions.push(eq(leads.ownerId, filter.ownerId));
  if (filter.scopeOwnerId) conditions.push(eq(leads.ownerId, filter.scopeOwnerId));
  if (filter.source) conditions.push(eq(leads.source, filter.source));
  if (filter.serviceInterest) conditions.push(eq(leads.serviceInterest, filter.serviceInterest));
  if (filter.country) conditions.push(eq(leads.country, filter.country));
  if (filter.campaignId) conditions.push(eq(leads.campaignId, filter.campaignId));
  if (filter.createdFrom) conditions.push(gte(leads.createdAt, filter.createdFrom));
  if (filter.createdTo) conditions.push(lte(leads.createdAt, filter.createdTo));
  return conditions;
}

export async function findLeadById(db: DbExecutor, id: string): Promise<LeadRow | undefined> {
  const [row] = await withDbTiming('leads.find', () =>
    db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
      .limit(1),
  );
  return row;
}

export async function listLeadsByReferralId(db: DbExecutor, referralId: string): Promise<LeadRow[]> {
  return withDbTiming('leads.list_by_referral', () =>
    db
      .select()
      .from(leads)
      .where(and(eq(leads.referralId, referralId), isNull(leads.deletedAt)))
      .orderBy(asc(leads.name)),
  );
}

export async function findLiveLeadByEmail(db: DbExecutor, email: string): Promise<LeadRow | undefined> {
  const [row] = await withDbTiming('leads.find_by_email', () =>
    db
      .select()
      .from(leads)
      .where(and(eq(leads.email, email), isNull(leads.deletedAt)))
      .limit(1),
  );
  return row;
}

/**
 * Inserts a lead unless a live lead already has the same email. The partial unique index makes
 * this race-free: concurrent submissions for one address result in exactly one row.
 */
export async function insertLeadIfNew(db: DbExecutor, values: NewLeadRow): Promise<LeadRow | undefined> {
  const [row] = await withDbTiming('leads.insert', () =>
    db
      .insert(leads)
      .values(values)
      .onConflictDoNothing({ target: leads.email, where: sql`${leads.deletedAt} is null` })
      .returning(),
  );
  return row;
}

export async function insertLeadRow(db: DbExecutor, values: NewLeadRow): Promise<LeadRow> {
  const [row] = await withDbTiming('leads.insert', () => db.insert(leads).values(values).returning());
  if (!row) throw new Error('Lead insert returned no row');
  return row;
}

export async function updateLeadRow(db: DbExecutor, id: string, patch: Partial<NewLeadRow>): Promise<LeadRow | undefined> {
  const [row] = await withDbTiming('leads.update', () =>
    db
      .update(leads)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
      .returning(),
  );
  return row;
}

export async function softDeleteLeadRow(db: DbExecutor, id: string): Promise<void> {
  await withDbTiming('leads.soft_delete', () =>
    db.update(leads).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, id)),
  );
}

export async function listLeadRows(
  db: Database,
  filter: LeadListFilter,
  options: { limit: number; offset: number; sort: 'createdAt' | 'updatedAt' | 'score' | 'name'; order: 'asc' | 'desc' },
): Promise<{ rows: LeadRow[]; total: number }> {
  const where = and(...buildLeadConditions(filter));
  const sortColumn = {
    createdAt: leads.createdAt,
    updatedAt: leads.updatedAt,
    score: leads.score,
    name: leads.name,
  }[options.sort];
  const order = options.order === 'asc' ? asc(sortColumn) : desc(sortColumn);
  return withDbTiming('leads.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(leads).where(where).orderBy(order, asc(leads.id)).limit(options.limit).offset(options.offset),
      db.select({ value: count() }).from(leads).where(where),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}

export async function insertStageHistory(
  db: DbExecutor,
  entry: { leadId: string; fromStage: string | null; toStage: string; actorId?: string | null; reason?: string | null },
): Promise<void> {
  await withDbTiming('leads.stage_history.insert', () =>
    db.insert(leadStageHistory).values({
      leadId: entry.leadId,
      fromStage: entry.fromStage,
      toStage: entry.toStage,
      actorId: entry.actorId ?? null,
      reason: entry.reason ?? null,
    }),
  );
}

export async function listStageHistory(db: DbExecutor, leadId: string) {
  return withDbTiming('leads.stage_history.list', () =>
    db.select().from(leadStageHistory).where(eq(leadStageHistory.leadId, leadId)).orderBy(asc(leadStageHistory.createdAt)),
  );
}

export async function insertAssignmentHistory(
  db: DbExecutor,
  entry: { leadId: string; fromOwnerId: string | null; toOwnerId: string | null; actorId?: string | null },
): Promise<void> {
  await withDbTiming('leads.assignment_history.insert', () =>
    db.insert(leadAssignmentHistory).values({
      leadId: entry.leadId,
      fromOwnerId: entry.fromOwnerId,
      toOwnerId: entry.toOwnerId,
      actorId: entry.actorId ?? null,
    }),
  );
}

export async function listAssignmentHistory(db: DbExecutor, leadId: string) {
  return withDbTiming('leads.assignment_history.list', () =>
    db
      .select()
      .from(leadAssignmentHistory)
      .where(eq(leadAssignmentHistory.leadId, leadId))
      .orderBy(asc(leadAssignmentHistory.createdAt)),
  );
}

export async function insertActivity(
  db: DbExecutor,
  entry: { leadId: string; type: string; body?: string | null; metadata?: Record<string, unknown>; actorId?: string | null },
): Promise<void> {
  await withDbTiming('leads.activity.insert', () =>
    db.insert(leadActivities).values({
      leadId: entry.leadId,
      type: entry.type,
      body: entry.body ?? null,
      metadata: entry.metadata ?? {},
      actorId: entry.actorId ?? null,
    }),
  );
}

export async function listActivities(
  db: DbExecutor,
  leadId: string,
  options: { limit: number; offset: number },
): Promise<{ rows: (typeof leadActivities.$inferSelect)[]; total: number }> {
  return withDbTiming('leads.activity.list', async () => {
    const where = eq(leadActivities.leadId, leadId);
    const [rows, [total]] = await Promise.all([
      db.select().from(leadActivities).where(where).orderBy(desc(leadActivities.createdAt)).limit(options.limit).offset(options.offset),
      db.select({ value: count() }).from(leadActivities).where(where),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}
