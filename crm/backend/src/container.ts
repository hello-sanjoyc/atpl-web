import type pg from 'pg';
import { eq } from 'drizzle-orm';
import type { AppConfig } from './config/env.js';
import { createDatabase, type Database } from './db/client.js';
import { SecurityEventLogger } from './logger/audit-logger.js';
import { createRootLogger, type AppLogger } from './logger/index.js';
import { createCrmAdapter, type CrmAdapter } from './modules/integrations/crm.adapter.js';
import { SmtpEmailProvider } from './modules/email/smtp.provider.js';
import { type EmailProvider, UnconfiguredEmailProvider } from './modules/email/email.provider.js';
import { createOptionsService, type OptionsService } from './modules/options/options.service.js';
import { buildAiClient, createAiClient, decryptApiKey, type AiClient, type AiCompletionOptions, type AiCompletionResult, type AiProvider, type AiProviderConfig } from './modules/ai/ai.client.js';
import { llmProviderConfigs } from './db/schema/ai.js';
import { type CacheService, createRedisCacheService, noopCacheService } from './cache/cache.service.js';
import { getRedisClient, closeRedis } from './cache/redis.js';

export interface Container {
  config: AppConfig;
  logger: AppLogger;
  security: SecurityEventLogger;
  db: Database;
  pool: pg.Pool;
  cache: CacheService;
  email: EmailProvider;
  crm: CrmAdapter | null;
  /**
   * AI client — dynamically resolves the active DB-backed LLM provider config on each call
   * (cached for 60 s). Falls back to env ANTHROPIC_API_KEY when no DB config is active.
   */
  ai: AiClient;
  /** App-managed dropdown options (DB-backed, cached) + value validation. */
  options: OptionsService;
  now: () => Date;
  close: () => Promise<void>;
}

export interface ContainerOverrides {
  logger?: AppLogger;
  email?: EmailProvider;
  crm?: CrmAdapter | null;
  ai?: AiClient;
  now?: () => Date;
}

/** Wraps the DB-backed config lookup with a 60-second TTL cache so every AI call doesn't hit the DB. */
function createDynamicAiClient(db: Database, config: AppConfig, logger: AppLogger): AiClient {
  const aiLogger = logger.child({ module: 'ai' });
  const envFallback = createAiClient(config, aiLogger);

  let cachedClient: AiClient | null = null;
  let cacheExpiresAt = 0;
  const TTL_MS = 60_000;

  async function resolve(): Promise<AiClient> {
    const now = Date.now();
    if (cachedClient && now < cacheExpiresAt) return cachedClient;

    try {
      const [row] = await db.select().from(llmProviderConfigs).where(eq(llmProviderConfigs.isActive, true));
      if (row && row.apiKeyEncrypted) {
        const cfg: AiProviderConfig = {
          provider: row.provider as AiProvider,
          model: row.model,
          apiKey: decryptApiKey(row.apiKeyEncrypted, config.LLM_ENCRYPTION_SECRET),
          baseUrl: row.baseUrl ?? undefined,
          maxTokens: row.maxTokens,
        };
        const client = buildAiClient(cfg, aiLogger);
        if (await client.isAvailable()) {
          cachedClient = client;
          cacheExpiresAt = now + TTL_MS;
          return client;
        }
      }
    } catch {
      // DB not reachable at startup — fall through to env fallback
    }

    // No active DB config → use env fallback
    cachedClient = envFallback;
    cacheExpiresAt = now + TTL_MS;
    return envFallback;
  }

  return {
    async isAvailable() {
      const client = await resolve();
      return client.isAvailable();
    },
    async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
      const client = await resolve();
      return client.complete(options);
    },
  };
}

/** Single composition root. Tests pass overrides for logger, email, CRM and clock. */
export function createContainer(config: AppConfig, overrides: ContainerOverrides = {}): Container {
  const logger = overrides.logger ?? createRootLogger(config);
  const { db, pool } = createDatabase(config, logger.child({ module: 'db' }));
  const email: EmailProvider =
    overrides.email ?? (config.SMTP_HOST ? new SmtpEmailProvider(config) : new UnconfiguredEmailProvider());
  const crm = overrides.crm !== undefined ? overrides.crm : createCrmAdapter(config);
  const ai = overrides.ai ?? createDynamicAiClient(db, config, logger);
  const security = new SecurityEventLogger(logger.child({ module: 'security' }), db);
  const redisClient = getRedisClient(config.REDIS_URL);
  const cache: CacheService = redisClient ? createRedisCacheService(redisClient) : noopCacheService;
  const options = createOptionsService({ db, cache });

  return {
    config,
    logger,
    security,
    db,
    pool,
    cache,
    email,
    crm,
    ai,
    options,
    now: overrides.now ?? (() => new Date()),
    close: async () => {
      await pool.end();
      if (email instanceof SmtpEmailProvider) await email.close();
      await closeRedis();
    },
  };
}
