import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Logger } from 'pino';
import { databaseSettings } from '../config/database.config.js';
import type { AppConfig } from '../config/env.js';
import { pgCodeOf } from '../logger/serializers.js';
import * as schema from './schema/index.js';

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Anything that can run queries: the pool-backed database or an open transaction. */
export type DbExecutor = Database | Transaction;

export interface DatabaseHandle {
  db: Database;
  pool: pg.Pool;
}

interface Instrumentation {
  logger: Logger;
  slowQueryMs: number;
}

let instrumentation: Instrumentation | undefined;

/** Enables slow-query logging. Called once at startup; queries are never logged with bind values. */
export function configureDbInstrumentation(logger: Logger, slowQueryMs: number): void {
  instrumentation = { logger, slowQueryMs };
}

/**
 * Times a repository operation and logs slow ones. Errors propagate unchanged so that the error
 * mapper can classify SQLSTATE codes (e.g. unique violations become 409, not 503).
 */
export async function withDbTiming<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    return await fn();
  } finally {
    const durationMs = Math.round(performance.now() - started);
    if (instrumentation && durationMs >= instrumentation.slowQueryMs) {
      instrumentation.logger.warn(
        {
          event: 'database.slow_query',
          operation,
          durationMs,
          thresholdMs: instrumentation.slowQueryMs,
        },
        'Database query exceeded threshold',
      );
    }
  }
}

export function createDatabase(config: AppConfig, logger: Logger): DatabaseHandle {
  const settings = databaseSettings(config);
  const pool = new pg.Pool({
    connectionString: settings.connectionString,
    max: settings.max,
    idleTimeoutMillis: settings.idleTimeoutMillis,
    connectionTimeoutMillis: settings.connectionTimeoutMillis,
    application_name: settings.applicationName,
    statement_timeout: settings.statementTimeoutMs,
  });

  pool.on('error', (error) => {
    logger.error(
      { event: 'database.connection_error', errorCode: pgCodeOf(error) ?? (error as NodeJS.ErrnoException).code },
      'Idle database client error',
    );
  });

  const db = drizzle(pool, { schema });
  configureDbInstrumentation(logger, settings.slowQueryMs);
  return { db, pool };
}

/** Periodic pool-saturation check. Logs only when clients are queued waiting for a connection. */
export function startPoolMonitor(pool: pg.Pool, logger: Logger, intervalMs = 15_000): () => void {
  const timer = setInterval(() => {
    if (pool.waitingCount > 0) {
      logger.warn(
        {
          event: 'database.pool_exhausted',
          waiting: pool.waitingCount,
          total: pool.totalCount,
          idle: pool.idleCount,
        },
        'Database pool saturated; requests are waiting for connections',
      );
    }
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
