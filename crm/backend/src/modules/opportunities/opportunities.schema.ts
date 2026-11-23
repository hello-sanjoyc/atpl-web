import { z } from 'zod';
import { LOST_REASONS, OPPORTUNITY_STAGES } from '../../config/constants.js';
import {
  countryField,
  currencyField,
  isoDateField,
  moneyField,
  optionValue,
  optionalText,
  paginationQuery,
  shortText,
} from '../common/schemas.js';

const opportunityStageKeys = OPPORTUNITY_STAGES.map((s) => s.key) as [string, ...string[]];

export const listOpportunitiesQuery = paginationQuery.extend({
  q: z.string().trim().max(160).optional(),
  stage: z.enum(opportunityStageKeys).optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  ownerId: z.uuid().optional(),
  opportunityType: optionValue.optional(),
  currency: currencyField.optional(),
  closeFrom: isoDateField.optional(),
  closeTo: isoDateField.optional(),
  country: countryField.optional(),
  sort: z.enum(['createdAt', 'estimatedValue', 'expectedCloseDate']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createOpportunityBody = z
  .object({
    leadId: z.uuid().optional(),
    customerId: z.uuid().optional(),
    title: shortText(160),
    serviceInterest: optionValue.optional(),
    opportunityType: optionValue.default('new_business'),
    estimatedValue: moneyField,
    currency: currencyField,
    expectedCloseDate: isoDateField.optional(),
    ownerId: z.uuid().optional(),
    campaignId: z.uuid().optional(),
    referralId: z.uuid().optional(),
    country: countryField.optional(),
  })
  .refine((v) => Boolean(v.leadId || v.customerId), { message: 'Either leadId or customerId is required.', path: ['leadId'] });

export const updateOpportunityBody = z
  .object({
    title: shortText(160).optional(),
    serviceInterest: optionValue.nullable().optional(),
    estimatedValue: moneyField.optional(),
    expectedCloseDate: isoDateField.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided.' });

export const changeOpportunityStageBody = z
  .object({
    stage: z.enum(opportunityStageKeys),
    lostReason: z.enum(LOST_REASONS).optional(),
    wonValue: moneyField.optional(),
    reason: optionalText(500).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.stage === 'won' && !v.wonValue) {
      ctx.addIssue({ code: 'custom', path: ['wonValue'], message: 'wonValue is required when closing a deal as won.' });
    }
    if (v.stage === 'lost' && !v.lostReason) {
      ctx.addIssue({ code: 'custom', path: ['lostReason'], message: 'lostReason is required when closing a deal as lost.' });
    }
  });

export const recordProposalBody = z.object({
  estimatedValue: moneyField.optional(),
  notes: optionalText(1000).optional(),
});

