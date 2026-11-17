import { ErrorCodes } from '../../errors/error-codes.js';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../errors/app.error.js';
import type { Container } from '../../container.js';
import type { AuthUser } from '../../types/fastify.js';
import { hashPassword } from '../../utils/password.js';
import { recordAudit } from '../audit/audit.repository.js';
import { pagination } from '../common/response.js';
import type { CreateUserInput, UpdateUserInput } from './users.schema.js';
import { findUserByEmail, findUserById, insertUser, listUsers, updateUser } from './users.repository.js';

export function createUsersService(deps: Container) {
  const { db, logger, security } = deps;
  const log = logger.child({ module: 'users' });

  return {
    async create(actor: AuthUser, input: CreateUserInput) {
      const existing = await findUserByEmail(db, input.email);
      if (existing) throw new ConflictError(ErrorCodes.CONFLICT, 'A user with this email already exists.');
      const passwordHash = await hashPassword(input.password);

      const user = await db.transaction(async (tx) => {
        const created = await insertUser(tx, { email: input.email, name: input.name, role: input.role, passwordHash });
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
      return toPublic(user);
    },

    async list(query: { page: number; pageSize: number }) {
      const { rows, total } = await listUsers(db, {
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return { items: rows.map(toPublic), page: pagination(query.page, query.pageSize, total) };
    },

    async update(actor: AuthUser, id: string, input: UpdateUserInput) {
      const current = await findUserById(db, id);
      if (!current) throw new NotFoundError(ErrorCodes.USER_NOT_FOUND, 'The requested user was not found.');
      if (id === actor.id && input.isActive === false) {
        throw new BusinessRuleError(ErrorCodes.BUSINESS_RULE_VIOLATION, 'You cannot deactivate your own account.');
      }

      const updated = await db.transaction(async (tx) => {
        const row = await updateUser(tx, id, input);
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
      return toPublic(updated);
    },
  };
}

export function toPublic(user: { id: string; email: string; name: string; role: string; isActive: boolean; createdAt: Date }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive, createdAt: user.createdAt.toISOString() };
}
