import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { currencyField, isoDateField, moneyField, optionalText, paginationQuery } from '../common/schemas.js';
import { sendList, sendOk } from '../common/response.js';
import { createRevenueService } from './revenue.service.js';

const security = [{ bearerAuth: [] }];
const decimalRate = z.string().regex(/^\d{1,10}(\.\d{1,8})?$/, 'Rate must be a positive decimal string.').refine((v) => Number(v) > 0, 'Rate must be greater than zero.');

const createRevenueBody = z
  .object({
    customerId: z.uuid().optional(),
    opportunityId: z.uuid().optional(),
    contractId: z.uuid().optional(),
    kind: z.enum(['invoiced', 'collected']),
    amount: moneyField.refine((v) => Number(v) > 0, 'Amount must be greater than zero.'),
    currency: currencyField,
    recognizedOn: isoDateField,
    reference: optionalText(120).optional(),
  });

const createRateBody = z.object({
  base: currencyField,
  quote: currencyField,
  rate: decimalRate,
  rateDate: isoDateField,
  source: z.string().trim().min(2).max(60),
});

const listRevenueQuery = paginationQuery.extend({
  kind: z.enum(['invoiced', 'collected']).optional(),
  currency: currencyField.optional(),
  from: isoDateField.optional(),
  to: isoDateField.optional(),
  customerId: z.uuid().optional(),
});

const revenueController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createRevenueService(app.deps);

  typed.get(
    '/revenue-records',
    { schema: { tags: ['Revenue'], summary: 'List invoiced or collected revenue records', querystring: listRevenueQuery, security }, preHandler: app.authorize('revenue.read') },
    async (request, reply) => {
      const { items, page } = await service.listRecords(request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/revenue-records',
    {
      schema: {
        tags: ['Revenue'],
        summary: 'Record invoiced or collected revenue (won value is not revenue)',
        body: createRevenueBody,
        security,
      },
      preHandler: app.authorize('revenue.manage'),
    },
    async (request, reply) => sendOk(request, reply, await service.createRecord(request.user, request.body), 201),
  );

  typed.get(
    '/exchange-rates',
    { schema: { tags: ['Revenue'], summary: 'List exchange rates with their sources', querystring: paginationQuery, security }, preHandler: app.authorize('revenue.read') },
    async (request, reply) => {
      const { items, page } = await service.listRates(request.query.page, request.query.pageSize);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/exchange-rates',
    {
      schema: { tags: ['Revenue'], summary: 'Record an exchange rate with an explicit source', body: createRateBody, security },
      preHandler: app.authorize('revenue.manage'),
    },
    async (request, reply) => sendOk(request, reply, await service.createRate(request.user, request.body), 201),
  );

};

export default revenueController;
