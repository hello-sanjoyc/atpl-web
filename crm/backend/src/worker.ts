import os from 'node:os';
import { loadConfig } from './config/env.js';
import { createContainer } from './container.js';
import { startPoolMonitor } from './db/client.js';
import { createOutboxWorker } from './jobs/workers/outbox.worker.js';
import { createScheduler } from './jobs/scheduler.js';

/** Background process: outbox dispatch plus the single-leader scheduler. Run as its own PM2 app. */
async function main(): Promise<void> {
  const config = loadConfig();
  const container = createContainer(config);
  const log = container.logger.child({ module: 'worker' });
  const workerId = `${os.hostname()}-${process.pid}`;

  const outbox = createOutboxWorker(container, {
    workerId,
    pollIntervalMs: config.OUTBOX_POLL_INTERVAL_MS,
    batchSize: config.OUTBOX_BATCH_SIZE,
    leaseMs: config.OUTBOX_LEASE_MS,
  });
  const scheduler = createScheduler(container, config.SCHEDULER_INTERVAL_MS);
  const stopPoolMonitor = startPoolMonitor(container.pool, container.logger.child({ module: 'db-pool' }));

  outbox.start();
  scheduler.start();
  log.info({ event: 'worker.started', workerId }, 'Worker started');

  let shuttingDown = false;
  const shutdown = async (signal: string, exitCode: number): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ event: 'worker.stopping', signal }, 'Worker shutting down');
    const timer = setTimeout(() => process.exit(1), config.SHUTDOWN_TIMEOUT_MS);
    timer.unref();
    try {
      stopPoolMonitor();
      await outbox.stop();
      await scheduler.stop();
      await container.close();
      clearTimeout(timer);
      process.exit(exitCode);
    } catch {
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM', 0));
  process.on('SIGINT', () => void shutdown('SIGINT', 0));
  process.on('uncaughtException', (error) => {
    log.fatal({ event: 'process.uncaught_exception', errorName: error.name }, 'Uncaught exception; exiting');
    void shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason) => {
    log.fatal({ event: 'process.unhandled_rejection', errorName: (reason as Error)?.name }, 'Unhandled rejection; exiting');
    void shutdown('unhandledRejection', 1);
  });
}

main().catch((error: unknown) => {
  process.stderr.write(`Worker failed to start: ${(error as Error).message}\n`);
  process.exit(1);
});
