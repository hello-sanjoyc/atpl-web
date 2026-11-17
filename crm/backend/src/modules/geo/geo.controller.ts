import type { FastifyPluginAsync } from 'fastify';
import { sendOk } from '../common/response.js';
import { listCountries } from './geo.repository.js';

/** Public reference data: the country list that populates country dropdowns. No auth. */
const geoController: FastifyPluginAsync = async (app) => {
  app.get(
    '/countries',
    { schema: { tags: ['Geo'], summary: 'List all countries (ISO 3166-1) for dropdowns' } },
    async (request, reply) => sendOk(request, reply, await listCountries(app.deps.db)),
  );
};

export default geoController;
