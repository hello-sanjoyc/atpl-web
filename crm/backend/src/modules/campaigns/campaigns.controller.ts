import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { idParam } from '../common/schemas.js';
import { sendList, sendOk } from '../common/response.js';
import { createCampaignsService } from './campaigns.service.js';
import { createAcquisitionCostBody, createCampaignBody, createReferralBody, listCampaignsQuery, listReferralsQuery, updateCampaignBody } from './campaigns.schema.js';

const security = [{ bearerAuth: [] }];

const campaignsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createCampaignsService(app.deps);

  typed.get(
    '/campaigns',
    { schema: { tags: ['Campaigns'], summary: 'List campaigns', querystring: listCampaignsQuery, security }, preHandler: app.authorize('analytics.read') },
    async (request, reply) => {
      const { items, page } = await service.list(request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/campaigns',
    { schema: { tags: ['Campaigns'], summary: 'Create a campaign', body: createCampaignBody, security }, preHandler: app.authorize('campaigns.manage') },
    async (request, reply) => sendOk(request, reply, await service.create(request.user, request.body), 201),
  );

  typed.get(
    '/campaigns/:id',
    { schema: { tags: ['Campaigns'], summary: 'Get a campaign', params: idParam, security }, preHandler: app.authorize('analytics.read') },
    async (request, reply) => sendOk(request, reply, await service.get(request.params.id)),
  );

  typed.patch(
    '/campaigns/:id',
    { schema: { tags: ['Campaigns'], summary: 'Update a campaign', params: idParam, body: updateCampaignBody, security }, preHandler: app.authorize('campaigns.manage') },
    async (request, reply) => sendOk(request, reply, await service.update(request.user, request.params.id, request.body)),
  );

  typed.get(
    '/campaigns/:id/acquisition-costs',
    { schema: { tags: ['Campaigns'], summary: 'List acquisition costs for a campaign', params: idParam, security }, preHandler: app.authorize('analytics.financial') },
    async (request, reply) => sendOk(request, reply, await service.listCosts(request.params.id)),
  );

  typed.post(
    '/campaigns/:id/acquisition-costs',
    {
      schema: { tags: ['Campaigns'], summary: 'Record acquisition cost for a campaign period', params: idParam, body: createAcquisitionCostBody, security },
      preHandler: app.authorize('campaigns.manage'),
    },
    async (request, reply) =>
      sendOk(request, reply, await service.addCost(request.user, request.params.id, request.body), 201),
  );

  typed.post(
    '/acquisition-costs',
    {
      schema: {
        tags: ['Campaigns'],
        summary: 'Record a channel-level acquisition cost not tied to a campaign',
        body: createAcquisitionCostBody,
        security,
      },
      preHandler: app.authorize('campaigns.manage'),
    },
    async (request, reply) => sendOk(request, reply, await service.addCost(request.user, null, request.body), 201),
  );

  typed.get(
    '/referrals',
    { schema: { tags: ['Referrals'], summary: 'List referral sources', querystring: listReferralsQuery, security }, preHandler: app.authorize('referrals.manage') },
    async (request, reply) => {
      const { items, page } = await service.listReferrals(request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/referrals',
    { schema: { tags: ['Referrals'], summary: 'Create a referral code', body: createReferralBody, security }, preHandler: app.authorize('referrals.manage') },
    async (request, reply) => sendOk(request, reply, await service.createReferral(request.user, request.body), 201),
  );

  typed.get(
    '/referrals/:id',
    { schema: { tags: ['Referrals'], summary: 'Get a referral source', params: z.object({ id: z.uuid() }), security }, preHandler: app.authorize('referrals.manage') },
    async (request, reply) => sendOk(request, reply, await service.getReferral(request.params.id)),
  );
};

export default campaignsController;
