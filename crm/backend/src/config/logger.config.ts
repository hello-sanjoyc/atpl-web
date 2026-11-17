import type { LoggerOptions } from 'pino';
import type { AppConfig } from './env.js';

/**
 * Fields that must never reach a log sink. Path-based redaction is the first line of defence;
 * `sanitizeForLog` in logger/redaction.ts is the second, applied to arbitrary payloads.
 */
export const REDACT_PATHS: string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.headers["proxy-authorization"]',
  'req.headers["x-booking-signature"]',
  'headers.authorization',
  'headers.cookie',
  'headers["set-cookie"]',
  'res.headers["set-cookie"]',
  'password',
  '*.password',
  '*.passwordHash',
  '*.password_hash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.secret',
  '*.smtpPassword',
  '*.webhookSecret',
  '*.databaseUrl',
  '*.DATABASE_URL',
];

export function buildPinoOptions(config: AppConfig, extra: { hostname: string; pid: number }): LoggerOptions {
  return {
    level: config.logLevel,
    base: {
      service: config.LOG_SERVICE_NAME,
      environment: config.logEnvironment,
      version: config.appVersion,
      pid: extra.pid,
      hostname: extra.hostname,
      instance: process.env.NODE_APP_INSTANCE ?? null,
    },
    messageKey: 'message',
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    redact: config.LOG_REDACTION
      ? { paths: REDACT_PATHS, censor: '[REDACTED]', remove: false }
      : undefined,
    transport: config.LOG_PRETTY
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', singleLine: false } }
      : undefined,
  };
}
