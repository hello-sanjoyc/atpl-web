import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { runWithContext } from '../logger/correlation.js';
import { correlationFor } from '../middleware/request-context.js';

/**
 * Binds request and correlation IDs to AsyncLocalStorage for the lifetime of each request, so
 * every log line emitted while handling it (services, repositories, providers) carries them.
 */
export default fp(
  async (app: FastifyInstance) => {
    app.addHook('onRequest', (request, reply, done) => {
      const correlationId = correlationFor(request.raw);
      reply.header('x-request-id', request.id);
      reply.header('x-correlation-id', correlationId);
      runWithContext({ requestId: request.id, correlationId }, () => done());
    });
  },
  { name: 'request-context' },
);
