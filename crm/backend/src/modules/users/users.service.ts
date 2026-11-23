import { ErrorCodes } from '../../errors/error-codes.js';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../errors/app.error.js';
import type { Container } from '../../container.js';
import type { AuthUser } from '../../types/fastify.js';
import { hashPassword } from '../../utils/password.js';
import { recordAudit } from '../audit/audit.repository.js';
import { pagination } from '../common/response.js';
import { withCache } from '../../cache/cache.service.js';
import { CACHE_KEYS, CACHE_TTL, QUERY_KEYS } from '@aranax/contracts';
import type { CreateUserInput, UpdateUserInput } from './users.schema.js';
import { findUserByEmail, findUserById, insertUser, listUsers, updateUser } from './users.repository.js';

export function createUsersService(deps: Container) {
  const { db, cache, logger, security } = deps;
  const log = logger.child({ module: 'users' });

  return {
    async create(actor: AuthUser, input: CreateUserInput) {
      const existing = await findUserByEmail(db, input.email);
      if (existing) throw new ConflictError(ErrorCodes.CONFLICT, 'A user with this email already exists.');
      const passwordHash = await hashPassword(input.password);

      const user = await db.transaction(async (tx) => {
        const created = await insertUser(tx, { email: input.email, name: input.name, phone: input.phone ?? null, role: input.role, passwordHash });
        await recordAudit(tx, {
          actorId: actor.id,
          action: 'user.created',
          entityType: 'user',
          entityId: created.id,
          metadata: { role: created.role },
        });
        return created;
      });
      log.info({ event: 'user.created', targetUserId: user.id, role: user.role }, 'User created');
      await Promise.all([
        cache.delPattern(CACHE_KEYS.users),
        cache.publish({ type: 'users.updated', queryKeys: [QUERY_KEYS.users as unknown as string[]] }),
      ]);
      return toPublic(user);
    },

    async getById(id: string) {
      const user = await findUserById(db, id);
      if (!user) throw new NotFoundError(ErrorCodes.USER_NOT_FOUND, 'The requested user was not found.');
      return toPublic(user);
    },

    async list(query: { page: number; pageSize: number; role?: string; sort: 'name' | 'createdAt'; order: 'asc' | 'desc' }) {
      const cacheKey = `${CACHE_KEYS.users}:p${query.page}:s${query.pageSize}:r${query.role ?? 'any'}:so${query.sort}:o${query.order}`;
      return withCache(cache, cacheKey, CACHE_TTL.list.seconds, async () => {
        const { rows, total } = await listUsers(db, {
          role: query.role,
          limit: query.pageSize,
          offset: (query.page - 1) * query.pageSize,
          sort: query.sort,
          order: query.order,
        });
        return { items: rows.map(toPublic), page: pagination(query.page, query.pageSize, total) };
      });
    },

    async update(actor: AuthUser, id: string, input: UpdateUserInput) {
      const current = await findUserById(db, id);
      if (!current) throw new NotFoundError(ErrorCodes.USER_NOT_FOUND, 'The requested user was not found.');
      if (id === actor.id && input.isActive === false) {
        throw new BusinessRuleError(ErrorCodes.BUSINESS_RULE_VIOLATION, 'You cannot deactivate your own account.');
      }

      if (input.email && input.email.toLowerCase() !== current.email.toLowerCase()) {
        const clash = await findUserByEmail(db, input.email);
        if (clash) throw new ConflictError(ErrorCodes.CONFLICT, 'A user with this email already exists.');
      }

      const patch = { ...input, ...(input.email ? { email: input.email.toLowerCase() } : {}) };

      const updated = await db.transaction(async (tx) => {
        const row = await updateUser(tx, id, patch);
        if (!row) throw new NotFoundError(ErrorCodes.USER_NOT_FOUND, 'The requested user was not found.');
        if (input.role && input.role !== current.role) {
          await recordAudit(tx, {
            actorId: actor.id,
            action: 'user.role_changed',
            entityType: 'user',
            entityId: id,
            metadata: { from: current.role, to: input.role },
          });
        }
        if (input.isActive !== undefined && input.isActive !== current.isActive) {
          await recordAudit(tx, {
            actorId: actor.id,
            action: input.isActive ? 'user.activated' : 'user.deactivated',
            entityType: 'user',
            entityId: id,
          });
        }
        return row;
      });

      if (input.role && input.role !== current.role) {
        security.record('user.permission_changed', { actorUserId: actor.id, targetUserId: id, from: current.role, to: input.role }, 'warn');
      }
      log.info({ event: 'user.updated', targetUserId: id, fields: Object.keys(input) }, 'User updated');
      await Promise.all([
        cache.delPattern(CACHE_KEYS.users),
        cache.publish({ type: 'users.updated', queryKeys: [QUERY_KEYS.users as unknown as string[]] }),
      ]);
      return toPublic(updated);
    },
  };
}

export function toPublic(user: { id: string; email: string; name: string; phone?: string | null; role: string; isActive: boolean; createdAt: Date }) {
  return { id: user.id, email: user.email, name: user.name, phone: user.phone ?? null, role: user.role, isActive: user.isActive, createdAt: user.createdAt.toISOString() };
}
