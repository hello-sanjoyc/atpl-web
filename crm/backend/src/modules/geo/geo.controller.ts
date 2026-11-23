import type { FastifyPluginAsync } from 'fastify';
import { sendOk } from '../common/response.js';
import { listCountries } from './geo.repository.js';
import { withCache } from '../../cache/cache.service.js';
import { CACHE_KEYS, CACHE_TTL } from '@aranax/contracts';

/** Public reference data: the country list that populates country dropdowns. No auth. */
const geoController: FastifyPluginAsync = async (app) => {
  app.get(
    '/countries',
    { schema: { tags: ['Geo'], summary: 'List all countries (ISO 3166-1) for dropdowns' } },
    async (request, reply) => {
      const countries = await withCache(
        app.deps.cache,
        CACHE_KEYS.countries,
        CACHE_TTL.static.seconds,
        () => listCountries(app.deps.db),
      );
      return sendOk(request, reply, countries);
    },
  );
};

export default geoController;
