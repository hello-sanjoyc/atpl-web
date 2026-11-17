import type pg from 'pg';
import type { Container } from '../container.js';
import { purgeExpiredIdempotencyKeys } from '../modules/common/idempotency.js';
import { createCustomersService } from '../modules/customers/customers.service.js';

/** Arbitrary, fixed key for pg_try_advisory_lock. Only one scheduler in the cluster holds it at a time. */
export const SCHEDULER_LOCK_KEY = 718_204_553;

export interface Scheduler {
  runOnce(): Promise<{ renewalsQueued: number; idempotencyKeysPurged: number } | undefined>;
  start(): void;
  stop(): Promise<void>;
}

export function createScheduler(deps: Container, intervalMs: number): Scheduler {
  const log = deps.logger.child({ module: 'scheduler' });
  let client: pg.PoolClient | undefined;
  let timer: NodeJS.Timeout | undefined;
  let inFlight: Promise<unknown> = Promise.resolve();

  /** Holds a dedicated connection with the advisory lock while this process is leader. */
  async function ensureLeadership(): Promise<boolean> {
    if (client) return true;
    const connection = await deps.pool.connect();
    const { rows } = await connection.query<{ locked: boolean }>('select pg_try_advisory_lock($1) as locked', [SCHEDULER_LOCK_KEY]);
    if (rows[0]?.locked) {
      client = connection;
      return true;
    }
    connection.release();
    return false;
  }

  async function runOnce() {
    if (!(await ensureLeadership())) return undefined;
    const renewalsQueued = await createCustomersService(deps).enqueueRenewalReminders(deps.now());
    const idempotencyKeysPurged = await purgeExpiredIdempotencyKeys(deps.db, deps.now());
    log.info({ event: 'scheduler.run', renewalsQueued, idempotencyKeysPurged }, 'Scheduled tasks completed');
    return { renewalsQueued, idempotencyKeysPurged };
  }

  return {
    runOnce,
    start() {
      timer = setInterval(() => {
        inFlight = runOnce().catch((error: unknown) => {
          log.error({ event: 'scheduler.failed', errorCode: (error as { code?: string }).code ?? 'scheduler_failed' }, 'Scheduled tasks failed');
        });
      }, intervalMs);
      timer.unref();
    },
    async stop() {
      if (timer) clearInterval(timer);
      await inFlight;
      if (client) {
        await client.query('select pg_advisory_unlock($1)', [SCHEDULER_LOCK_KEY]).catch(() => undefined);
        client.release();
        client = undefined;
      }
    },
  };
}
