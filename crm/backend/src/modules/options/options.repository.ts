import { and, asc, eq } from 'drizzle-orm';
import { optionItems } from '../../db/schema/options.js';
import type { Database } from '../../db/client.js';

export interface OptionRow {
  category: string;
  value: string;
  label: string;
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
