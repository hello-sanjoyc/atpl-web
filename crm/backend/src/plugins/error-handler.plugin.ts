import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { mapError } from '../errors/error-mapper.js';
import { ErrorCodes } from '../errors/error-codes.js';

/**
 * Single boundary that logs and serialises failures. Services throw typed errors and do not log
 * them, so each failure is recorded once, with its request correlation.
 */
export default fp(
  async (app: FastifyInstance) => {
    app.setErrorHandler((error, request, reply) => {
      const mapped = mapError(error);
      const context = {
        event: mapped.expected ? 'request.rejected' : 'system.unhandled_error',
        statusCode: mapped.statusCode,
        errorCode: mapped.code,
        retryable: mapped.retryable,
      };
      if (mapped.expected) {
        request.log[mapped.logLevel](context, `Request rejected: ${mapped.code}`);
      } else {
        request.log.error({ ...context, err: error }, 'Unhandled request error');
      }

      const body: Record<string, unknown> = {
        success: false,
        error: {
          code: mapped.code,
          message: mapped.message,
          ...(mapped.details ? { details: mapped.details } : {}),
        },
        meta: { requestId: request.id },
      };
      if (mapped.statusCode === 429) reply.header('retry-after', '60');
      return reply.status(mapped.statusCode).send(body);
    });

    app.setNotFoundHandler((request, reply) => {
      request.log.info({ event: 'request.rejected', statusCode: 404, errorCode: ErrorCodes.ROUTE_NOT_FOUND }, 'Route not found');
      return reply.status(404).send({
        success: false,
        error: { code: ErrorCodes.ROUTE_NOT_FOUND, message: 'The requested route does not exist.' },
        meta: { requestId: request.id },
      });
    });
  },
  { name: 'error-handler' },
);
