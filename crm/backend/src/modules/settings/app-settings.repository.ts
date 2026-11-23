import { eq } from 'drizzle-orm';
import { appSettings } from '../../db/schema/index.js';
import type { DbExecutor } from '../../db/client.js';

export async function getAppSetting(db: DbExecutor, key: string): Promise<unknown | null> {
  const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, key));
  return row?.value ?? null;
}

export async function setAppSetting(db: DbExecutor, key: string, value: unknown, updatedBy: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value, updatedBy })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy, updatedAt: new Date() } });
}
