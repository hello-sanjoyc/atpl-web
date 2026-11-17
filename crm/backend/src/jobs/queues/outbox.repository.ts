import { eq, sql } from 'drizzle-orm';
import { withDbTiming, type Database, type DbExecutor } from '../../db/client.js';
import { outboxEvents } from '../../db/schema/index.js';
import { getRequestContext } from '../../logger/correlation.js';

export interface OutboxRecord {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  correlationId: string | null;
}

export interface EnqueueInput {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload?: Record<string, unknown>;
  maxAttempts?: number;
}

/**
 * Records a side effect in the outbox. Call with the business transaction so the event is durable
 * exactly when the business change is. Email or CRM outages therefore never lose a lead.
 */
export async function enqueueOutboxEvent(exec: DbExecutor, input: EnqueueInput): Promise<void> {
  await withDbTiming('outbox.enqueue', () =>
    exec.insert(outboxEvents).values({
      type: input.type,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: input.payload ?? {},
      maxAttempts: input.maxAttempts ?? 8,
      correlationId: getRequestContext()?.correlationId ?? null,
    }),
  );
}

/**
 * Claims due events with FOR UPDATE SKIP LOCKED, so any number of worker processes can run safely.
 * Events whose lease expired (worker crash) are reclaimed.
 */
export async function claimOutboxBatch(
  db: Database,
  options: { workerId: string; batchSize: number; leaseMs: number },
): Promise<OutboxRecord[]> {
  const result = await withDbTiming('outbox.claim', () =>
    db.execute<{
      id: string;
      type: string;
      aggregate_type: string;
      aggregate_id: string;
      payload: Record<string, unknown>;
      attempts: number;
      max_attempts: number;
      correlation_id: string | null;
    }>(sql`
      update outbox_events
         set status = 'processing',
             attempts = attempts + 1,
             locked_until = now() + make_interval(secs => ${options.leaseMs}::int / 1000.0),
             locked_by = ${options.workerId}
       where id in (
         select id from outbox_events
          where (status in ('pending', 'failed') and next_attempt_at <= now())
             or (status = 'processing' and locked_until < now())
          order by next_attempt_at
          limit ${options.batchSize}
          for update skip locked
       )
       returning id, type, aggregate_type, aggregate_id, payload, attempts, max_attempts, correlation_id
    `),
  );
  return result.rows.map((r) => ({
    id: r.id,
    type: r.type,
    aggregateType: r.aggregate_type,
    aggregateId: r.aggregate_id,
    payload: r.payload,
    attempts: r.attempts,
    maxAttempts: r.max_attempts,
    correlationId: r.correlation_id,
  }));
}

export async function markOutboxSent(db: Database, id: string): Promise<void> {
  await withDbTiming('outbox.mark_sent', () =>
    db
      .update(outboxEvents)
      .set({ status: 'sent', processedAt: new Date(), lockedUntil: null, lockedBy: null, lastErrorCode: null })
      .where(eq(outboxEvents.id, id)),
  );
}

export async function markOutboxSkipped(db: Database, id: string, reason: string): Promise<void> {
  await withDbTiming('outbox.mark_skipped', () =>
    db
      .update(outboxEvents)
      .set({ status: 'skipped', processedAt: new Date(), lockedUntil: null, lockedBy: null, lastErrorCode: reason })
      .where(eq(outboxEvents.id, id)),
  );
}

/** Returns 'retry' when another attempt is scheduled, or 'dead' when attempts are exhausted. */
export async function markOutboxFailed(
  db: Database,
  event: Pick<OutboxRecord, 'id' | 'attempts' | 'maxAttempts'>,
  options: { errorCode: string; retryable: boolean; retryDelayMs: number },
): Promise<'retry' | 'dead'> {
  const exhausted = !options.retryable || event.attempts >= event.maxAttempts;
  await withDbTiming('outbox.mark_failed', () =>
    db
      .update(outboxEvents)
      .set({
        status: exhausted ? 'dead' : 'failed',
        lastErrorCode: options.errorCode,
        nextAttemptAt: new Date(Date.now() + options.retryDelayMs),
        lockedUntil: null,
        lockedBy: null,
        processedAt: exhausted ? new Date() : null,
      })
      .where(eq(outboxEvents.id, event.id)),
  );
  return exhausted ? 'dead' : 'retry';
}

/** Exponential back-off: 30s, 60s, 120s ... capped at one hour. */
export function backoffMs(attempt: number): number {
  return Math.min(30_000 * 2 ** Math.max(0, attempt - 1), 3_600_000);
}

export async function countOutboxByStatus(db: Database): Promise<Record<string, number>> {
  const rows = await withDbTiming('outbox.count', () =>
    db.execute<{ status: string; count: string }>(sql`select status, count(*)::text as count from outbox_events group by status`),
  );
  return Object.fromEntries(rows.rows.map((r) => [r.status, Number(r.count)]));
}
