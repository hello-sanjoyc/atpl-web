import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { sendOk } from '../common/response.js';
import { PERMISSIONS, ROLES } from '../../config/constants.js';
import { listAllRoleConfigs, listRoleMeta, upsertRoleMeta, createRoleMeta, updateRolePermissions } from './rbac.service.js';

const security = [{ bearerAuth: [] }];

const roleParam = z.object({ role: z.string().min(1) });

const updateMetaBody = z.object({
  label: z.string().min(1).max(80),
  description: z.string().max(400).default(''),
});

const createRoleBody = z.object({
  role: z.string().min(2).max(50).regex(/^[a-z][a-z0-9_]+$/, 'Slug must start with a letter, lowercase letters/digits/underscores only'),
  label: z.string().min(1).max(80),
  description: z.string().max(400).default(''),
});

const updatePermissionsBody = z.object({
  permissions: z.record(z.string(), z.boolean()),
});

const rbacController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const { db, cache } = app.deps;

  /** Returns role metadata (label + description) from role_meta table — super_admin only. */
  typed.get(
    '/settings/roles',
    {
      schema: { tags: ['Settings', 'RBAC'], summary: 'List role metadata (labels and descriptions)', security },
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      const meta = await listRoleMeta(db, cache);
      return sendOk(request, reply, meta);
    },
  );

  /** Returns the full permission matrix for all roles — super_admin only. */
  typed.get(
    '/settings/roles/permissions',
    {
      schema: { tags: ['Settings', 'RBAC'], summary: 'List all role permissions matrix', security },
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      const configs = await listAllRoleConfigs(db, cache);
      return sendOk(request, reply, { roles: configs, allPermissions: PERMISSIONS, allRoles: ROLES });
    },
  );

  /** Create a new custom role. */
  typed.post(
    '/settings/roles',
    {
      schema: {
        tags: ['Settings', 'RBAC'],
        summary: 'Create a new custom role (super_admin only)',
        body: createRoleBody,
        security,
      },
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      try {
        const result = await createRoleMeta(db, cache, request.body.role, request.body, request.user.id);
        return reply.code(201).send({ success: true, data: result });
      } catch (err) {
        request.log.error({ err }, 'createRoleMeta failed');
        throw err;
      }
    },
  );

  /** Update label and description for a role. */
  typed.put(
    '/settings/roles/:role',
    {
      schema: {
        tags: ['Settings', 'RBAC'],
        summary: 'Update role label and description (super_admin only)',
        params: roleParam,
        body: updateMetaBody,
        security,
      },
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      try {
        const result = await upsertRoleMeta(db, cache, request.params.role, request.body, request.user.id);
        return sendOk(request, reply, result);
      } catch (err) {
        request.log.error({ err }, 'upsertRoleMeta failed');
        throw err;
      }
    },
  );

  /** Update granted permissions for a role. */
  typed.put(
    '/settings/roles/:role/permissions',
    {
      schema: {
        tags: ['Settings', 'RBAC'],
        summary: 'Update granted permissions for a role (super_admin only)',
        params: roleParam,
        body: updatePermissionsBody,
        security,
      },
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      try {
        const result = await updateRolePermissions(db, cache, request.params.role, request.body, request.user.id);
        return sendOk(request, reply, result);
      } catch (err) {
        request.log.error({ err }, 'updateRolePermissions failed');
        throw err;
      }
    },
  );

  /** Returns label + description for all roles. */
  typed.get(
    '/settings/roles/meta',
    {
      schema: { tags: ['Settings', 'RBAC'], summary: 'List role metadata (labels and descriptions)', security },
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      const meta = await listRoleMeta(db, cache);
      return sendOk(request, reply, meta);
    },
  );
};

export default rbacController;
