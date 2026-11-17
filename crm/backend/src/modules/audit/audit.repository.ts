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
