import { sql } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import { countOutboxByStatus } from '../../jobs/queues/outbox.repository.js';

/** Liveness never touches dependencies. Readiness verifies the database and reports outbox backlog. */
const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', { schema: { tags: ['Health'], summary: 'Liveness probe' } }, async () => ({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
  }));

  app.get('/ready', { schema: { tags: ['Health'], summary: 'Readiness probe (database and outbox)' } }, async (request, reply) => {
    const { db } = app.deps;
    const started = Date.now();
    try {
      await db.execute(sql`select 1`);
    } catch (error) {
      request.log.error({ event: 'health.database_unreachable', err: error }, 'Readiness check failed');
      return reply.code(503).send({ status: 'unavailable', checks: { database: 'down' } });
    }
    const outbox = await countOutboxByStatus(db);
    return {
      status: 'ready',
      checks: { database: { status: 'up', latencyMs: Date.now() - started }, outbox },
    };
  });
};

export default healthRoutes;
