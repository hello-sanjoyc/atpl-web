import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { inList, timestamps, tstz } from './common.js';
import { users } from './identity.js';
import { leads } from './leads.js';
import { opportunities } from './sales.js';

export interface ProposalSection {
  heading: string;
  content: string;
}

export interface ForecastBand {
  best: number;
  expected: number;
  worst: number;
  currency: string;
}

export interface RepSkillProfile {
  industries: string[];
  serviceInterests: string[];
  countries: string[];
  currentLeadLoad: number;
  recentWinRate: number;
}

/** Extracted intelligence from an uploaded call transcript, meeting notes, or email thread. */
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().default('transcript'),
    rawText: text('raw_text').notNull(),
    summary: text('summary'),
    requirements: jsonb('requirements').$type<string[]>(),
    objections: jsonb('objections').$type<string[]>(),
    commitments: jsonb('commitments').$type<string[]>(),
    actionItems: jsonb('action_items').$type<string[]>(),
    processedAt: tstz('processed_at'),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    index('conversations_lead_idx').on(t.leadId, t.createdAt),
    check('conversations_kind_chk', inList(t.kind, ['transcript', 'meeting_notes', 'email_thread'])),
  ],
);

/** Versioned AI-generated proposals attached to an opportunity. */
export const proposalVersions = pgTable(
  'proposal_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opportunityId: uuid('opportunity_id')
      .notNull()
      .references(() => opportunities.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    sections: jsonb('sections').$type<ProposalSection[]>().notNull().default(sql`'[]'::jsonb`),
    markdownContent: text('markdown_content').notNull(),
    generatedAt: tstz('generated_at').notNull().defaultNow(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('proposal_versions_opp_idx').on(t.opportunityId, t.version)],
);

/** Weekly revenue forecast snapshots. */
export const forecastSnapshots = pgTable(
  'forecast_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    snapshotDate: text('snapshot_date').notNull(),
    band30: jsonb('band_30').$type<ForecastBand>().notNull(),
    band60: jsonb('band_60').$type<ForecastBand>().notNull(),
    band90: jsonb('band_90').$type<ForecastBand>().notNull(),
    openOpportunityCount: integer('open_opportunity_count').notNull().default(0),
    aiNarrative: text('ai_narrative'),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [index('forecast_snapshots_date_idx').on(t.snapshotDate)],
);

/** AI skill profiles per sales rep; used for smart assignment scoring. */
export const repSkills = pgTable(
  'rep_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    profile: jsonb('profile').$type<RepSkillProfile>().notNull().default(sql`'{}'::jsonb`),
    isAvailable: boolean('is_available').notNull().default(true),
    currentLeadLoad: integer('current_lead_load').notNull().default(0),
    recentWinRate: numeric('recent_win_rate', { precision: 5, scale: 4 }).notNull().default('0'),
    lastUpdatedAt: tstz('last_updated_at').notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [index('rep_skills_user_idx').on(t.userId)],
);

/**
 * LLM provider configuration managed by Super Admin.
 * Only one row may have is_active = true at a time (enforced in the service).
 * The api_key is stored encrypted; decryption happens in the AI client layer.
 */
export const llmProviderConfigs = pgTable(
  'llm_provider_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Display name shown in the UI, e.g. "Claude Sonnet 4.5 (prod)" */
    label: text('label').notNull(),
    /** Provider slug: anthropic | openai | gemini | perplexity | generic */
    provider: text('provider').notNull(),
    /** Exact model identifier passed to the provider API, e.g. "claude-sonnet-4-6" */
    model: text('model').notNull(),
    /** AES-256-GCM encrypted API key (hex: iv:tag:ciphertext). Stored empty string when not set. */
    apiKeyEncrypted: text('api_key_encrypted').notNull().default(''),
    /** Optional base URL override — required for generic/self-hosted providers. */
    baseUrl: text('base_url'),
    maxTokens: integer('max_tokens').notNull().default(2048),
    /** Per-request timeout for this provider/model, in ms. Slower reasoning models may need more than the 30s default. */
    timeoutMs: integer('timeout_ms').notNull().default(30_000),
    isActive: boolean('is_active').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    index('llm_provider_configs_active_idx').on(t.isActive),
  ],
);

/** AI query audit log — every copilot query is recorded for RBAC compliance. */
export const aiQueryAuditLogs = pgTable(
  'ai_query_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    queryKind: text('query_kind').notNull(),
    prompt: text('prompt').notNull(),
    tokensUsed: integer('tokens_used'),
    modelId: text('model_id'),
    durationMs: integer('duration_ms'),
    errorCode: text('error_code'),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('ai_query_audit_logs_actor_idx').on(t.actorId, t.createdAt),
    index('ai_query_audit_logs_kind_idx').on(t.queryKind, t.createdAt),
  ],
);
