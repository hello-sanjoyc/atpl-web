import { and, count, desc, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm';
import { auditLogs } from '../../db/schema/platform.js';
import { users } from '../../db/schema/identity.js';
import { leads } from '../../db/schema/leads.js';
import { campaigns, referrals, acquisitionCosts } from '../../db/schema/marketing.js';
import { customers, contacts, opportunities, contracts, followUpTasks } from '../../db/schema/sales.js';
import { revenueRecords, exchangeRates } from '../../db/schema/finance.js';
import { withDbTiming, type Database } from '../../db/client.js';

export interface AuditLogRow {
  id: string;
  occurredAt: Date;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  metadata: Record<string, unknown>;
  correlationId: string | null;
}

/**
 * entity_id has no DB-level FK (it spans many tables keyed by entityType), so the display name is
 * resolved per entity type against each table's natural name column, in a handful of batched
 * queries (one per entity type present on the page) rather than one query per row.
 */
const ENTITY_NAME_QUERIES: Partial<Record<string, (db: Database, ids: string[]) => Promise<{ id: string; name: string }[]>>> = {
  lead: (db, ids) => db.select({ id: leads.id, name: leads.name }).from(leads).where(inArray(leads.id, ids)),
  customer: (db, ids) => db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.id, ids)),
  contact: (db, ids) => db.select({ id: contacts.id, name: contacts.name }).from(contacts).where(inArray(contacts.id, ids)),
  opportunity: (db, ids) => db.select({ id: opportunities.id, name: opportunities.title }).from(opportunities).where(inArray(opportunities.id, ids)),
  campaign: (db, ids) => db.select({ id: campaigns.id, name: campaigns.name }).from(campaigns).where(inArray(campaigns.id, ids)),
  referral: (db, ids) => db.select({ id: referrals.id, name: referrals.referrerName }).from(referrals).where(inArray(referrals.id, ids)),
  contract: (db, ids) => db.select({ id: contracts.id, name: contracts.name }).from(contracts).where(inArray(contracts.id, ids)),
  user: (db, ids) => db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ids)),
  follow_up: (db, ids) => db.select({ id: followUpTasks.id, name: followUpTasks.title }).from(followUpTasks).where(inArray(followUpTasks.id, ids)),
  revenue_record: async (db, ids) => {
    const rows = await db
      .select({ id: revenueRecords.id, kind: revenueRecords.kind, amount: revenueRecords.amount, currency: revenueRecords.currency })
      .from(revenueRecords)
      .where(inArray(revenueRecords.id, ids));
    return rows.map((r) => ({ id: r.id, name: `${r.kind} · ${r.amount} ${r.currency}` }));
  },
  exchange_rate: async (db, ids) => {
    const rows = await db
      .select({ id: exchangeRates.id, base: exchangeRates.base, quote: exchangeRates.quote, rateDate: exchangeRates.rateDate })
      .from(exchangeRates)
      .where(inArray(exchangeRates.id, ids));
    return rows.map((r) => ({ id: r.id, name: `${r.base}/${r.quote} (${r.rateDate})` }));
  },
  acquisition_cost: async (db, ids) => {
    const rows = await db
      .select({ id: acquisitionCosts.id, channel: acquisitionCosts.channel, amount: acquisitionCosts.amount, currency: acquisitionCosts.currency })
      .from(acquisitionCosts)
      .where(inArray(acquisitionCosts.id, ids));
    return rows.map((r) => ({ id: r.id, name: `${r.channel} · ${r.amount} ${r.currency}` }));
  },
};

async function resolveEntityNames(
  db: Database,
  rows: { entityType: string; entityId: string }[],
): Promise<Map<string, string>> {
  const idsByType = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!ENTITY_NAME_QUERIES[row.entityType]) continue;
    if (!idsByType.has(row.entityType)) idsByType.set(row.entityType, new Set());
    idsByType.get(row.entityType)!.add(row.entityId);
  }

  const result = new Map<string, string>();
  await Promise.all(
    [...idsByType.entries()].map(async ([entityType, idSet]) => {
      const query = ENTITY_NAME_QUERIES[entityType];
      if (!query) return;
      const found = await query(db, [...idSet]);
      for (const r of found) result.set(`${entityType}:${r.id}`, r.name);
    }),
  );
  return result;
}

function humanizeEntityType(entityType: string): string {
  return entityType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface AuditLogFilters {
  entityType?: string;
  actorId?: string;
  action?: string;
  /** Matches entityId or actor name/email. */
  search?: string;
  from?: Date;
  to?: Date;
}

export async function listAuditLogs(
  db: Database,
  filters: AuditLogFilters,
  options: { limit: number; offset: number },
): Promise<{ rows: AuditLogRow[]; total: number }> {
  const conditions = [
    filters.entityType ? eq(auditLogs.entityType, filters.entityType) : undefined,
    filters.actorId ? eq(auditLogs.actorId, filters.actorId) : undefined,
    filters.action ? eq(auditLogs.action, filters.action) : undefined,
    filters.from ? gte(auditLogs.occurredAt, filters.from) : undefined,
    filters.to ? lte(auditLogs.occurredAt, filters.to) : undefined,
    filters.search
      ? or(ilike(auditLogs.entityId, `%${filters.search}%`), ilike(users.name, `%${filters.search}%`), ilike(users.email, `%${filters.search}%`))
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);
  const where = conditions.length ? and(...conditions) : undefined;

  return withDbTiming('audit-logs.list', async () => {
    const [rawRows, [total]] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          occurredAt: auditLogs.occurredAt,
          actorId: auditLogs.actorId,
          actorName: users.name,
          actorEmail: users.email,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          metadata: auditLogs.metadata,
          correlationId: auditLogs.correlationId,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .where(where)
        .orderBy(desc(auditLogs.occurredAt))
        .limit(options.limit)
        .offset(options.offset),
      db
        .select({ value: count() })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .where(where),
    ]);
    const names = await resolveEntityNames(db, rawRows);
    const rows = rawRows.map((r) => ({
      ...r,
      // Never falls back to the raw UUID: an entity type with no name source (export, booking) gets
      // a humanized type label instead, so the Audit Trail UI never has to render an id.
      entityName: names.get(`${r.entityType}:${r.entityId}`) ?? humanizeEntityType(r.entityType),
    }));
    return { rows, total: Number(total?.value ?? 0) };
  });
}

export async function listAuditEntityTypes(db: Database): Promise<string[]> {
  const rows = await db.selectDistinct({ entityType: auditLogs.entityType }).from(auditLogs).orderBy(auditLogs.entityType);
  return rows.map((r) => r.entityType);
}
