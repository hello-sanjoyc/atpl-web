import { and, count, eq, gte, isNotNull, lt, sql } from 'drizzle-orm';
import { withDbTiming, type DbExecutor } from '../../db/client.js';
import { campaigns, customers, leads, opportunities, revenueRecords } from '../../db/schema/index.js';

export interface PeriodBounds {
  from: Date;
  to: Date;
}

export interface MonthlyCount {
  month: string;
  count: number;
}

export async function countLeadsCreated(db: DbExecutor, period: PeriodBounds): Promise<number> {
  const [row] = await withDbTiming('analytics.leads_created', () =>
    db.select({ value: count() }).from(leads).where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to))),
  );
  return Number(row?.value ?? 0);
}

/** Leads created per calendar month within the period, for trend charting. Months with no leads are omitted by the query and backfilled with 0 by the caller. */
export async function countLeadsCreatedByMonth(db: DbExecutor, period: PeriodBounds): Promise<MonthlyCount[]> {
  return withDbTiming('analytics.leads_created_by_month', async () => {
    const rows = await db
      .select({ month: sql<string>`to_char(${leads.createdAt}, 'YYYY-MM')`, value: count() })
      .from(leads)
      .where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to)))
      .groupBy(sql`to_char(${leads.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${leads.createdAt}, 'YYYY-MM')`);
    return rows.map((r) => ({ month: r.month, count: Number(r.value) }));
  });
}

/** Opportunities created per calendar month within the period, for trend charting. */
export async function countOpportunitiesCreatedByMonth(db: DbExecutor, period: PeriodBounds): Promise<MonthlyCount[]> {
  return withDbTiming('analytics.opportunities_created_by_month', async () => {
    const rows = await db
      .select({ month: sql<string>`to_char(${opportunities.createdAt}, 'YYYY-MM')`, value: count() })
      .from(opportunities)
      .where(and(gte(opportunities.createdAt, period.from), lt(opportunities.createdAt, period.to)))
      .groupBy(sql`to_char(${opportunities.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${opportunities.createdAt}, 'YYYY-MM')`);
    return rows.map((r) => ({ month: r.month, count: Number(r.value) }));
  });
}

/** Customers created per calendar month within the period, for trend charting. */
export async function countCustomersCreatedByMonth(db: DbExecutor, period: PeriodBounds): Promise<MonthlyCount[]> {
  return withDbTiming('analytics.customers_created_by_month', async () => {
    const rows = await db
      .select({ month: sql<string>`to_char(${customers.createdAt}, 'YYYY-MM')`, value: count() })
      .from(customers)
      .where(and(gte(customers.createdAt, period.from), lt(customers.createdAt, period.to)))
      .groupBy(sql`to_char(${customers.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${customers.createdAt}, 'YYYY-MM')`);
    return rows.map((r) => ({ month: r.month, count: Number(r.value) }));
  });
}

export interface MonthlyRevenueByCurrency {
  month: string;
  currency: string;
  total: string;
}

/**
 * Revenue recognized per calendar month, per currency, within the period. Left ungrouped across
 * currencies here — converting to a single reporting currency requires looking up stored exchange
 * rates, which the service layer already does for the overview's revenue totals.
 */
export async function sumRevenueByMonth(db: DbExecutor, kind: 'invoiced' | 'collected', period: PeriodBounds): Promise<MonthlyRevenueByCurrency[]> {
  return withDbTiming('analytics.revenue_by_month', async () => {
    const monthExpr = sql<string>`to_char(${revenueRecords.recognizedOn}, 'YYYY-MM')`;
    const rows = await db
      .select({ month: monthExpr, currency: revenueRecords.currency, total: sql<string>`sum(${revenueRecords.amount})::text` })
      .from(revenueRecords)
      .where(
        and(
          eq(revenueRecords.kind, kind),
          gte(revenueRecords.recognizedOn, toDateString(period.from)),
          lt(revenueRecords.recognizedOn, toDateString(period.to)),
        ),
      )
      .groupBy(monthExpr, revenueRecords.currency)
      .orderBy(monthExpr);
    return rows.map((r) => ({ month: r.month, currency: r.currency, total: r.total ?? '0' }));
  });
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

// ── Attribution queries ────────────────────────────────────────────────────────

export interface ChannelAttribution {
  channel: string;
  leadsCreated: number;
  qualifiedLeads: number;
  opportunities: number;
  wonOpportunities: number;
  revenueAttributed: string; // numeric string, sum across currencies
}

export interface CampaignAttribution {
  campaignId: string;
  campaignName: string;
  channel: string;
  leadsCreated: number;
  qualifiedLeads: number;
  opportunities: number;
  wonOpportunities: number;
}

export async function getChannelAttribution(db: DbExecutor, period: PeriodBounds): Promise<ChannelAttribution[]> {
  return withDbTiming('analytics.channel_attribution', async () => {
    // leads per source
    const leadRows = await db
      .select({
        channel: leads.leadSource,
        total: count(),
        qualified: sql<string>`count(*) filter (where ${leads.qualificationStatus} != 'unqualified')`,
      })
      .from(leads)
      .where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to), isNotNull(leads.leadSource)))
      .groupBy(leads.leadSource);

    // opportunities linked via lead.lead_source (join leads → opportunities)
    const oppRows = await db
      .select({
        channel: leads.leadSource,
        total: count(),
        won: sql<string>`count(*) filter (where ${opportunities.status} = 'won')`,
      })
      .from(opportunities)
      .innerJoin(leads, eq(opportunities.leadId, leads.id))
      .where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to), isNotNull(leads.leadSource)))
      .groupBy(leads.leadSource);

    // revenue attributed via lead_source (join revenue_records → opportunities → leads)
    const revRows = await db
      .select({
        channel: leads.leadSource,
        revenue: sql<string>`coalesce(sum(${revenueRecords.amount}), 0)::text`,
      })
      .from(revenueRecords)
      .innerJoin(opportunities, eq(revenueRecords.opportunityId, opportunities.id))
      .innerJoin(leads, eq(opportunities.leadId, leads.id))
      .where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to), isNotNull(leads.leadSource)))
      .groupBy(leads.leadSource);

    const oppMap = new Map(oppRows.map((r) => [r.channel, r]));
    const revMap = new Map(revRows.map((r) => [r.channel, r.revenue]));

    return leadRows.map((r) => ({
      channel: r.channel!,
      leadsCreated: Number(r.total),
      qualifiedLeads: Number(r.qualified),
      opportunities: Number(oppMap.get(r.channel!)?.total ?? 0),
      wonOpportunities: Number(oppMap.get(r.channel!)?.won ?? 0),
      revenueAttributed: revMap.get(r.channel!) ?? '0',
    }));
  });
}

export async function getCampaignAttribution(db: DbExecutor, period: PeriodBounds): Promise<CampaignAttribution[]> {
  return withDbTiming('analytics.campaign_attribution', async () => {
    const leadRows = await db
      .select({
        campaignId: leads.campaignId,
        campaignName: campaigns.name,
        channel: campaigns.channel,
        total: count(),
        qualified: sql<string>`count(*) filter (where ${leads.qualificationStatus} != 'unqualified')`,
      })
      .from(leads)
      .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
      .where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to), isNotNull(leads.campaignId)))
      .groupBy(leads.campaignId, campaigns.name, campaigns.channel);

    const oppRows = await db
      .select({
        campaignId: leads.campaignId,
        total: count(),
        won: sql<string>`count(*) filter (where ${opportunities.status} = 'won')`,
      })
      .from(opportunities)
      .innerJoin(leads, eq(opportunities.leadId, leads.id))
      .where(and(gte(leads.createdAt, period.from), lt(leads.createdAt, period.to), isNotNull(leads.campaignId)))
      .groupBy(leads.campaignId);

    const oppMap = new Map(oppRows.map((r) => [r.campaignId, r]));

    return leadRows.map((r) => ({
      campaignId: r.campaignId!,
      campaignName: r.campaignName,
      channel: r.channel,
      leadsCreated: Number(r.total),
      qualifiedLeads: Number(r.qualified),
      opportunities: Number(oppMap.get(r.campaignId!)?.total ?? 0),
      wonOpportunities: Number(oppMap.get(r.campaignId!)?.won ?? 0),
    }));
  });
}
