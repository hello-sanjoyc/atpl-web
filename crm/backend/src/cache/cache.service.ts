import type { Redis } from 'ioredis';

export const SSE_CHANNEL = 'crm:invalidate';

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Delete all keys whose names start with `prefix` (e.g. "admin:users" deletes "admin:users:p1:s25" etc.). */
  delPattern(prefix: string): Promise<void>;
  /** Publish a cache-invalidation event so SSE subscribers can notify browsers. */
  publish(event: InvalidationEvent): Promise<void>;
}

export interface InvalidationEvent {
  type: string;
  /** Query keys that React Query subscribers should invalidate. */
  queryKeys: string[][];
}

/** Redis-backed implementation. */
export function createRedisCacheService(redis: Redis): CacheService {
  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const raw = await redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch {
        // non-fatal: proceed without cache
      }
    },

    async del(key: string): Promise<void> {
      try {
        await redis.del(key);
      } catch {}
    },

    async delPattern(prefix: string): Promise<void> {
      try {
        const pattern = `${prefix}*`;
        let cursor = '0';
        do {
          const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = next;
          if (keys.length > 0) await redis.del(...keys);
        } while (cursor !== '0');
      } catch {}
    },

    async publish(event: InvalidationEvent): Promise<void> {
      try {
        await redis.publish(SSE_CHANNEL, JSON.stringify(event));
      } catch {}
    },
  };
}

/** No-op fallback used when Redis is not configured. */
export const noopCacheService: CacheService = {
  get: async () => null,
  set: async () => {},
  del: async () => {},
  delPattern: async () => {},
  publish: async () => {},
};

/**
 * Cache-aside helper: returns cached value if present, otherwise calls `load()`,
 * stores the result, and returns it. Single call site, zero boilerplate.
 *
 * @example
 * const rows = await withCache(cache, CACHE_KEYS.countries, CACHE_TTL.static.seconds, () => listCountries(db));
 */
export async function withCache<T>(
  cache: CacheService,
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;
  const value = await load();
  await cache.set(key, value, ttlSeconds);
  return value;
}
