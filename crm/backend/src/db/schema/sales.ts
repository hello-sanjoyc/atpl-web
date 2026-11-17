import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  LOST_REASONS,
  OPPORTUNITY_STAGES,
} from '../../config/constants.js';
import { currencyCode, inList, money, timestamps, tstz } from './common.js';
import { users } from './identity.js';
import { leads } from './leads.js';
import { campaigns, referrals } from './marketing.js';

export const opportunityStages = pgTable(
  'opportunity_stages',
  {
    key: text('key').primaryKey(),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    defaultProbability: numeric('default_probability', { precision: 5, scale: 4 }).notNull(),
    isTerminal: boolean('is_terminal').notNull().default(false),
  },
  (t) => [check('opportunity_stages_key_chk', inList(t.key, OPPORTUNITY_STAGES.map((s) => s.key)))],
);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    company: text('company'),
    email: text('email').notNull(),
    phone: text('phone'),
    country: text('country'),
    status: text('status').notNull().default('active'),
    sourceLeadId: uuid('source_lead_id').references(() => leads.id, { onDelete: 'set null' }),
    referralId: uuid('referral_id').references(() => referrals.id, { onDelete: 'set null' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    churnedAt: tstz('churned_at'),
    ...timestamps,
  },
  (t) => [
    index('customers_email_idx').on(sql`lower(${t.email})`),
    check('customers_status_chk', inList(t.status, ['active', 'churned'])),
  ],
);

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role'),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: tstz('created_at').notNull().defaultNow(),
});

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    referralId: uuid('referral_id').references(() => referrals.id, { onDelete: 'set null' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    serviceInterest: text('service_interest'),
    country: text('country'),
    opportunityType: text('opportunity_type').notNull().default('new_business'),
    stage: text('stage')
      .notNull()
      .references(() => opportunityStages.key),
    status: text('status').notNull().default('open'),
    probability: numeric('probability', { precision: 5, scale: 4 }).notNull(),
    estimatedValue: money('estimated_value').notNull(),
    currency: currencyCode().notNull(),
    expectedCloseDate: date('expected_close_date', { mode: 'string' }),
    proposalSentAt: tstz('proposal_sent_at'),
    proposalVersion: integer('proposal_version').notNull().default(0),
    wonValue: money('won_value'),
    wonAt: tstz('won_at'),
    lostAt: tstz('lost_at'),
    lostReason: text('lost_reason'),
    ...timestamps,
  },
  (t) => [
    index('opportunities_stage_idx').on(t.stage),
    index('opportunities_owner_idx').on(t.ownerId),
    index('opportunities_status_idx').on(t.status, t.wonAt),
    check('opportunities_status_chk', inList(t.status, ['open', 'won', 'lost'])),
    // opportunity_type is an app-managed option (table option_items), validated in the service layer.
    check('opportunities_lost_reason_chk', sql`${t.lostReason} is null or ${inList(t.lostReason, LOST_REASONS)}`),
    check('opportunities_probability_chk', sql`${t.probability} between 0 and 1`),
    check('opportunities_value_chk', sql`${t.estimatedValue} >= 0`),
  ],
);

export const opportunityStageHistory = pgTable(
  'opportunity_stage_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opportunityId: uuid('opportunity_id')
      .notNull()
      .references(() => opportunities.id, { onDelete: 'cascade' }),
    fromStage: text('from_stage'),
    toStage: text('to_stage')
      .notNull()
      .references(() => opportunityStages.key),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason'),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [index('opportunity_stage_history_opp_idx').on(t.opportunityId, t.createdAt)],
);

export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    kind: text('kind').notNull(),
    value: money('value').notNull(),
    currency: currencyCode().notNull(),
    startsOn: date('starts_on', { mode: 'string' }).notNull(),
    renewsOn: date('renews_on', { mode: 'string' }),
    status: text('status').notNull().default('active'),
    renewalReminderSentAt: tstz('renewal_reminder_sent_at'),
    ...timestamps,
  },
  (t) => [
    index('contracts_renewal_idx').on(t.renewsOn),
    // kind is an app-managed option (table option_items), validated in the service layer.
    check('contracts_status_chk', inList(t.status, ['active', 'ended'])),
  ],
);

export const followUpTasks = pgTable(
  'follow_up_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    dueAt: tstz('due_at').notNull(),
    status: text('status').notNull().default('open'),
    completedAt: tstz('completed_at'),
    ...timestamps,
  },
  (t) => [
    index('follow_up_tasks_owner_due_idx').on(t.ownerId, t.status, t.dueAt),
    check('follow_up_tasks_status_chk', inList(t.status, ['open', 'completed', 'cancelled'])),
  ],
);
