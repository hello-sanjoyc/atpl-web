import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { idParam, paginationQuery } from '../common/schemas.js';
import { sendList, sendOk } from '../common/response.js';
import { createLeadsService } from './leads.service.js';
import {
  assignLeadBody,
  changeStageBody,
  createActivityBody,
  createLeadBody,
  listLeadsQuery,
  qualifyLeadBody,
  updateLeadBody,
} from './leads.schema.js';

const security = [{ bearerAuth: [] }];

const leadsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createLeadsService(app.deps);

  typed.get(
    '/leads',
    {
      schema: { tags: ['Leads'], summary: 'List leads (scoped to owner unless pipeline-wide access)', querystring: listLeadsQuery, security },
      preHandler: app.authorize('leads.read'),
    },
    async (request, reply) => {
      const { items, page } = await service.list(request.user, request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/leads',
    {
      schema: { tags: ['Leads'], summary: 'Create a lead manually', body: createLeadBody, security },
      preHandler: app.authorize('leads.create'),
    },
    async (request, reply) => sendOk(request, reply, await service.create(request.user, request.body), 201),
  );

  typed.get(
    '/leads/:id',
    {
      schema: { tags: ['Leads'], summary: 'Get a lead', params: idParam, security },
      preHandler: app.authorize('leads.read'),
    },
    async (request, reply) => sendOk(request, reply, await service.get(request.user, request.params.id)),
  );

  typed.patch(
    '/leads/:id',
    {
      schema: { tags: ['Leads'], summary: 'Update lead details', params: idParam, body: updateLeadBody, security },
      preHandler: app.authorize('leads.update'),
    },
    async (request, reply) => sendOk(request, reply, await service.update(request.user, request.params.id, request.body)),
  );

  typed.delete(
    '/leads/:id',
    {
      schema: { tags: ['Leads'], summary: 'Soft-delete a lead', params: idParam, security },
      preHandler: app.authorize('leads.delete'),
    },
    async (request, reply) => {
      await service.remove(request.user, request.params.id);
      return sendOk(request, reply, { id: request.params.id, deleted: true });
    },
  );

  typed.patch(
    '/leads/:id/stage',
    {
      schema: { tags: ['Leads'], summary: 'Move a lead to another pipeline stage', params: idParam, body: changeStageBody, security },
      preHandler: app.authorize('leads.update'),
    },
    async (request, reply) => sendOk(request, reply, await service.changeStage(request.user, request.params.id, request.body)),
  );

  typed.patch(
    '/leads/:id/assign',
    {
      schema: { tags: ['Leads'], summary: 'Assign or reassign a lead owner', params: idParam, body: assignLeadBody, security },
      preHandler: app.authorize('leads.assign'),
    },
    async (request, reply) =>
      sendOk(request, reply, await service.assign(request.user, request.params.id, request.body.ownerId, request.body.reason)),
  );

  typed.post(
    '/leads/:id/qualify',
    {
      schema: { tags: ['Leads'], summary: 'Qualify a lead and compute its score', params: idParam, body: qualifyLeadBody, security },
      preHandler: app.authorize('leads.update'),
    },
    async (request, reply) => sendOk(request, reply, await service.qualify(request.user, request.params.id, request.body)),
  );

  typed.get(
    '/leads/:id/activities',
    {
      schema: { tags: ['Leads'], summary: 'List activities on a lead', params: idParam, querystring: paginationQuery, security },
      preHandler: app.authorize('leads.read'),
    },
    async (request, reply) => {
      const { items, page } = await service.listActivities(request.user, request.params.id, request.query.page, request.query.pageSize);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/leads/:id/activities',
    {
      schema: { tags: ['Leads'], summary: 'Record an activity on a lead', params: idParam, body: createActivityBody, security },
      preHandler: app.authorize('leads.update'),
    },
    async (request, reply) =>
      sendOk(request, reply, await service.createActivity(request.user, request.params.id, request.body), 201),
  );

  typed.get(
    '/leads/:id/history',
    {
      schema: { tags: ['Leads'], summary: 'Stage and assignment history of a lead', params: idParam, security },
      preHandler: app.authorize('leads.read'),
    },
    async (request, reply) => sendOk(request, reply, await service.history(request.user, request.params.id)),
  );

  typed.get(
    '/leads/:id/score-explain',
    {
      schema: { tags: ['Leads', 'AI'], summary: 'Get deterministic + AI score breakdown for a lead', params: idParam, security },
      preHandler: app.authorize('leads.read'),
    },
    async (request, reply) => sendOk(request, reply, await service.scoreExplain(request.user, request.params.id)),
  );
};

export default leadsController;
