import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { idParam } from '../common/schemas.js';
import { sendList, sendOk } from '../common/response.js';
import { createOpportunitiesService } from './opportunities.service.js';
import {
  changeOpportunityStageBody,
  createOpportunityBody,
  listOpportunitiesQuery,
  recordProposalBody,
  updateOpportunityBody,
} from './opportunities.schema.js';

const security = [{ bearerAuth: [] }];

const opportunitiesController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createOpportunitiesService(app.deps);

  typed.get(
    '/opportunities',
    { schema: { tags: ['Opportunities'], summary: 'List opportunities', querystring: listOpportunitiesQuery, security }, preHandler: app.authorize('opportunities.read') },
    async (request, reply) => {
      const { items, page } = await service.list(request.user, request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/opportunities',
    { schema: { tags: ['Opportunities'], summary: 'Create an opportunity from a lead or customer', body: createOpportunityBody, security }, preHandler: app.authorize('opportunities.create') },
    async (request, reply) => sendOk(request, reply, await service.create(request.user, request.body), 201),
  );

  typed.get(
    '/opportunities/:id',
    { schema: { tags: ['Opportunities'], summary: 'Get an opportunity', params: idParam, security }, preHandler: app.authorize('opportunities.read') },
    async (request, reply) => sendOk(request, reply, await service.get(request.user, request.params.id)),
  );

  typed.patch(
    '/opportunities/:id',
    { schema: { tags: ['Opportunities'], summary: 'Update opportunity details', params: idParam, body: updateOpportunityBody, security }, preHandler: app.authorize('opportunities.update') },
    async (request, reply) => sendOk(request, reply, await service.update(request.user, request.params.id, request.body)),
  );

  typed.post(
    '/opportunities/:id/stage',
    {
      schema: { tags: ['Opportunities'], summary: 'Move an opportunity to another stage (won and lost require closing permission)', params: idParam, body: changeOpportunityStageBody, security },
      preHandler: app.authorize('opportunities.update'),
    },
    async (request, reply) => sendOk(request, reply, await service.changeStage(request.user, request.params.id, request.body)),
  );

  typed.post(
    '/opportunities/:id/proposals',
    { schema: { tags: ['Opportunities'], summary: 'Record a proposal sent to the client', params: idParam, body: recordProposalBody, security }, preHandler: app.authorize('opportunities.update') },
    async (request, reply) => sendOk(request, reply, await service.recordProposal(request.user, request.params.id, request.body)),
  );

  typed.get(
    '/opportunities/:id/history',
    { schema: { tags: ['Opportunities'], summary: 'Stage history of an opportunity', params: idParam, security }, preHandler: app.authorize('opportunities.read') },
    async (request, reply) => sendOk(request, reply, await service.history(request.user, request.params.id)),
  );
};

export default opportunitiesController;
