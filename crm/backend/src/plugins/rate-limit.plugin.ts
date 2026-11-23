import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import { ErrorCodes } from '../errors/error-codes.js';

/**
 * Global per-IP limit plus stricter per-route limits on public endpoints (configured via
 * `config.rateLimit`). When REDIS_URL is set, counters are shared across PM2 cluster workers.
 */
export default fp(
  async (app: FastifyInstance) => {
    const { config } = app.deps;
    const security = app.deps.security;
    const redis = config.REDIS_URL ? new Redis(config.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: false }) : undefined;

    if (redis) {
      // Without a listener, a connection failure here is an uncaught
      // EventEmitter error that crashes the whole process. Log once per
      // reconnect attempt instead of letting @fastify/rate-limit's
      // per-request Redis calls surface as unhandled 500s.
      const log = app.deps.logger.child({ module: 'rate-limit' });
      redis.on('error', (error) => {
        log.error({ event: 'rate_limit.redis_unavailable', err: error }, 'Redis rate-limit store unavailable');
      });

      app.addHook('onClose', async () => {
        redis.disconnect();
      });
    }

    await app.register(rateLimit, {
      global: true,
      max: config.RATE_LIMIT_MAX,
      timeWindow: config.RATE_LIMIT_WINDOW,
      redis,
      nameSpace: 'aranax-rl:',
      keyGenerator: (request: import('fastify').FastifyRequest) => request.ip,
      onExceeded: (request: import('fastify').FastifyRequest) => {
        security.record('auth.rate_limited', { route: request.routeOptions.url, ip: request.ip }, 'warn');
      },
      errorResponseBuilder: (request: import('fastify').FastifyRequest) => ({
        statusCode: 429,
        success: false,
        error: { code: ErrorCodes.RATE_LIMITED, message: 'Too many requests. Please retry later.' },
        meta: { requestId: request.id },
      }),
    });
  },
  { name: 'rate-limit' },
);
