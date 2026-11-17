import { and, asc, count, desc, eq, gte, lte, lt, sql, type SQL } from 'drizzle-orm';
import { withDbTiming, type DbExecutor } from '../../db/client.js';
import { exchangeRates, revenueRecords } from '../../db/schema/index.js';

export type RevenueRow = typeof revenueRecords.$inferSelect;
export type ExchangeRateRow = typeof exchangeRates.$inferSelect;

export async function insertRevenueRecord(db: DbExecutor, values: typeof revenueRecords.$inferInsert): Promise<RevenueRow> {
  const [row] = await withDbTiming('revenue.insert', () => db.insert(revenueRecords).values(values).returning());
  if (!row) throw new Error('Revenue insert returned no row');
  return row;
}

export async function listRevenueRecords(
  db: DbExecutor,
  filter: { kind?: string; currency?: string; from?: string; to?: string; customerId?: string },
  options: { limit: number; offset: number },
): Promise<{ rows: RevenueRow[]; total: number }> {
  const conditions: SQL[] = [];
  if (filter.kind) conditions.push(eq(revenueRecords.kind, filter.kind));
  if (filter.currency) conditions.push(eq(revenueRecords.currency, filter.currency));
  if (filter.customerId) conditions.push(eq(revenueRecords.customerId, filter.customerId));
  if (filter.from) conditions.push(gte(revenueRecords.recognizedOn, filter.from));
  if (filter.to) conditions.push(lte(revenueRecords.recognizedOn, filter.to));
  const where = conditions.length ? and(...conditions) : undefined;
  return withDbTiming('revenue.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(revenueRecords).where(where).orderBy(desc(revenueRecords.recognizedOn), asc(revenueRecords.id)).limit(options.limit).offset(options.offset),
      db.select({ value: count() }).from(revenueRecords).where(where),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}

export async function listRevenueForCustomer(db: DbExecutor, customerId: string): Promise<RevenueRow[]> {
  return withDbTiming('revenue.by_customer', () =>
    db.select().from(revenueRecords).where(eq(revenueRecords.customerId, customerId)).orderBy(desc(revenueRecords.recognizedOn)),
  );
}

/** Sums revenue per currency in SQL (exact NUMERIC arithmetic); conversion happens in the service. */
export async function sumRevenueByCurrency(
  db: DbExecutor,
  options: { kind: 'invoiced' | 'collected'; from: string; to: string; customerIds?: string[] },
): Promise<Array<{ currency: string; total: string }>> {
  const conditions: SQL[] = [
    eq(revenueRecords.kind, options.kind),
    gte(revenueRecords.recognizedOn, options.from),
    lt(revenueRecords.recognizedOn, options.to),
  ];
  return withDbTiming('revenue.sum_by_currency', async () => {
    const rows = await db
      .select({ currency: revenueRecords.currency, total: sql<string>`sum(${revenueRecords.amount})::text` })
      .from(revenueRecords)
      .where(and(...conditions))
      .groupBy(revenueRecords.currency);
    return rows.map((r) => ({ currency: r.currency, total: r.total ?? '0' }));
  });
}

export async function insertExchangeRate(db: DbExecutor, values: typeof exchangeRates.$inferInsert): Promise<ExchangeRateRow> {
  const [row] = await withDbTiming('exchange_rates.insert', () => db.insert(exchangeRates).values(values).returning());
  if (!row) throw new Error('Exchange rate insert returned no row');
  return row;
}

export async function listExchangeRates(db: DbExecutor, options: { limit: number; offset: number }) {
  return withDbTiming('exchange_rates.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(exchangeRates).orderBy(desc(exchangeRates.rateDate), asc(exchangeRates.base)).limit(options.limit).offset(options.offset),
      db.select({ value: count() }).from(exchangeRates),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}

/** Latest rate for base->quote on or before `asOf` (YYYY-MM-DD). Rates are never invented. */
export async function findLatestRate(db: DbExecutor, base: string, quote: string, asOf: string): Promise<ExchangeRateRow | undefined> {
  const [row] = await withDbTiming('exchange_rates.latest', () =>
    db
      .select()
      .from(exchangeRates)
      .where(and(eq(exchangeRates.base, base), eq(exchangeRates.quote, quote), lte(exchangeRates.rateDate, asOf)))
      .orderBy(desc(exchangeRates.rateDate), desc(exchangeRates.createdAt))
      .limit(1),
  );
  return row;
}
