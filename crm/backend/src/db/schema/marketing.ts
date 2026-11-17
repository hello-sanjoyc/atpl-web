import { sql } from 'drizzle-orm';
import { check, date, index, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { currencyCode, inList, money, timestamps, tstz } from './common.js';

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    /** Matched against the UTM campaign parameter for attribution. */
    slug: text('slug').notNull(),
    channel: text('channel').notNull(),
    status: text('status').notNull().default('active'),
    startsOn: date('starts_on', { mode: 'string' }),
    endsOn: date('ends_on', { mode: 'string' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('campaigns_slug_uq').on(t.slug),
    check('campaigns_status_chk', inList(t.status, ['active', 'paused', 'ended'])),
  ],
);

export const acquisitionCosts = pgTable(
  'acquisition_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    channel: text('channel').notNull(),
    amount: money('amount').notNull(),
    currency: currencyCode().notNull(),
    periodStart: date('period_start', { mode: 'string' }).notNull(),
    periodEnd: date('period_end', { mode: 'string' }).notNull(),
    source: text('source').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('acquisition_costs_period_idx').on(t.periodStart, t.periodEnd),
    check('acquisition_costs_amount_chk', sql`${t.amount} >= 0`),
  ],
);

export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    referrerName: text('referrer_name').notNull(),
    referrerEmail: text('referrer_email'),
    ...timestamps,
  },
  (t) => [uniqueIndex('referrals_code_uq').on(sql`upper(${t.code})`)],
);
