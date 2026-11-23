import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { sendList, sendOk } from '../common/response.js';
import { createSecurityEventsService } from './security-events.service.js';
import { listSecurityEventsQuery } from './security-events.schema.js';

const security = [{ bearerAuth: [] }];

const securityEventsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createSecurityEventsService(app.deps);

  typed.get(
    '/settings/security-events',
    {
      schema: { tags: ['Settings', 'Security'], summary: 'Paginated security/auth event log', querystring: listSecurityEventsQuery, security },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => {
      const { items, page } = await service.list(request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.get(
    '/settings/security-config',
    {
      schema: { tags: ['Settings', 'Security'], summary: 'Read-only security configuration snapshot', security },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => sendOk(request, reply, service.getConfig()),
  );
};

export default securityEventsController;
