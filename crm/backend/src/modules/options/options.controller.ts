import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { idParam } from '../common/schemas.js';
import { sendOk } from '../common/response.js';

const security = [{ bearerAuth: [] }];

const createBody = z.object({
  category: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(200),
  position: z.coerce.number().int().min(0).max(100_000).default(0),
  isActive: z.boolean().default(true),
});

const updateBody = z.object({
  value: z.string().trim().min(1).max(120).optional(),
  label: z.string().trim().min(1).max(200).optional(),
  position: z.coerce.number().int().min(0).max(100_000).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Public reference data: all app-managed dropdown options in one response, grouped by category
 * (service_interest, budget_range, timeline, capture_channel, lead_source, opportunity_type,
 * contract_kind, campaign_channel, currency, and any further categories added via Settings →
 * General). One call
 * populates every non-country dropdown. No auth.
 */
const optionsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  app.get(
    '/options',
    { schema: { tags: ['Options'], summary: 'All dropdown options grouped by category' } },
    async (request, reply) => sendOk(request, reply, await app.deps.options.getGrouped()),
  );

  typed.get(
    '/settings/options',
    { schema: { tags: ['Options', 'Settings'], summary: 'List every option row for admin management', security }, preHandler: app.authorize('users.manage') },
    async (request, reply) => sendOk(request, reply, await app.deps.options.listAll()),
  );

  typed.post(
    '/settings/options',
    { schema: { tags: ['Options', 'Settings'], summary: 'Create an option (introduces a new category if it does not exist yet)', body: createBody, security }, preHandler: app.authorize('users.manage') },
    async (request, reply) => {
      const row = await app.deps.options.create(request.user, request.body);
      return sendOk(request, reply, row, 201);
    },
  );

  typed.patch(
    '/settings/options/:id',
    { schema: { tags: ['Options', 'Settings'], summary: 'Update an option', params: idParam, body: updateBody, security }, preHandler: app.authorize('users.manage') },
    async (request, reply) => {
      const row = await app.deps.options.update(request.user, request.params.id, request.body);
      return sendOk(request, reply, row);
    },
  );

  typed.delete(
    '/settings/options/:id',
    { schema: { tags: ['Options', 'Settings'], summary: 'Delete an option', params: idParam, security }, preHandler: app.authorize('users.manage') },
    async (request, reply) => {
      await app.deps.options.delete(request.user, request.params.id);
      return sendOk(request, reply, { deleted: true });
    },
  );
};

export default optionsController;
