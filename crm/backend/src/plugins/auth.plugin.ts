import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AuthenticationError } from '../errors/app.error.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { setContextUser } from '../logger/correlation.js';
import { findActiveUserById } from '../modules/users/users.repository.js';

export const JWT_ISSUER = 'aranax-lead-api';

/**
 * JWT bearer authentication. Tokens carry only the subject; role and active status are re-read on
 * every request so that deactivation or a role change takes effect immediately.
 */
export default fp(
  async (app: FastifyInstance) => {
    const { config, db } = app.deps;
    const security = app.deps.security;

    await app.register(fastifyJwt, {
      secret: config.JWT_SECRET,
      sign: { expiresIn: config.JWT_ACCESS_TTL, algorithm: 'HS256', iss: JWT_ISSUER },
      verify: { algorithms: ['HS256'], allowedIss: JWT_ISSUER },
    });

    app.decorate('signAccessToken', (userId: string) => app.jwt.sign({ sub: userId }));

    app.decorate('authenticate', async (request: FastifyRequest) => {
      const header = request.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw new AuthenticationError(ErrorCodes.UNAUTHENTICATED, 'A valid bearer token is required.');
      }
      let subject: string;
      try {
        const payload = await request.jwtVerify<{ sub: string }>();
        subject = payload.sub;
      } catch {
        security.record('auth.invalid_token', { route: request.routeOptions.url });
        throw new AuthenticationError(ErrorCodes.UNAUTHENTICATED, 'The access token is invalid or has expired.');
      }
      const user = await findActiveUserById(db, subject);
      if (!user) {
        security.record('auth.invalid_token', { reason: 'inactive_or_missing_user' });
        throw new AuthenticationError(ErrorCodes.UNAUTHENTICATED, 'The access token is invalid or has expired.');
      }
      request.user = { id: user.id, email: user.email, name: user.name, role: user.role };
      setContextUser(user.id);
    });
  },
  { name: 'auth' },
);
