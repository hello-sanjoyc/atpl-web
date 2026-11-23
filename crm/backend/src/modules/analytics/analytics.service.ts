import type { Container } from '../../container.js';
import type { AuthUser } from '../../types/fastify.js';
import { recordAudit } from '../audit/audit.repository.js';
import { findLatestRate } from '../revenue/revenue.repository.js';
import { listLeadRows, type LeadListFilter } from '../leads/leads.repository.js';
import { maskContact, ownerScope } from '../leads/lead-access.js';
import { listRevenueRecords } from '../revenue/revenue.repository.js';
import { EXPORT_ROW_LIMIT, type Permission } from '../../config/constants.js';
import { newId } from '../../logger/correlation.js';
import { toCsv } from '../../utils/csv.js';
import { MoneyDecimal, moneyInsufficient, moneyOk, toMoney, type MoneyResult } from '../../utils/money.js';
import { resolvePeriod, type PeriodQuery } from '../../utils/period.js';
import {
  countCustomersCreatedByMonth,
  countLeadsByQualification,
  countLeadsCreated,
  countLeadsCreatedByMonth,
  countOpportunitiesByStatus,
  countOpportunitiesCreatedByMonth,
  sumRevenueByMonth,
  sumRevenueForPeriod,
  toDateString,
  type MonthlyCount,
  type MonthlyRevenueByCurrency,
  type PeriodBounds,
} from './analytics.repository.js';
import { getPermissionsForRole } from '../rbac/rbac.service.js';

/** Lists "YYYY-MM" for every calendar month in [period.from, period.to), capped at 24 so a multi-year period stays readable. `period.to` is exclusive. */
function monthsInPeriod(period: PeriodBounds): string[] {
  const months: string[] = [];
  const cursor = new Date(Date.UTC(period.from.getUTCFullYear(), period.from.getUTCMonth(), 1));
  const end = new Date(Date.UTC(period.to.getUTCFullYear(), period.to.getUTCMonth(), 1));
  while (cursor < end && months.length < 24) {
    months.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

/** Fills in zero-count months the query omitted, so the trend chart gets a continuous axis. */
function backfillMonths(rows: MonthlyCount[], months: string[]): MonthlyCount[] {
  const byMonth = new Map(rows.map((r) => [r.month, r.count]));
  return months.map((month) => ({ month, count: byMonth.get(month) ?? 0 }));
}

/** The trailing `n` calendar months (UTC), ending with the current month — e.g. n=12 on Nov 2026 covers Dec 2025 through Nov 2026. */
function lastNMonthsPeriod(now: Date, n: number): PeriodBounds {
  const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1), 1));
  const to = new Date(Date.UTC(startOfThisMonth.getUTCFullYear(), startOfThisMonth.getUTCMonth() + 1, 1));
  return { from, to };
}

export function createAnalyticsService(deps: Container) {
  const { db, cache, logger, now } = deps;

  async function hasPermission(user: AuthUser, permission: Permission): Promise<boolean> {
    const granted = await getPermissionsForRole(db, cache, user.role);
    return granted.has(permission);
  }
  const log = logger.child({ module: 'analytics' });

  /** Converts per-currency totals into the base currency using stored rates only. Missing rates yield insufficient_data. */
  async function convertTotals(totals: Array<{ currency: string; total: string }>, base: string, asOf: string): Promise<MoneyResult> {
    let sum = new MoneyDecimal(0);
    const missing: string[] = [];
    for (const item of totals) {
      if (item.currency === base) {
        sum = sum.plus(toMoney(item.total));
        continue;
      }
      const rate = await findLatestRate(db, item.currency, base, asOf);
      if (!rate) {
        missing.push(item.currency);
        continue;
      }
      sum = sum.plus(toMoney(item.total).times(toMoney(rate.rate)));
    }
    if (missing.length > 0) return moneyInsufficient(`No stored exchange rate to ${base} on or before ${asOf}.`, missing);
    return moneyOk(sum, base);
  }

  return {
    async overview(user: AuthUser, query: PeriodQuery & { baseCurrency: string }) {
      const resolved = resolvePeriod(query, now());
      const period: PeriodBounds = resolved;
      const asOf = toDateString(new Date(resolved.to.getTime() - 86_400_000));
      const canSeeFinancials = await hasPermission(user, 'analytics.financial');

      const [leadsCreated, byQualification, byStatus, leadsByMonthRaw] = await Promise.all([
        countLeadsCreated(db, period),
        countLeadsByQualification(db, period),
        countOpportunitiesByStatus(db, period),
        countLeadsCreatedByMonth(db, period),
      ]);
      const leadsByMonth = backfillMonths(leadsByMonthRaw, monthsInPeriod(period));
      const won = byStatus.find((s) => s.status === 'won')?.count ?? 0;
      const lost = byStatus.find((s) => s.status === 'lost')?.count ?? 0;
      const open = byStatus.find((s) => s.status === 'open')?.count ?? 0;
      const decided = won + lost;

      const result: Record<string, unknown> = {
        period: { from: toDateString(resolved.from), to: toDateString(new Date(resolved.to.getTime() - 86_400_000)) },
        funnel: {
          leadsCreated,
          qualificationBreakdown: byQualification,
          opportunities: { open, won, lost },
          leadToWonRate: leadsCreated > 0 ? (won / leadsCreated).toFixed(4) : null,
          winRate: decided > 0 ? (won / decided).toFixed(4) : null,
          leadsByMonth,
        },
      };

      if (canSeeFinancials) {
        const [invoiced, collected] = await Promise.all([
          sumRevenueForPeriod(db, 'invoiced', period),
          sumRevenueForPeriod(db, 'collected', period),
        ]);
        result.revenue = {
          baseCurrency: query.baseCurrency,
          invoiced: await convertTotals(invoiced, query.baseCurrency, asOf),
          collected: await convertTotals(collected, query.baseCurrency, asOf),
        };
      }
      return result;
    },

    /** Monthly trend series (leads, opportunities, customers, revenue) for the last `months` calendar months, for Dashboard trend charts. */
    async trends(user: AuthUser, input: { months: number; baseCurrency: string }) {
      const period = lastNMonthsPeriod(now(), input.months);
      const months = monthsInPeriod(period);
      const canSeeFinancials = await hasPermission(user, 'analytics.financial');

      const [leadsRaw, opportunitiesRaw, customersRaw, revenueRaw] = await Promise.all([
        countLeadsCreatedByMonth(db, period),
        countOpportunitiesCreatedByMonth(db, period),
        countCustomersCreatedByMonth(db, period),
        canSeeFinancials ? sumRevenueByMonth(db, 'invoiced', period) : Promise.resolve<MonthlyRevenueByCurrency[]>([]),
      ]);

      const result: Record<string, unknown> = {
        months,
        leads: backfillMonths(leadsRaw, months),
        opportunities: backfillMonths(opportunitiesRaw, months),
        customers: backfillMonths(customersRaw, months),
      };

      if (canSeeFinancials) {
        const asOf = toDateString(new Date(period.to.getTime() - 86_400_000));
        const byMonth = new Map<string, Array<{ currency: string; total: string }>>();
        for (const row of revenueRaw) {
          if (!byMonth.has(row.month)) byMonth.set(row.month, []);
          byMonth.get(row.month)!.push({ currency: row.currency, total: row.total });
        }
        const revenue: MonthlyCount[] = [];
        for (const month of months) {
          const totals = byMonth.get(month) ?? [];
          const converted = await convertTotals(totals, input.baseCurrency, asOf);
          revenue.push({ month, count: converted.status === 'ok' ? Number(converted.amount) : 0 });
        }
        result.revenue = { baseCurrency: input.baseCurrency, series: revenue };
      }

      return result;
    },

    async exportLeadsCsv(user: AuthUser, filter: Omit<LeadListFilter, 'ownerId'> & { ownerId?: string }) {
      const scope = ownerScope(user) ?? filter.ownerId;
      const rows = await listLeadRows(db, { ...filter, ownerId: scope }, { limit: EXPORT_ROW_LIMIT, offset: 0, sort: 'createdAt', order: 'desc' });
      const includePii = await hasPermission(user, 'leads.pii');
      const records = rows.rows.map((row) => (includePii ? row : maskContact(row, user)));
      const csv = toCsv(
        ['id', 'name', 'email', 'phone', 'company', 'stage', 'score', 'priority', 'qualification', 'owner_id', 'created_at'],
        records.map((r) => [r.id, r.name, r.email, r.phone, r.company, r.stage, r.score, r.priority, r.qualificationStatus, r.ownerId, r.createdAt.toISOString()]),
      );
      await db.transaction((tx) =>
        recordAudit(tx, { actorId: user.id, action: 'export.leads_csv', entityType: 'export', entityId: newId('exp'), metadata: { rows: rows.rows.length, pii: includePii } }),
      );
      log.info({ event: 'export.leads_csv', rows: rows.rows.length, actorUserId: user.id }, 'Lead export generated');
      return { csv, rowCount: rows.rows.length, truncated: rows.total > EXPORT_ROW_LIMIT };
    },

    async exportRevenueCsv(user: AuthUser, query: PeriodQuery & { kind?: 'invoiced' | 'collected'; currency?: string; customerId?: string }) {
      const resolved = resolvePeriod(query, now());
      const { rows, total } = await listRevenueRecords(
        db,
        {
          kind: query.kind,
          currency: query.currency,
          customerId: query.customerId,
          from: toDateString(resolved.from),
          to: toDateString(new Date(resolved.to.getTime() - 86_400_000)),
        },
        { limit: EXPORT_ROW_LIMIT, offset: 0, sort: 'recognizedOn', order: 'desc' },
      );
      const csv = toCsv(
        ['id', 'customer_id', 'opportunity_id', 'contract_id', 'kind', 'amount', 'currency', 'recognized_on', 'reference'],
        rows.map((r) => [r.id, r.customerId, r.opportunityId, r.contractId, r.kind, r.amount, r.currency, r.recognizedOn, r.reference]),
      );
      await db.transaction((tx) =>
        recordAudit(tx, { actorId: user.id, action: 'export.revenue_csv', entityType: 'export', entityId: newId('exp'), metadata: { rows: rows.length } }),
      );
      log.info({ event: 'export.revenue_csv', rows: rows.length, actorUserId: user.id }, 'Revenue export generated');
      return { csv, rowCount: rows.length, truncated: total > EXPORT_ROW_LIMIT };
    },
  };
}
