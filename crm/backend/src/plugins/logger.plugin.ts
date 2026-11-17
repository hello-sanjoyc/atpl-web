import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Exactly one completion record per HTTP request. Fastify's built-in request logging is disabled
 * in favour of this hook to avoid duplicate completion lines.
 */
export default fp(
  async (app: FastifyInstance) => {
    app.addHook('onResponse', (request, reply, done) => {
      const statusCode = reply.statusCode;
      const route = request.routeOptions.url ?? 'unmatched';
      const fields = {
        event: 'http.request_completed',
        method: request.method,
        route,
        statusCode,
        durationMs: Math.round(reply.elapsedTime),
        requestSizeBytes: Number(request.headers['content-length'] ?? 0) || undefined,
        responseSizeBytes: Number(reply.getHeader('content-length') ?? 0) || undefined,
      };
      const message = 'HTTP request completed';
      if (statusCode >= 500) request.log.error(fields, message);
      else if (statusCode === 429) request.log.warn(fields, message);
      else request.log.info(fields, message);
      done();
    });
  },
  { name: 'logger' },
);
