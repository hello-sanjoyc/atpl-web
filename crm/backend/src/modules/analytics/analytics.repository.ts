import { and, count, eq, gte, lt, sql } from 'drizzle-orm';
import { withDbTiming, type DbExecutor } from '../../db/client.js';
import { leads, opportunities, revenueRecords } from '../../db/schema/index.js';

export interface PeriodBounds {
  from: Date;
  to: Date;
}

export async function countLeadsCreated(db: DbExecutor, period: PeriodBounds): Promise<number> {
  const [row] = await withDbTiming('analytics.leads_created', () =>
    db.select({ value: count() }).from(leads).where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to))),
  );
  return Number(row?.value ?? 0);
}

export async function countLeadsByQualification(db: DbExecutor, period: PeriodBounds) {
  return withDbTiming('analytics.leads_by_qualification', async () => {
    const rows = await db
      .select({ status: leads.qualificationStatus, value: count() })
      .from(leads)
      .where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to)))
      .groupBy(leads.qualificationStatus);
    return rows.map((r) => ({ status: r.status, count: Number(r.value) }));
  });
}

export async function countOpportunitiesByStatus(db: DbExecutor, period: PeriodBounds) {
  return withDbTiming('analytics.opportunities_by_status', async () => {
    const rows = await db
      .select({ status: opportunities.status, value: count() })
      .from(opportunities)
      .where(and(gte(opportunities.createdAt, period.from), lt(opportunities.createdAt, period.to)))
      .groupBy(opportunities.status);
    return rows.map((r) => ({ status: r.status, count: Number(r.value) }));
  });
}

/** Revenue summed per currency in SQL using exact NUMERIC arithmetic. Conversion happens in the service. */
export async function sumRevenueForPeriod(db: DbExecutor, kind: 'invoiced' | 'collected', period: PeriodBounds) {
  return withDbTiming('analytics.revenue_by_currency', async () => {
    const rows = await db
      .select({ currency: revenueRecords.currency, total: sql<string>`sum(${revenueRecords.amount})::text` })
      .from(revenueRecords)
      .where(
        and(
          eq(revenueRecords.kind, kind),
          gte(revenueRecords.recognizedOn, toDateString(period.from)),
          lt(revenueRecords.recognizedOn, toDateString(period.to)),
        ),
      )
      .groupBy(revenueRecords.currency);
    return rows.map((r) => ({ currency: r.currency, total: r.total ?? '0' }));
  });
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
