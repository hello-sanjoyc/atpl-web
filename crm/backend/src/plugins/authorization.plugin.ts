import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ROLE_PERMISSIONS, type Permission } from '../config/constants.js';
import { AuthorizationError } from '../errors/app.error.js';

export function roleHasPermission(role: keyof typeof ROLE_PERMISSIONS, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Route-level RBAC. Usage: `preHandler: app.authorize('leads.read')`. Authentication runs first.
 * Record-level checks (ownership) are enforced in services via the access helpers in leads/access.ts.
 */
export default fp(
  async (app: FastifyInstance) => {
    const security = app.deps.security;

    app.decorate('authorize', (...required: Permission[]) => {
      return async (request: FastifyRequest) => {
        await app.authenticate(request);
        const missing = required.find((p) => !roleHasPermission(request.user.role, p));
        if (missing) {
          security.record('auth.access_denied', {
            userId: request.user.id,
            permission: missing,
            route: request.routeOptions.url,
          });
          throw new AuthorizationError();
        }
      };
    });
  },
  { name: 'authorization', dependencies: ['auth'] },
);
