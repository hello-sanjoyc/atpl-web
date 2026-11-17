import { and, asc, count, eq, sql } from 'drizzle-orm';
import { withDbTiming, type Database, type DbExecutor } from '../../db/client.js';
import { users } from '../../db/schema/index.js';
import type { Role } from '../../config/constants.js';

export type UserRow = typeof users.$inferSelect;

export interface ActiveUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function findActiveUserById(db: DbExecutor, id: string): Promise<ActiveUser | undefined> {
  const [row] = await withDbTiming('users.find_active', () =>
    db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role })
      .from(users)
      .where(and(eq(users.id, id), eq(users.isActive, true)))
      .limit(1),
  );
  return row ? { ...row, role: row.role as Role } : undefined;
}

export async function findUserById(db: DbExecutor, id: string): Promise<UserRow | undefined> {
  const [row] = await withDbTiming('users.find', () => db.select().from(users).where(eq(users.id, id)).limit(1));
  return row;
}

export async function findUserByEmail(db: DbExecutor, email: string): Promise<UserRow | undefined> {
  const [row] = await withDbTiming('users.find_by_email', () =>
    db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1),
  );
  return row;
}

export async function insertUser(
  db: DbExecutor,
  values: { email: string; name: string; role: Role; passwordHash: string },
): Promise<UserRow> {
  const [row] = await withDbTiming('users.insert', () =>
    db.insert(users).values({ ...values, email: values.email.toLowerCase() }).returning(),
  );
  if (!row) throw new Error('User insert returned no row');
  return row;
}

export async function updateUser(
  db: DbExecutor,
  id: string,
  patch: Partial<Pick<UserRow, 'name' | 'role' | 'isActive'>>,
): Promise<UserRow | undefined> {
  const [row] = await withDbTiming('users.update', () =>
    db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(),
  );
  return row;
}

export async function recordFailedLogin(
  db: DbExecutor,
  id: string,
  failures: number,
  lockedUntil: Date | null,
): Promise<void> {
  await withDbTiming('users.failed_login', () =>
    db
      .update(users)
      .set({ failedLoginCount: failures, lockedUntil })
      .where(eq(users.id, id)),
  );
}

export async function resetLoginState(db: DbExecutor, id: string): Promise<void> {
  await withDbTiming('users.reset_login', () =>
    db.update(users).set({ failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, id)),
  );
}

export async function listUsers(
  db: Database,
  options: { limit: number; offset: number },
): Promise<{ rows: UserRow[]; total: number }> {
  return withDbTiming('users.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(users).orderBy(asc(users.name)).limit(options.limit).offset(options.offset),
      db.select({ value: count() }).from(users),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}
