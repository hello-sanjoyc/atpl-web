import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { currencyField, isoDateField } from '../common/schemas.js';
import { sendOk } from '../common/response.js';
import { createAnalyticsService } from './analytics.service.js';
import { generateAttributionReport } from '../ai/marketing-attribution.service.js';
import { withCache } from '../../cache/cache.service.js';
import { CACHE_KEYS, CACHE_TTL } from '@aranax/contracts';

const security = [{ bearerAuth: [] }];

const periodFields = {
  from: isoDateField.optional(),
  to: isoDateField.optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  quarter: z.coerce.number().int().min(1).max(4).transform((v) => v as 1 | 2 | 3 | 4).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
};

const overviewQuery = z.object({
  ...periodFields,
  baseCurrency: currencyField.default('USD'),
});

const trendsQuery = z.object({
  months: z.coerce.number().int().min(1).max(24).default(12),
  baseCurrency: currencyField.default('USD'),
});

const leadsExportQuery = z.object({
  stage: z.string().optional(),
  ownerId: z.uuid().optional(),
  qualificationStatus: z.string().optional(),
});

const revenueExportQuery = z.object({
  ...periodFields,
  kind: z.enum(['invoiced', 'collected']).optional(),
  currency: currencyField.optional(),
  customerId: z.uuid().optional(),
});

const analyticsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createAnalyticsService(app.deps);

  typed.get(
    '/analytics/overview',
    { schema: { tags: ['Analytics'], summary: 'Funnel and revenue overview for a reporting period (UTC)', querystring: overviewQuery, security }, preHandler: app.authorize('analytics.read') },
    async (request, reply) => {
      const qKey = JSON.stringify(request.query);
      const cacheKey = CACHE_KEYS.analyticsOverview(request.user.id) + ':' + qKey;
      const result = await withCache(app.deps.cache, cacheKey, CACHE_TTL.analytics.seconds, () => service.overview(request.user, request.query));
      return sendOk(request, reply, result);
    },
  );

  typed.get(
    '/analytics/trends',
    {
      schema: {
        tags: ['Analytics'],
        summary: 'Monthly trend series (leads, opportunities, customers, revenue) for the last N calendar months',
        querystring: trendsQuery,
        security,
      },
      preHandler: app.authorize('analytics.read'),
    },
    async (request, reply) => {
      const qKey = JSON.stringify(request.query);
      const cacheKey = CACHE_KEYS.analyticsOverview(request.user.id) + ':trends:' + qKey;
      const result = await withCache(app.deps.cache, cacheKey, CACHE_TTL.analytics.seconds, () => service.trends(request.user, request.query));
      return sendOk(request, reply, result);
    },
  );

  typed.get(
    '/analytics/attribution',
    {
      schema: {
        tags: ['Analytics', 'AI'],
        summary: 'AI marketing attribution — per-channel and per-campaign lead, opportunity, and revenue breakdown',
        querystring: z.object({ ...periodFields }),
        security,
      },
      preHandler: app.authorize('analytics.read'),
    },
    async (request, reply) => {
      const qKey = JSON.stringify(request.query);
      const cacheKey = CACHE_KEYS.analyticsAttr(request.user.id) + ':' + qKey;
      const result = await withCache(app.deps.cache, cacheKey, CACHE_TTL.analytics.seconds, () => generateAttributionReport(app.deps, request.query));
      return sendOk(request, reply, result);
    },
  );

  typed.get(
    '/exports/leads.csv',
    { schema: { tags: ['Exports'], summary: 'Export leads as CSV (scoped to ownership; PII only with leads.pii)', querystring: leadsExportQuery, security }, preHandler: app.authorize('leads.export') },
    async (request, reply) => {
      const result = await service.exportLeadsCsv(request.user, request.query);
      reply.header('content-type', 'text/csv; charset=utf-8');
      reply.header('content-disposition', 'attachment; filename="leads.csv"');
      reply.header('x-export-row-count', String(result.rowCount));
      reply.header('x-export-truncated', String(result.truncated));
      return result.csv;
    },
  );

  typed.get(
    '/exports/revenue-records.csv',
    { schema: { tags: ['Exports'], summary: 'Export revenue records as CSV', querystring: revenueExportQuery, security }, preHandler: app.authorize('revenue.export') },
    async (request, reply) => {
      const result = await service.exportRevenueCsv(request.user, request.query);
      reply.header('content-type', 'text/csv; charset=utf-8');
      reply.header('content-disposition', 'attachment; filename="revenue-records.csv"');
      reply.header('x-export-row-count', String(result.rowCount));
      reply.header('x-export-truncated', String(result.truncated));
      return result.csv;
    },
  );
};

export default analyticsController;
