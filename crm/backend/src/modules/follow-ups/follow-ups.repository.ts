import { and, asc, count, eq, lte, type SQL } from 'drizzle-orm';
import { withDbTiming, type DbExecutor } from '../../db/client.js';
import { followUpTasks } from '../../db/schema/index.js';

export type FollowUpRow = typeof followUpTasks.$inferSelect;

export async function insertFollowUp(db: DbExecutor, values: typeof followUpTasks.$inferInsert): Promise<FollowUpRow> {
  const [row] = await withDbTiming('follow_ups.insert', () => db.insert(followUpTasks).values(values).returning());
  if (!row) throw new Error('Follow-up insert returned no row');
  return row;
}

export async function findFollowUpById(db: DbExecutor, id: string): Promise<FollowUpRow | undefined> {
  const [row] = await withDbTiming('follow_ups.find', () => db.select().from(followUpTasks).where(eq(followUpTasks.id, id)).limit(1));
  return row;
}

export async function updateFollowUp(db: DbExecutor, id: string, patch: Partial<typeof followUpTasks.$inferInsert>): Promise<FollowUpRow | undefined> {
  const [row] = await withDbTiming('follow_ups.update', () =>
    db.update(followUpTasks).set({ ...patch, updatedAt: new Date() }).where(eq(followUpTasks.id, id)).returning(),
  );
  return row;
}

export async function listFollowUps(
  db: DbExecutor,
  filter: { ownerId?: string; status?: string; dueBefore?: Date },
  options: { limit: number; offset: number },
): Promise<{ rows: FollowUpRow[]; total: number }> {
  const conditions: SQL[] = [];
  if (filter.ownerId) conditions.push(eq(followUpTasks.ownerId, filter.ownerId));
  if (filter.status) conditions.push(eq(followUpTasks.status, filter.status));
  if (filter.dueBefore) conditions.push(lte(followUpTasks.dueAt, filter.dueBefore));
  const where = conditions.length ? and(...conditions) : undefined;
  return withDbTiming('follow_ups.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(followUpTasks).where(where).orderBy(asc(followUpTasks.dueAt)).limit(options.limit).offset(options.offset),
      db.select({ value: count() }).from(followUpTasks).where(where),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}
