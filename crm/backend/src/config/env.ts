import { readFileSync } from 'node:fs';
import { z } from 'zod';

export class ConfigError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid configuration: ${issues.join('; ')}`);
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().min(1).default('0.0.0.0'),
    TRUST_PROXY: z.stringbool().default(false),
    BODY_LIMIT_BYTES: z.coerce.number().int().min(1024).max(5_000_000).default(100_000),
    SWAGGER_ENABLED: z.stringbool().optional(),
    CORS_ORIGINS: z.string().default(''),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10_000),

    DATABASE_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL connection string'),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(200).default(10),
    DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(100).default(10_000),
    DB_SLOW_QUERY_MS: z.coerce.number().int().min(1).default(500),
    DB_QUERY_LOGGING: z.stringbool().default(false),

    REDIS_URL: z.string().optional(),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_ACCESS_TTL: z.string().min(2).default('15m'),

    RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
    RATE_LIMIT_WINDOW: z.string().min(2).default('1 minute'),
    PUBLIC_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z.stringbool().default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    SALES_NOTIFICATION_EMAIL: z.email().optional(),

    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),
    ANTHROPIC_MAX_TOKENS: z.coerce.number().int().min(100).max(8192).default(2048),
    /** Secret used to AES-256-GCM encrypt LLM API keys stored in the DB. Must be ≥32 chars. */
    LLM_ENCRYPTION_SECRET: z.string().min(32).default('change-me-to-a-32-char-secret-!!'),

    CRM_PROVIDER: z.enum(['none', 'hubspot']).default('none'),
    HUBSPOT_ACCESS_TOKEN: z.string().optional(),

    BOOKING_PROVIDER: z.string().regex(/^[a-z0-9_-]+$/).default('none'),
    BOOKING_URL: z.url().optional(),
    BOOKING_WEBHOOK_SECRET: z.string().min(32).optional(),
    BOOKING_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),

    DEFAULT_CURRENCY: z.string().regex(/^[A-Z]{3}$/, 'DEFAULT_CURRENCY must be an ISO 4217 code').default('USD'),
    REPORTING_TIMEZONE: z.literal('UTC', {
      message: 'Only UTC reporting is supported in this release',
    }).default('UTC'),

    LOG_LEVEL: z.enum(LOG_LEVELS).optional(),
    LOG_FORMAT: z.literal('json').default('json'),
    LOG_PRETTY: z.stringbool().default(false),
    LOG_REDACTION: z.stringbool().default(true),
    LOG_SERVICE_NAME: z.string().min(1).default('aranax-lead-api'),
    LOG_ENVIRONMENT: z.string().min(1).optional(),
    LOG_INCLUDE_STACK: z.stringbool().default(false),
    APP_VERSION: z.string().optional(),

    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(100).default(2000),
    OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(200).default(20),
    OUTBOX_LEASE_MS: z.coerce.number().int().min(1000).default(60_000),
    OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(50).default(8),
    SCHEDULER_INTERVAL_MS: z.coerce.number().int().min(1000).default(900_000),
  })
  .superRefine((env, ctx) => {
    const require = (condition: boolean, path: string, message: string) => {
      if (!condition) ctx.addIssue({ code: 'custom', path: [path], message });
    };
    if (env.NODE_ENV === 'production') {
      require(env.LOG_REDACTION, 'LOG_REDACTION', 'LOG_REDACTION must be true in production');
      require(!env.LOG_PRETTY, 'LOG_PRETTY', 'LOG_PRETTY must be false in production');
    }
    if (env.SMTP_HOST) {
      require(Boolean(env.SMTP_FROM), 'SMTP_FROM', 'SMTP_FROM is required when SMTP_HOST is set');
    }
    if (env.CRM_PROVIDER === 'hubspot') {
      require(Boolean(env.HUBSPOT_ACCESS_TOKEN), 'HUBSPOT_ACCESS_TOKEN', 'HUBSPOT_ACCESS_TOKEN is required for hubspot');
    }
    if (env.BOOKING_PROVIDER !== 'none') {
      require(
        Boolean(env.BOOKING_WEBHOOK_SECRET),
        'BOOKING_WEBHOOK_SECRET',
        'BOOKING_WEBHOOK_SECRET is required when BOOKING_PROVIDER is enabled',
      );
    }
  });

type EnvOutput = z.output<typeof envSchema>;

export interface AppConfig extends EnvOutput {
  isProduction: boolean;
  isTest: boolean;
  logLevel: LogLevel;
  logEnvironment: string;
  corsOrigins: string[];
  swaggerEnabled: boolean;
  appVersion: string;
}

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
      version?: string;
    };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** Validates an environment map and returns a typed, derived configuration. Throws ConfigError. */
export function parseConfig(source: Record<string, string | undefined>): AppConfig {
  // A blank value (for example "SMTP_HOST=" in .env) means "not set", so optional settings can be left empty.
  const normalised = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === undefined || value.trim() === '' ? undefined : value]),
  );
  const result = envSchema.safeParse(normalised);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
    throw new ConfigError(issues);
  }
  const env = result.data;
  const isProduction = env.NODE_ENV === 'production';
  const isTest = env.NODE_ENV === 'test';
  return {
    ...env,
    isProduction,
    isTest,
    logLevel: env.LOG_LEVEL ?? (isTest ? 'silent' : isProduction ? 'info' : 'debug'),
    logEnvironment: env.LOG_ENVIRONMENT ?? env.NODE_ENV,
    corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
    swaggerEnabled: env.SWAGGER_ENABLED ?? !isProduction,
    appVersion: env.APP_VERSION ?? readPackageVersion(),
  };
}

export function loadConfig(): AppConfig {
  return parseConfig(process.env);
}
