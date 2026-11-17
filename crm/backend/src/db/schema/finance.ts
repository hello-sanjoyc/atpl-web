import { sql } from 'drizzle-orm';
import { check, date, index, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { currencyCode, inList, money, tstz } from './common.js';
import { users } from './identity.js';
import { contracts, customers, opportunities } from './sales.js';

export const revenueRecords = pgTable(
  'revenue_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'set null' }),
    contractId: uuid('contract_id').references(() => contracts.id, { onDelete: 'set null' }),
    /** invoiced: billed to the customer; collected: cash received. Won value is never used here. */
    kind: text('kind').notNull(),
    amount: money('amount').notNull(),
    currency: currencyCode().notNull(),
    recognizedOn: date('recognized_on', { mode: 'string' }).notNull(),
    reference: text('reference'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('revenue_records_date_idx').on(t.recognizedOn),
    index('revenue_records_customer_idx').on(t.customerId),
    check('revenue_records_kind_chk', inList(t.kind, ['invoiced', 'collected'])),
    check('revenue_records_amount_chk', sql`${t.amount} > 0`),
  ],
);

export const exchangeRates = pgTable(
  'exchange_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    base: currencyCode('base').notNull(),
    quote: currencyCode('quote').notNull(),
    rate: numeric('rate', { precision: 18, scale: 8 }).notNull(),
    rateDate: date('rate_date', { mode: 'string' }).notNull(),
    /** Explicit provenance is mandatory; rates without a source are rejected at write time. */
    source: text('source').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('exchange_rates_pair_date_source_uq').on(t.base, t.quote, t.rateDate, t.source),
    index('exchange_rates_pair_idx').on(t.base, t.quote, t.rateDate),
    check('exchange_rates_positive_chk', sql`${t.rate} > 0`),
  ],
);
