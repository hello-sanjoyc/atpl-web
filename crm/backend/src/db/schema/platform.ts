import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { inList, tstz } from './common.js';
import { leads } from './leads.js';
import { users } from './identity.js';

/**
 * Generic single-row-per-key app settings, editable by super_admin from Settings → General.
 * Values are stored as JSON so a single table covers any future scalar config without a migration
 * per setting; each known key's shape is validated in its owning service, not here.
 */
export const appSettings = pgTable(
  'app_settings',
  {
    key: text('key').primaryKey(),
    value: jsonb('value').$type<unknown>().notNull(),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: tstz('updated_at').notNull().defaultNow(),
  },
);

/** Human-readable label and description for each role, editable by super_admin. */
export const roleMeta = pgTable(
  'role_meta',
  {
    role: text('role').primaryKey(),
    label: text('label').notNull(),
    description: text('description').notNull().default(''),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: tstz('updated_at').notNull().defaultNow(),
  },
);

/**
 * DB-managed role permissions. Super Admin can toggle any permission for any role except super_admin
 * (which always retains all permissions). Rows are seeded from the static defaults in migration 0009.
 */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    role: text('role').notNull(),
    permission: text('permission').notNull(),
    /** false = this role does NOT have this permission (soft toggle). */
    granted: boolean('granted').notNull().default(true),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: tstz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('role_permissions_role_perm_uq').on(t.role, t.permission),
    index('role_permissions_role_idx').on(t.role),
  ],
);

/** Transactional outbox: side effects are recorded in the same transaction as the business change. */
export const outboxEvents = pgTable(
  'outbox_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    /** Identifiers only. Recipient data is loaded when the event is processed, not stored here. */
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(8),
    nextAttemptAt: tstz('next_attempt_at').notNull().defaultNow(),
    lockedUntil: tstz('locked_until'),
    lockedBy: text('locked_by'),
    lastErrorCode: text('last_error_code'),
    correlationId: text('correlation_id'),
    createdAt: tstz('created_at').notNull().defaultNow(),
    processedAt: tstz('processed_at'),
  },
  (t) => [
    index('outbox_events_dispatch_idx').on(t.status, t.nextAttemptAt),
    check('outbox_events_status_chk', inList(t.status, ['pending', 'processing', 'failed', 'sent', 'skipped', 'dead'])),
  ],
);

export const emailDeliveryLogs = pgTable(
  'email_delivery_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    outboxEventId: uuid('outbox_event_id'),
    template: text('template').notNull(),
    provider: text('provider').notNull(),
    providerMessageId: text('provider_message_id'),
    /** SHA-256 fingerprint of the recipient, so deliveries can be traced without storing addresses. */
    recipientFingerprint: text('recipient_fingerprint').notNull(),
    relatedLeadId: uuid('related_lead_id').references(() => leads.id, { onDelete: 'set null' }),
    /** queued -> delivery_started -> provider_accepted | failed. "delivered" needs a provider receipt. */
    status: text('status').notNull(),
    attempt: integer('attempt').notNull().default(1),
    errorCode: text('error_code'),
    createdAt: tstz('created_at').notNull().defaultNow(),
    updatedAt: tstz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('email_delivery_logs_lead_idx').on(t.relatedLeadId),
    check('email_delivery_logs_status_chk', inList(t.status, ['queued', 'delivery_started', 'provider_accepted', 'failed'])),
  ],
);

export const crmSyncRecords = pgTable(
  'crm_sync_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    externalId: text('external_id'),
    status: text('status').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastErrorCode: text('last_error_code'),
    lastSyncedAt: tstz('last_synced_at'),
    createdAt: tstz('created_at').notNull().defaultNow(),
    updatedAt: tstz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('crm_sync_lead_provider_uq').on(t.leadId, t.provider),
    check('crm_sync_status_chk', inList(t.status, ['synced', 'failed', 'skipped', 'pending'])),
  ],
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    scope: text('scope').notNull(),
    key: text('key').notNull(),
    requestHash: text('request_hash').notNull(),
    statusCode: integer('status_code'),
    responseBody: jsonb('response_body').$type<unknown>(),
    createdAt: tstz('created_at').notNull().defaultNow(),
    expiresAt: tstz('expires_at').notNull(),
  },
  (t) => [uniqueIndex('idempotency_keys_pk').on(t.scope, t.key)],
);

/** Business audit trail. Persisted independently of application log retention. */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    occurredAt: tstz('occurred_at').notNull().defaultNow(),
    actorId: uuid('actor_id'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    correlationId: text('correlation_id'),
  },
  (t) => [index('audit_logs_entity_idx').on(t.entityType, t.entityId), index('audit_logs_occurred_idx').on(t.occurredAt)],
);
