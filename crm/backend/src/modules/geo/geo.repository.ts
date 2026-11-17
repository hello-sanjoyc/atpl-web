import { asc } from 'drizzle-orm';
import { countries } from '../../db/schema/geo.js';
import type { Container } from '../../container.js';

export async function listCountries(db: Container['db']) {
  return db
    .select({
      id: countries.id,
      iso: countries.iso,
      iso3: countries.iso3,
      name: countries.name,
      phoneCode: countries.phoneCode,
      currency: countries.currency,
      currencyCode: countries.currencyCode,
      flag: countries.flag,
    })
    .from(countries)
    .orderBy(asc(countries.name));
}
