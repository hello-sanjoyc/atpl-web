import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { SSE_CHANNEL } from '../../cache/cache.service.js';
import { getRedisSubscriber } from '../../cache/redis.js';
import { AuthenticationError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import { findActiveUserById } from '../users/users.repository.js';

/**
 * GET /events?token=<jwt> — Server-Sent Events stream.
 *
 * EventSource cannot set custom headers, so the JWT is passed as a query param.
 * The plugin verifies it the same way the auth plugin does, but reads from the query
 * string rather than the Authorization header.
 *
 * When Redis is not configured, the endpoint stays open (heartbeat only) so the
 * frontend hook connects without error — it just never receives invalidation events.
 */
const sseController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    '/events',
    {
      schema: {
        tags: ['Events'],
        summary: 'SSE stream for cache invalidation notifications',
        querystring: z.object({ token: z.string().min(1) }),
      },
    },
    async (request, reply) => {
      // Authenticate via query-string token (EventSource cannot set headers)
      let userId: string;
      try {
        const payload = app.jwt.verify<{ sub: string }>(request.query.token);
        userId = payload.sub;
      } catch {
        throw new AuthenticationError(ErrorCodes.UNAUTHENTICATED, 'Invalid or expired token.');
      }
      const user = await findActiveUserById(app.deps.db, userId);
      if (!user) throw new AuthenticationError(ErrorCodes.UNAUTHENTICATED, 'User not found.');

      const redisUrl = app.deps.config.REDIS_URL;
      const subscriber = getRedisSubscriber(redisUrl);

      // CORS must be set explicitly — the plugin doesn't apply to raw/hijacked responses
      const origin = request.headers.origin;
      if (origin && app.deps.config.corsOrigins.includes(origin)) {
        reply.raw.setHeader('Access-Control-Allow-Origin', origin);
      }

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('X-Accel-Buffering', 'no');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.flushHeaders();

      // Heartbeat comment every 25 s to keep the connection alive through proxies
      const heartbeat = setInterval(() => {
        if (!reply.raw.writableEnded) {
          reply.raw.write(': heartbeat\n\n');
        }
      }, 25_000);

      function onMessage(_channel: string, message: string) {
        if (!reply.raw.writableEnded) {
          reply.raw.write(`data: ${message}\n\n`);
        }
      }

      if (subscriber) {
        await subscriber.subscribe(SSE_CHANNEL);
        subscriber.on('message', onMessage);
      }

      await new Promise<void>((resolve) => {
        request.raw.on('close', resolve);
      });

      clearInterval(heartbeat);
      if (subscriber) {
        subscriber.off('message', onMessage);
        if (subscriber.listenerCount('message') === 0) {
          void subscriber.unsubscribe(SSE_CHANNEL);
        }
      }
    },
  );
};

export default sseController;
