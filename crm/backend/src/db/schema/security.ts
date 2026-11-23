import { sql } from 'drizzle-orm';
import { index, inet, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { tstz } from './common.js';
import { users } from './identity.js';

/**
 * Persisted security/auth events (login attempts, lockouts, invalid tokens, access denials, rate
 * limiting, webhook signature failures, spam suppression, permission changes). Written
 * unconditionally by SecurityEventLogger.record(), independent of the Pino log-sink's own
 * 30/min-per-event rate limit — persistence must never silently drop events.
 */
export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    occurredAt: tstz('occurred_at').notNull().defaultNow(),
    event: text('event').notNull(),
    level: text('level').notNull().default('warn'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    ip: inet('ip'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  },
  (t) => [
    index('security_events_occurred_idx').on(t.occurredAt),
    index('security_events_event_idx').on(t.event),
    index('security_events_user_idx').on(t.userId),
  ],
);
