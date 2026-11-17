import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Reference list of countries (ISO 3166-1). Loaded from a supplied data file, not managed by
 * the app — served read-only via GET /countries to populate country dropdowns. `iso` is the
 * alpha-2 code stored on leads/opportunities/customers.
 */
export const countries = pgTable('countries', {
  id: uuid('id').primaryKey().defaultRandom(),
  iso: varchar('iso', { length: 255 }).notNull(),
  iso3: varchar('iso3', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  phoneCode: varchar('phone_code', { length: 255 }).notNull(),
  currency: varchar('currency', { length: 50 }),
  currencyCode: varchar('currency_code', { length: 10 }),
  flag: varchar('flag', { length: 20 }),
});
