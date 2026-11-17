import type { AppConfig } from './env.js';

export interface DatabaseSettings {
  connectionString: string;
  max: number;
  statementTimeoutMs: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  applicationName: string;
  slowQueryMs: number;
  queryLogging: boolean;
}

export function databaseSettings(config: AppConfig): DatabaseSettings {
  return {
    connectionString: config.DATABASE_URL,
    max: config.DB_POOL_MAX,
    statementTimeoutMs: config.DB_STATEMENT_TIMEOUT_MS,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    applicationName: config.LOG_SERVICE_NAME,
    slowQueryMs: config.DB_SLOW_QUERY_MS,
    queryLogging: config.DB_QUERY_LOGGING,
  };
}
