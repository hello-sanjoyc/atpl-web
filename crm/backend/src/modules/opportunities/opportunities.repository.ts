import { and, asc, count, desc, eq, gte, isNull, lte, type SQL } from 'drizzle-orm';
import { withDbTiming, type DbExecutor } from '../../db/client.js';
import { opportunities, opportunityStageHistory } from '../../db/schema/index.js';

export type OpportunityRow = typeof opportunities.$inferSelect;

export interface OpportunityFilter {
  stage?: string;
  status?: string;
  ownerId?: string;
  scopeOwnerId?: string;
  opportunityType?: string;
  currency?: string;
  closeFrom?: string;
  closeTo?: string;
  country?: string;
}

function conditions(filter: OpportunityFilter): SQL[] {
  const out: SQL[] = [];
  if (filter.stage) out.push(eq(opportunities.stage, filter.stage));
  if (filter.status) out.push(eq(opportunities.status, filter.status));
  if (filter.ownerId) out.push(eq(opportunities.ownerId, filter.ownerId));
  if (filter.scopeOwnerId) out.push(eq(opportunities.ownerId, filter.scopeOwnerId));
  if (filter.opportunityType) out.push(eq(opportunities.opportunityType, filter.opportunityType));
  if (filter.currency) out.push(eq(opportunities.currency, filter.currency));
  if (filter.country) out.push(eq(opportunities.country, filter.country));
  if (filter.closeFrom) out.push(gte(opportunities.expectedCloseDate, filter.closeFrom));
  if (filter.closeTo) out.push(lte(opportunities.expectedCloseDate, filter.closeTo));
  return out;
}

export async function findOpportunityById(db: DbExecutor, id: string): Promise<OpportunityRow | undefined> {
  const [row] = await withDbTiming('opportunities.find', () =>
    db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1),
  );
  return row;
}

export async function listOpportunities(
  db: DbExecutor,
  filter: OpportunityFilter,
  options: { limit: number; offset: number; sort: 'createdAt' | 'estimatedValue' | 'expectedCloseDate'; order: 'asc' | 'desc' },
): Promise<{ rows: OpportunityRow[]; total: number }> {
  const where = and(...conditions(filter));
  const column = { createdAt: opportunities.createdAt, estimatedValue: opportunities.estimatedValue, expectedCloseDate: opportunities.expectedCloseDate }[options.sort];
  const order = options.order === 'asc' ? asc(column) : desc(column);
  return withDbTiming('opportunities.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(opportunities).where(where).orderBy(order, asc(opportunities.id)).limit(options.limit).offset(options.offset),
      db.select({ value: count() }).from(opportunities).where(where),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}

/** All open opportunities matching the filter, used by analytics. Bounded by the caller. */
export async function listOpenOpportunities(db: DbExecutor, filter: OpportunityFilter): Promise<OpportunityRow[]> {
  return withDbTiming('opportunities.open_list', () =>
    db
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.status, 'open'), isNull(opportunities.wonAt), ...conditions({ ...filter, status: undefined })))
      .orderBy(asc(opportunities.id)),
  );
}

export async function insertOpportunity(db: DbExecutor, values: typeof opportunities.$inferInsert): Promise<OpportunityRow> {
  const [row] = await withDbTiming('opportunities.insert', () => db.insert(opportunities).values(values).returning());
  if (!row) throw new Error('Opportunity insert returned no row');
  return row;
}

export async function updateOpportunity(db: DbExecutor, id: string, patch: Partial<typeof opportunities.$inferInsert>): Promise<OpportunityRow | undefined> {
  const [row] = await withDbTiming('opportunities.update', () =>
    db
      .update(opportunities)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(opportunities.id, id))
      .returning(),
  );
  return row;
}

export async function insertOpportunityStageHistory(
  db: DbExecutor,
  entry: { opportunityId: string; fromStage: string | null; toStage: string; actorId: string | null; reason?: string | null },
): Promise<void> {
  await withDbTiming('opportunities.stage_history.insert', () =>
    db.insert(opportunityStageHistory).values({
      opportunityId: entry.opportunityId,
      fromStage: entry.fromStage,
      toStage: entry.toStage,
      actorId: entry.actorId,
      reason: entry.reason ?? null,
    }),
  );
}

export async function listOpportunityStageHistory(db: DbExecutor, opportunityId: string) {
  return withDbTiming('opportunities.stage_history.list', () =>
    db
      .select()
      .from(opportunityStageHistory)
      .where(eq(opportunityStageHistory.opportunityId, opportunityId))
      .orderBy(asc(opportunityStageHistory.createdAt)),
  );
}

export async function listOpportunitiesForCustomer(db: DbExecutor, customerId: string): Promise<OpportunityRow[]> {
  return withDbTiming('opportunities.by_customer', () =>
    db.select().from(opportunities).where(eq(opportunities.customerId, customerId)).orderBy(desc(opportunities.createdAt)),
  );
}
