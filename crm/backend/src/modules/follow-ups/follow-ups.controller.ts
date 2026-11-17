import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { idParam } from '../common/schemas.js';
import { sendList, sendOk } from '../common/response.js';
import { createFollowUpBody, listFollowUpsQuery } from './follow-ups.schema.js';
import { createFollowUpsService } from './follow-ups.service.js';

const security = [{ bearerAuth: [] }];

const followUpsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createFollowUpsService(app.deps);

  typed.get(
    '/follow-ups',
    { schema: { tags: ['Follow-ups'], summary: 'List follow-up tasks', querystring: listFollowUpsQuery, security }, preHandler: app.authorize('follow_ups.manage') },
    async (request, reply) => {
      const { items, page } = await service.list(request.user, request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/follow-ups',
    { schema: { tags: ['Follow-ups'], summary: 'Schedule a follow-up for a lead, opportunity or customer', body: createFollowUpBody, security }, preHandler: app.authorize('follow_ups.manage') },
    async (request, reply) => sendOk(request, reply, await service.create(request.user, request.body), 201),
  );

  typed.patch(
    '/follow-ups/:id/complete',
    { schema: { tags: ['Follow-ups'], summary: 'Mark a follow-up as completed', params: idParam, security }, preHandler: app.authorize('follow_ups.manage') },
    async (request, reply) => sendOk(request, reply, await service.complete(request.user, request.params.id)),
  );
};

export default followUpsController;
