import { getRequestContext } from '../../logger/correlation.js';
import { auditLogs } from '../../db/schema/index.js';
import { withDbTiming, type DbExecutor } from '../../db/client.js';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  /** Business metadata only. Never store raw PII or secrets here. */
  metadata?: Record<string, unknown>;
}

/**
 * Writes a business audit record. Pass the transaction executor when the audit must commit with
 * the business change; the record then cannot exist without the change, or vice versa.
 */
export async function recordAudit(exec: DbExecutor, entry: AuditEntry): Promise<void> {
  await withDbTiming('audit.insert', () =>
    exec.insert(auditLogs).values({
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ?? {},
      correlationId: getRequestContext()?.correlationId ?? null,
    }),
  );
}

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

/**
 * Builds a `{ changes: FieldChange[] }` metadata payload for `recordAudit`, recording only the
 * fields present on `patch` whose value actually differs from `before` — so a PATCH that repeats
 * an unchanged value does not show up as a no-op change in the Audit Trail viewer.
 */
export function diffFields<T extends Record<string, unknown>>(before: T, patch: Partial<T>): { changes: FieldChange[] } {
  const changes: FieldChange[] = [];
  for (const field of Object.keys(patch)) {
    const from = before[field];
    const to = patch[field];
    if (from !== to) changes.push({ field, from: from ?? null, to: to ?? null });
  }
  return { changes };
}
