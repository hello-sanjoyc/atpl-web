import { z } from 'zod';
import { currencyField, emailField, isoDateField, moneyField, paginationQuery, shortText } from '../common/schemas.js';

export const createCampaignBody = z.object({
  name: shortText(120),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/, 'Slug may contain lowercase letters, digits and hyphens.'),
  channel: shortText(60),
  status: z.enum(['active', 'paused', 'ended']).default('active'),
  startsOn: isoDateField.optional(),
  endsOn: isoDateField.optional(),
});

export const updateCampaignBody = z
  .object({
    name: shortText(120).optional(),
    channel: shortText(60).optional(),
    status: z.enum(['active', 'paused', 'ended']).optional(),
    startsOn: isoDateField.nullable().optional(),
    endsOn: isoDateField.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided.' });

export const createAcquisitionCostBody = z
  .object({
    channel: shortText(60),
    amount: moneyField,
    currency: currencyField,
    periodStart: isoDateField,
    periodEnd: isoDateField,
    source: z.enum(['manual', 'ad_platform_export']).default('manual'),
  })
  .refine((v) => v.periodStart <= v.periodEnd, { message: 'periodEnd must be on or after periodStart.', path: ['periodEnd'] });

export const createReferralBody = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9]{4,20}$/, 'Referral codes are 4 to 20 letters or digits.'),
  referrerName: shortText(120),
  referrerEmail: emailField.optional(),
});

export const listQuery = paginationQuery;
