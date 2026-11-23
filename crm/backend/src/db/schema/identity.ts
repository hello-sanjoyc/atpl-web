import { sql } from 'drizzle-orm';
import { boolean, check, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { ROLES } from '../../config/constants.js';
import { inList, timestamps, tstz } from './common.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull(),
    passwordHash: text('password_hash').notNull(),
    phone: text('phone'),
    isActive: boolean('is_active').notNull().default(true),
    failedLoginCount: integer('failed_login_count').notNull().default(0),
    lockedUntil: tstz('locked_until'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_lower_uq').on(sql`lower(${t.email})`),
    check('users_role_chk', inList(t.role, ROLES)),
  ],
);
