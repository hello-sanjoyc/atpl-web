import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { ACTIVITY_TYPES, LEAD_PRIORITIES, LEAD_QUALIFICATION, LEAD_STAGES } from '../../config/constants.js';
import { inList, timestamps, tstz } from './common.js';
import { users } from './identity.js';
import { campaigns, referrals } from './marketing.js';

export interface EnrichmentData {
  companySize?: string;
  industry?: string;
  website?: string;
  techStack?: string[];
  linkedinUrl?: string;
  verifiedAt?: string;
  source: 'clearbit' | 'hunter' | 'ai_inference';
  aiInferred?: boolean;
}

export const leadStages = pgTable(
  'lead_stages',
  {
    key: text('key').primaryKey(),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    isTerminal: boolean('is_terminal').notNull().default(false),
  },
  (t) => [check('lead_stages_key_chk', inList(t.key, LEAD_STAGES.map((s) => s.key)))],
);

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stored lowercased; uniqueness is enforced for live (non-deleted) leads. */
    email: text('email').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    company: text('company'),
    country: char('country', { length: 2 }),
    serviceInterest: text('service_interest'),
    budgetRange: text('budget_range'),
    timeline: text('timeline'),
    message: text('message'),
    captureChannel: text('capture_channel'),
    leadSource: text('lead_source'),
    source: text('source').notNull(),
    formSource: text('form_source').notNull(),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmTerm: text('utm_term'),
    utmContent: text('utm_content'),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    referralId: uuid('referral_id').references(() => referrals.id, { onDelete: 'set null' }),
    stage: text('stage').notNull().default('new_lead').references(() => leadStages.key),
    priority: text('priority').notNull().default('medium'),
    score: integer('score').notNull().default(0),
    aiScore: integer('ai_score'),
    aiScoreReason: text('ai_score_reason'),
    aiSummary: text('ai_summary'),
    enrichmentData: jsonb('enrichment_data').$type<EnrichmentData>(),
    duplicateGroupId: uuid('duplicate_group_id'),
    qualificationStatus: text('qualification_status').notNull().default('unqualified'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    discoveryRequested: boolean('discovery_requested').notNull().default(false),
    marketingConsent: boolean('marketing_consent').notNull().default(false),
    marketingConsentAt: tstz('marketing_consent_at'),
    privacyPolicyVersion: text('privacy_policy_version').notNull(),
    consentRecordedAt: tstz('consent_recorded_at').notNull().defaultNow(),
    unsubscribedAt: tstz('unsubscribed_at'),
    deletedAt: tstz('deleted_at'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('leads_email_live_uq').on(t.email).where(sql`${t.deletedAt} is null`),
    index('leads_stage_idx').on(t.stage),
    index('leads_owner_idx').on(t.ownerId),
    index('leads_created_idx').on(t.createdAt),
    index('leads_source_idx').on(t.source),
    index('leads_duplicate_group_idx').on(t.duplicateGroupId),
    check('leads_priority_chk', inList(t.priority, LEAD_PRIORITIES)),
    check('leads_qualification_chk', inList(t.qualificationStatus, LEAD_QUALIFICATION)),
    // capture_channel and lead_source are app-managed options (table option_items), validated in
    // the service layer, so no DB CHECK here — new options can be added from data without a migration.
    check('leads_score_chk', sql`${t.score} between 0 and 100`),
  ],
);

export const leadStageHistory = pgTable(
  'lead_stage_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    fromStage: text('from_stage'),
    toStage: text('to_stage')
      .notNull()
      .references(() => leadStages.key),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason'),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [index('lead_stage_history_lead_idx').on(t.leadId, t.createdAt), index('lead_stage_history_to_idx').on(t.toStage, t.createdAt)],
);

export const leadAssignmentHistory = pgTable(
  'lead_assignment_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    fromOwnerId: uuid('from_owner_id').references(() => users.id, { onDelete: 'set null' }),
    toOwnerId: uuid('to_owner_id').references(() => users.id, { onDelete: 'set null' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    /** Set when a manager overrides a smart-assignment suggestion. */
    isManagerOverride: boolean('is_manager_override').notNull().default(false),
    overrideNote: text('override_note'),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [index('lead_assignment_history_lead_idx').on(t.leadId, t.createdAt)],
);

export const leadActivities = pgTable(
  'lead_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    body: text('body'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('lead_activities_lead_idx').on(t.leadId, t.createdAt),
    check('lead_activities_type_chk', inList(t.type, ACTIVITY_TYPES)),
  ],
);
