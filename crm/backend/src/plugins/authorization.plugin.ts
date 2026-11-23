import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ROLE_PERMISSIONS, type Permission } from '../config/constants.js';
import { AuthorizationError } from '../errors/app.error.js';
import { getPermissionsForRole } from '../modules/rbac/rbac.service.js';
import type { Role } from '../config/constants.js';

/**
 * Synchronous static permission check using the compiled ROLE_PERMISSIONS map.
 * Used for record-level ownership helpers (not route guards) where async DB lookup
 * is not feasible. Route-level guards use the DB-backed `app.authorize()` decorator.
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly Permission[] | undefined)?.includes(permission) ?? false;
}

/**
 * Route-level RBAC. Usage: `preHandler: app.authorize('leads.read')`. Authentication runs first.
 * Permissions are loaded from the DB with a 60 s cache; super_admin always has all permissions.
 * Record-level checks (ownership) are enforced in services via the access helpers in leads/access.ts.
 */
export default fp(
  async (app: FastifyInstance) => {
    const security = app.deps.security;
    const { db, cache } = app.deps;

    app.decorate('authorize', (...required: Permission[]) => {
      return async (request: FastifyRequest) => {
        await app.authenticate(request);
        const granted = await getPermissionsForRole(db, cache, request.user.role);
        const missing = required.find((p) => !granted.has(p));
        if (missing) {
          security.record('auth.access_denied', {
            userId: request.user.id,
            permission: missing,
            route: request.routeOptions.url,
            ip: request.ip,
          });
          throw new AuthorizationError();
        }
      };
    });
  },
  { name: 'authorization', dependencies: ['auth'] },
);
