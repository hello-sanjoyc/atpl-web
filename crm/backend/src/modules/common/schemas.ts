import { z } from 'zod';
import { MONEY_PATTERN } from '../../utils/money.js';

export const idParam = z.object({ id: z.uuid() });

export const emailField = z
  .string()
  .trim()
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Enter a valid email address.');

export const phoneField = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number.');

export const shortText = (max: number) => z.string().trim().min(1).max(max);
export const optionalText = (max: number) => z.string().trim().max(max);
export const moneyField = z.string().regex(MONEY_PATTERN, 'Amount must be a decimal string with at most 2 places.');
export const currencyField = z.string().regex(/^[A-Z]{3}$/, 'Currency must be an ISO 4217 code.');
export const isoDateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.');
export const countryField = z.string().regex(/^[A-Z]{2}$/, 'Country must be an ISO 3166-1 alpha-2 code.');

/**
 * A value for a DB-managed dropdown (service interest, budget range, …). Shape only: it must be a
 * lowercase slug. Whether the slug is an active option is checked against the DB in the service
 * layer (deps.options.isValid), so new options added to the data validate without a code change.
 */
export const optionValue = z.string().regex(/^[a-z0-9_]{1,60}$/, 'Must be a valid option value.');

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const utmFields = {
  utmSource: optionalText(200).optional(),
  utmMedium: optionalText(200).optional(),
  utmCampaign: optionalText(200).optional(),
  utmTerm: optionalText(200).optional(),
  utmContent: optionalText(200).optional(),
};
