import { and, eq, lt } from 'drizzle-orm';
import { IDEMPOTENCY_TTL_HOURS } from '../../config/constants.js';
import { idempotencyKeys } from '../../db/schema/index.js';
import { withDbTiming, type Database, type Transaction } from '../../db/client.js';
import { BusinessRuleError, ConflictError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';

export interface IdempotentResult {
  statusCode: number;
  body: unknown;
}

export interface IdempotencyOptions {
  scope: string;
  key?: string;
  requestHash: string;
  now: Date;
}

/**
 * Runs `work` exactly once per (scope, key), atomically. The key row is inserted in the same
 * transaction as the business write, so a concurrent duplicate blocks on the unique index and then
 * replays the committed response. A failed attempt rolls back and leaves the key free for retry.
 */
export async function withIdempotency(
  db: Database,
  options: IdempotencyOptions,
  work: (tx: Transaction) => Promise<IdempotentResult>,
): Promise<IdempotentResult & { replayed: boolean }> {
  if (!options.key) {
    const result = await db.transaction((tx) => work(tx));
    return { ...result, replayed: false };
  }

  const key = options.key;
  const expiresAt = new Date(options.now.getTime() + IDEMPOTENCY_TTL_HOURS * 3_600_000);

  return db.transaction(async (tx) => {
    const inserted = await withDbTiming('idempotency.reserve', () =>
      tx
        .insert(idempotencyKeys)
        .values({ scope: options.scope, key, requestHash: options.requestHash, expiresAt })
        .onConflictDoNothing()
        .returning({ key: idempotencyKeys.key }),
    );

    if (inserted.length === 0) {
      const [existing] = await withDbTiming('idempotency.load', () =>
        tx
          .select()
          .from(idempotencyKeys)
          .where(and(eq(idempotencyKeys.scope, options.scope), eq(idempotencyKeys.key, key))),
      );
      if (!existing) throw new ConflictError(ErrorCodes.IDEMPOTENCY_IN_PROGRESS, 'The request is already being processed.');
      if (existing.requestHash !== options.requestHash) {
        throw new BusinessRuleError(
          ErrorCodes.IDEMPOTENCY_KEY_REUSED,
          'This idempotency key was already used with a different request body.',
        );
      }
      return { statusCode: existing.statusCode ?? 200, body: existing.responseBody, replayed: true };
    }

    const result = await work(tx);
    await withDbTiming('idempotency.complete', () =>
      tx
        .update(idempotencyKeys)
        .set({ statusCode: result.statusCode, responseBody: result.body })
        .where(and(eq(idempotencyKeys.scope, options.scope), eq(idempotencyKeys.key, key))),
    );
    return { ...result, replayed: false };
  });
}

/** Removes expired keys. Run from the scheduler. */
export async function purgeExpiredIdempotencyKeys(db: Database, now: Date): Promise<number> {
  const deleted = await withDbTiming('idempotency.purge', () =>
    db.delete(idempotencyKeys).where(lt(idempotencyKeys.expiresAt, now)).returning({ key: idempotencyKeys.key }),
  );
  return deleted.length;
}
