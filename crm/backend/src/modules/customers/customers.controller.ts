import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { RENEWAL_REMINDER_WINDOW_DAYS } from '../../config/constants.js';
import { countryField, currencyField, emailField, idParam, isoDateField, moneyField, optionValue, optionalText, paginationQuery, phoneField, shortText } from '../common/schemas.js';
import { sendList, sendOk } from '../common/response.js';
import { createCustomersService } from './customers.service.js';

const security = [{ bearerAuth: [] }];

const createCustomerBody = z.object({
  name: shortText(120),
  company: optionalText(160).optional(),
  email: emailField,
  phone: phoneField.optional(),
  country: countryField.optional(),
  sourceLeadId: z.uuid().optional(),
});

const updateCustomerBody = z
  .object({
    name: shortText(120).optional(),
    company: optionalText(160).nullable().optional(),
    phone: phoneField.nullable().optional(),
    country: countryField.nullable().optional(),
    status: z.enum(['active', 'churned']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided.' });

const contactBody = z.object({
  name: shortText(120),
  email: emailField.optional(),
  phone: phoneField.optional(),
  role: optionalText(80).optional(),
  isPrimary: z.boolean().default(false),
});

const contractBody = z.object({
  opportunityId: z.uuid().optional(),
  name: shortText(160),
  kind: optionValue,
  value: moneyField,
  currency: currencyField,
  startsOn: isoDateField,
  renewsOn: isoDateField.optional(),
});

const customersController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createCustomersService(app.deps);

  typed.get(
    '/customers',
    {
      schema: {
        tags: ['Customers'],
        summary: 'List customers',
        querystring: paginationQuery.extend({
          q: z.string().trim().max(100).optional(),
          status: z.enum(['active', 'churned']).optional(),
          sort: z.enum(['name', 'createdAt']).default('name'),
          order: z.enum(['asc', 'desc']).default('asc'),
        }),
        security,
      },
      preHandler: app.authorize('customers.read'),
    },
    async (request, reply) => {
      const { items, page } = await service.list(request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/customers',
    { schema: { tags: ['Customers'], summary: 'Create a customer', body: createCustomerBody, security }, preHandler: app.authorize('customers.manage') },
    async (request, reply) => sendOk(request, reply, await service.create(request.user, request.body), 201),
  );

  typed.get(
    '/customers/:id',
    { schema: { tags: ['Customers'], summary: 'Get a customer with contacts, contracts and opportunities', params: idParam, security }, preHandler: app.authorize('customers.read') },
    async (request, reply) => sendOk(request, reply, await service.get(request.params.id)),
  );

  typed.patch(
    '/customers/:id',
    { schema: { tags: ['Customers'], summary: 'Update a customer', params: idParam, body: updateCustomerBody, security }, preHandler: app.authorize('customers.manage') },
    async (request, reply) => sendOk(request, reply, await service.update(request.user, request.params.id, request.body)),
  );

  typed.get(
    '/customers/:id/history',
    { schema: { tags: ['Customers'], summary: 'Customer opportunities and revenue history', params: idParam, security }, preHandler: app.authorize('customers.read') },
    async (request, reply) => sendOk(request, reply, await service.history(request.params.id)),
  );

  typed.post(
    '/customers/:id/contacts',
    { schema: { tags: ['Customers'], summary: 'Add a contact to a customer', params: idParam, body: contactBody, security }, preHandler: app.authorize('customers.manage') },
    async (request, reply) => sendOk(request, reply, await service.addContact(request.user, request.params.id, request.body), 201),
  );

  typed.post(
    '/customers/:id/contracts',
    { schema: { tags: ['Customers'], summary: 'Add a contract (subscription or maintenance)', params: idParam, body: contractBody, security }, preHandler: app.authorize('customers.manage') },
    async (request, reply) => sendOk(request, reply, await service.addContract(request.user, request.params.id, request.body), 201),
  );

  typed.get(
    '/contracts/renewals',
    {
      schema: {
        tags: ['Customers'],
        summary: 'Contracts renewing within a window',
        querystring: z.object({ withinDays: z.coerce.number().int().min(1).max(365).default(RENEWAL_REMINDER_WINDOW_DAYS) }),
        security,
      },
      preHandler: app.authorize('customers.read'),
    },
    async (request, reply) => sendOk(request, reply, await service.listRenewals(request.query.withinDays)),
  );
};

export default customersController;

