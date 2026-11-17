import { hostname } from 'node:os';
import pino, { type Logger } from 'pino';
import type { AppConfig } from '../config/env.js';
import { buildPinoOptions } from '../config/logger.config.js';
import { getRequestContext } from './correlation.js';

export type AppLogger = Logger;

/**
 * Single shared Pino instance for the process. Request, correlation and user identifiers are
 * injected automatically from AsyncLocalStorage through `mixin`, so services and workers need
 * no explicit logger plumbing to produce correlated output.
 */
export function createRootLogger(config: AppConfig, overrides: pino.LoggerOptions = {}): AppLogger {
  const options = buildPinoOptions(config, { hostname: hostname(), pid: process.pid });
  return pino({
    ...options,
    ...overrides,
    mixin() {
      const ctx = getRequestContext();
      if (!ctx) return {};
      return {
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        ...(ctx.userId ? { userId: ctx.userId } : {}),
        ...(ctx.jobId ? { jobId: ctx.jobId } : {}),
      };
    },
  });
}

export function moduleLogger(root: AppLogger, module: string): AppLogger {
  return root.child({ module });
}
