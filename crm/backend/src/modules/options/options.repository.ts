import { and, asc, eq } from 'drizzle-orm';
import { optionItems } from '../../db/schema/options.js';
import type { Database } from '../../db/client.js';

export interface OptionRow {
  category: string;
  value: string;
  label: string;
}

export type OptionItemRecord = typeof optionItems.$inferSelect;

export interface CreateOptionInput {
  category: string;
  value: string;
  label: string;
  position?: number;
  isActive?: boolean;
}

export interface UpdateOptionInput {
  value?: string;
  label?: string;
  position?: number;
  isActive?: boolean;
}

/** All active options, ordered by category then position — the source for grouping. */
export async function listActiveOptions(db: Database): Promise<OptionRow[]> {
  return db
    .select({ category: optionItems.category, value: optionItems.value, label: optionItems.label })
    .from(optionItems)
    .where(eq(optionItems.isActive, true))
    .orderBy(asc(optionItems.category), asc(optionItems.position), asc(optionItems.label));
}

/** Active options for one category (used by validation). */
export async function listActiveOptionsByCategory(db: Database, category: string): Promise<OptionRow[]> {
  return db
    .select({ category: optionItems.category, value: optionItems.value, label: optionItems.label })
    .from(optionItems)
    .where(and(eq(optionItems.category, category), eq(optionItems.isActive, true)))
    .orderBy(asc(optionItems.position), asc(optionItems.label));
}

/** Every option row, active or not — the source for the admin management view. */
export async function listAllOptions(db: Database): Promise<OptionItemRecord[]> {
  return db
    .select()
    .from(optionItems)
    .orderBy(asc(optionItems.category), asc(optionItems.position), asc(optionItems.label));
}

export async function insertOption(db: Database, input: CreateOptionInput): Promise<OptionItemRecord> {
  const [row] = await db
    .insert(optionItems)
    .values({
      category: input.category,
      value: input.value,
      label: input.label,
      position: input.position ?? 0,
      isActive: input.isActive ?? true,
    })
    .returning();
  return row!;
}

export async function updateOption(db: Database, id: string, patch: UpdateOptionInput): Promise<OptionItemRecord | null> {
  const [row] = await db.update(optionItems).set(patch).where(eq(optionItems.id, id)).returning();
  return row ?? null;
}

export async function deleteOption(db: Database, id: string): Promise<void> {
  await db.delete(optionItems).where(eq(optionItems.id, id));
}
