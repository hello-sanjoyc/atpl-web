import type { Container } from '../../container.js';
import { newId, runWithContext } from '../../logger/correlation.js';
import { dispatchOutboxEvent, PermanentJobError } from '../processors/dispatcher.js';
import { backoffMs, claimOutboxBatch, markOutboxFailed, markOutboxSent, markOutboxSkipped, type OutboxRecord } from '../queues/outbox.repository.js';

export interface OutboxWorkerOptions {
  workerId: string;
  pollIntervalMs: number;
  batchSize: number;
  leaseMs: number;
}

export interface OutboxWorker {
  /** Processes one claimed batch. Exposed so tests can drive the worker deterministically. */
  tick(): Promise<number>;
  start(): void;
  stop(): Promise<void>;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof PermanentJobError) return false;
  return (error as { retryable?: boolean }).retryable ?? true;
}

function errorCodeOf(error: unknown): string {
  return (error as { code?: string }).code ?? 'job_failed';
}

export function createOutboxWorker(deps: Container, options: OutboxWorkerOptions): OutboxWorker {
  const log = deps.logger.child({ module: 'outbox-worker', workerId: options.workerId });
  let stopped = false;
  let loop: Promise<void> | undefined;

  async function processEvent(event: OutboxRecord): Promise<void> {
    // Each job gets its own correlation context so every line it writes can be traced to the originating request.
    const context = { requestId: newId('job'), correlationId: event.correlationId ?? newId('cor') };
    await runWithContext(context, async () => {
      const jobLog = log.child({ jobId: event.id, jobType: event.type, attempt: event.attempts });
      jobLog.info({ event: 'job.started' }, 'Outbox event started');
      try {
        const outcome = await dispatchOutboxEvent(event, deps);
        if (outcome.status === 'sent') {
          await markOutboxSent(deps.db, event.id);
          jobLog.info({ event: 'job.sent', reference: outcome.reference }, 'Outbox event completed');
        } else {
          await markOutboxSkipped(deps.db, event.id, outcome.reason);
          jobLog.info({ event: 'job.skipped', reason: outcome.reason }, 'Outbox event skipped');
        }
      } catch (error) {
        const retryable = isRetryable(error);
        const code = errorCodeOf(error);
        const retryDelayMs = backoffMs(event.attempts);
        const result = await markOutboxFailed(deps.db, event, { errorCode: code, retryable, retryDelayMs });
        if (result === 'dead') {
          jobLog.error({ event: 'job.dead_lettered', errorCode: code }, 'Outbox event dead-lettered');
        } else {
          jobLog.warn({ event: 'job.retry_scheduled', errorCode: code, retryDelayMs }, 'Outbox event will be retried');
        }
      }
    });
  }

  async function tick(): Promise<number> {
    const batch = await claimOutboxBatch(deps.db, { workerId: options.workerId, batchSize: options.batchSize, leaseMs: options.leaseMs });
    for (const event of batch) await processEvent(event);
    return batch.length;
  }

  return {
    tick,
    start() {
      loop = (async () => {
        while (!stopped) {
          let claimed = 0;
          try {
            claimed = await tick();
          } catch (error) {
            log.error({ event: 'job.poll_failed', errorCode: errorCodeOf(error) }, 'Outbox poll failed');
          }
          if (!stopped && claimed === 0) await new Promise((resolve) => setTimeout(resolve, options.pollIntervalMs));
        }
      })();
    },
    async stop() {
      stopped = true;
      await loop;
    },
  };
}
