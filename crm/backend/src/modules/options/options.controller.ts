import type { FastifyPluginAsync } from 'fastify';
import { sendOk } from '../common/response.js';

/**
 * Public reference data: all app-managed dropdown options in one response, grouped by category
 * (service_interest, budget_range, timeline, capture_channel, lead_source, opportunity_type,
 * contract_kind). One call populates every non-country dropdown. No auth.
 */
const optionsController: FastifyPluginAsync = async (app) => {
  app.get(
    '/options',
    { schema: { tags: ['Options'], summary: 'All dropdown options grouped by category' } },
    async (request, reply) => sendOk(request, reply, await app.deps.options.getGrouped()),
  );
};

export default optionsController;
