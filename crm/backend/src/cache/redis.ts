import { Redis } from 'ioredis';

let _client: Redis | null = null;
let _subscriber: Redis | null = null;

/** Returns the shared Redis client, or null when REDIS_URL is not configured. */
export function getRedisClient(redisUrl: string | undefined): Redis | null {
  if (!redisUrl) return null;
  if (!_client) {
    _client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      enableOfflineQueue: false,
    });
    _client.on('error', () => {
      // suppress unhandled — callers treat null as "cache miss"
    });
  }
  return _client;
}

/**
 * Returns a *separate* Redis connection used exclusively for SUBSCRIBE.
 * ioredis requires a dedicated connection once subscribe() is called.
 */
export function getRedisSubscriber(redisUrl: string | undefined): Redis | null {
  if (!redisUrl) return null;
  if (!_subscriber) {
    _subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      enableOfflineQueue: false,
    });
    _subscriber.on('error', () => {});
  }
  return _subscriber;
}

export async function closeRedis(): Promise<void> {
  await Promise.all([_client?.quit(), _subscriber?.quit()]);
  _client = null;
  _subscriber = null;
}
