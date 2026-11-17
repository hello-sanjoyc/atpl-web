import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { idParam } from '../common/schemas.js';
import { sendList, sendOk } from '../common/response.js';
import { createUsersService } from './users.service.js';
import { createUserBody, listUsersQuery, updateUserBody } from './users.schema.js';

const usersController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createUsersService(app.deps);
  const security = { security: [{ bearerAuth: [] }] };

  typed.get(
    '/users',
    {
      schema: { tags: ['Users'], summary: 'List internal users', querystring: listUsersQuery, ...security },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => {
      const { items, page } = await service.list(request.query);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/users',
    {
      schema: { tags: ['Users'], summary: 'Create an internal user', body: createUserBody, ...security },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => {
      const user = await service.create(request.user, request.body);
      return sendOk(request, reply, user, 201);
    },
  );

  typed.patch(
    '/users/:id',
    {
      schema: { tags: ['Users'], summary: 'Update role, status or name of a user', params: idParam, body: updateUserBody, ...security },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => {
      const user = await service.update(request.user, request.params.id, request.body);
      return sendOk(request, reply, user);
    },
  );
};

export default usersController;
