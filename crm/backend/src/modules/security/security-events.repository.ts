import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { securityEvents } from '../../db/schema/security.js';
import { users } from '../../db/schema/identity.js';
import { withDbTiming, type Database } from '../../db/client.js';

export interface SecurityEventRow {
  id: string;
  occurredAt: Date;
  event: string;
  level: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
}

export interface SecurityEventFilters {
  event?: string;
  userId?: string;
  from?: Date;
  to?: Date;
}

export async function listSecurityEvents(
  db: Database,
  filters: SecurityEventFilters,
  options: { limit: number; offset: number },
): Promise<{ rows: SecurityEventRow[]; total: number }> {
  const conditions = [
    filters.event ? eq(securityEvents.event, filters.event) : undefined,
    filters.userId ? eq(securityEvents.userId, filters.userId) : undefined,
    filters.from ? gte(securityEvents.occurredAt, filters.from) : undefined,
    filters.to ? lte(securityEvents.occurredAt, filters.to) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);
  const where = conditions.length ? and(...conditions) : undefined;

  return withDbTiming('security-events.list', async () => {
    const [rows, [total]] = await Promise.all([
      db
        .select({
          id: securityEvents.id,
          occurredAt: securityEvents.occurredAt,
          event: securityEvents.event,
          level: securityEvents.level,
          userId: securityEvents.userId,
          userName: users.name,
          userEmail: users.email,
          ip: securityEvents.ip,
          userAgent: securityEvents.userAgent,
          metadata: securityEvents.metadata,
        })
        .from(securityEvents)
        .leftJoin(users, eq(securityEvents.userId, users.id))
        .where(where)
        .orderBy(desc(securityEvents.occurredAt))
        .limit(options.limit)
        .offset(options.offset),
      db.select({ value: count() }).from(securityEvents).where(where),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}
