import { sql, type SQL } from 'drizzle-orm';
import { char, numeric, timestamp } from 'drizzle-orm/pg-core';

export const tstz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const timestamps = {
  createdAt: tstz('created_at').notNull().defaultNow(),
  updatedAt: tstz('updated_at').notNull().defaultNow(),
};

/** Money column: NUMERIC(14,2). Values are read back as strings and handled with decimal arithmetic. */
export const money = (name: string) => numeric(name, { precision: 14, scale: 2 });

export const currencyCode = (name = 'currency') => char(name, { length: 3 });

/**
 * `col in ('a', 'b')` for CHECK constraints. DDL cannot use bind parameters, so the values are
 * inlined as literals. They come only from constants in code, never from user input.
 */
export function inList(column: unknown, values: readonly string[]): SQL {
  for (const v of values) {
    if (!/^[a-z0-9_]+$/.test(v)) throw new Error(`Unsafe CHECK literal: ${v}`);
  }
  const literals = values.map((v) => `'${v}'`).join(', ');
  return sql`${column} in (${sql.raw(literals)})`;
}
