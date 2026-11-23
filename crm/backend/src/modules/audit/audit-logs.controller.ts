import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { sendList, sendOk } from '../common/response.js';
import { createAuditLogsService } from './audit-logs.service.js';
import { listAuditLogsQuery } from './audit-logs.schema.js';

const security = [{ bearerAuth: [] }];

const auditLogsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createAuditLogsService(app.deps);

  typed.get(
    '/settings/audit-logs',
    {
      schema: { tags: ['Settings', 'Security'], summary: 'Paginated business audit trail (create/update/delete)', querystring: listAuditLogsQuery, security },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => {
      const { items, page } = await service.list(request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.get(
    '/settings/audit-logs/entity-types',
    {
      schema: { tags: ['Settings', 'Security'], summary: 'Distinct entity types present in the audit trail', security },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => sendOk(request, reply, await service.entityTypes()),
  );
};

export default auditLogsController;
