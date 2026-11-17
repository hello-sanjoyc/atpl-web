import { boolean, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './common.js';

/**
 * App-managed dropdown options for the "presentation" fields (service interest, budget range,
 * timeline, capture channel, lead source, opportunity type, contract kind). Each row is one
 * choice in one category. Edit these rows to add/rename/reorder/retire options without any code
 * change — the public GET /options endpoint and backend validation both read from here.
 *
 * `category` groups options (e.g. 'service_interest'); `value` is the stored slug written to the
 * domain tables; `label` is what the dropdown shows. Logic-bound enums (stages, priority, roles,
 * statuses) are intentionally NOT stored here — they remain code constants with CHECK constraints.
 */
export const optionItems = pgTable(
  'option_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: text('category').notNull(),
    value: text('value').notNull(),
    label: text('label').notNull(),
    position: integer('position').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex('option_items_category_value_uq').on(t.category, t.value)],
);
