import { z } from 'zod';
import {
  LEAD_PRIORITIES,
  LEAD_QUALIFICATION,
  LEAD_STAGES,
} from '../../config/constants.js';
import {
  countryField,
  emailField,
  idParam,
  optionValue,
  optionalText,
  paginationQuery,
  phoneField,
  shortText,
  utmFields,
} from '../common/schemas.js';

const formSourceField = z.string().regex(/^[a-z0-9_-]{2,60}$/, 'formSource must be a lowercase slug.');

export const publicLeadBody = z.object({
  name: shortText(120),
  email: emailField,
  phone: phoneField.optional(),
  company: optionalText(160).optional(),
  country: countryField.optional(),
  serviceInterest: optionValue.optional(),
  budgetRange: optionValue.optional(),
  timeline: optionValue.optional(),
  message: optionalText(3000).optional(),
  formSource: formSourceField.default('website_contact'),
  referralCode: z.string().trim().max(40).optional(),
  consent: z.object({
    privacyPolicy: z.literal(true, { message: 'The privacy policy must be accepted.' }),
    privacyPolicyVersion: z.string().trim().min(1).max(40),
    marketing: z.boolean().default(false),
  }),
  /** Honeypot: real users leave this empty. Non-empty submissions are silently suppressed. */
  website: z.string().max(200).optional(),
  ...utmFields,
});

export const discoveryRequestBody = publicLeadBody.extend({
  formSource: formSourceField.default('discovery_form'),
  preferredWindow: optionalText(200).optional(),
});

export const publicLeadHeaders = z.object({
  'idempotency-key': z.string().trim().min(8).max(128).optional(),
});

export const listLeadsQuery = paginationQuery.extend({
  q: z.string().trim().max(100).optional(),
  stage: z.enum(LEAD_STAGES.map((s) => s.key)).optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
  qualificationStatus: z.enum(LEAD_QUALIFICATION).optional(),
  ownerId: z.uuid().optional(),
  source: z.string().trim().max(60).optional(),
  serviceInterest: optionValue.optional(),
  country: countryField.optional(),
  campaignId: z.uuid().optional(),
  createdFrom: z.iso.date().optional(),
  createdTo: z.iso.date().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'score', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createLeadBody = z.object({
  name: shortText(120),
  email: emailField,
  phone: phoneField.optional(),
  company: optionalText(160).optional(),
  country: countryField.optional(),
  serviceInterest: optionValue.optional(),
  budgetRange: optionValue.optional(),
  timeline: optionValue.optional(),
  message: optionalText(3000).optional(),
  captureChannel: optionValue.optional(),
  leadSource: optionValue.optional(),
  priority: z.enum(LEAD_PRIORITIES).default('medium'),
  ownerId: z.uuid().optional(),
  campaignId: z.uuid().optional(),
  referralId: z.uuid().optional(),
  marketingConsent: z.boolean().default(false),
});

export const updateLeadBody = z
  .object({
    name: shortText(120).optional(),
    phone: phoneField.nullable().optional(),
    company: optionalText(160).nullable().optional(),
    country: countryField.nullable().optional(),
    serviceInterest: optionValue.nullable().optional(),
    budgetRange: optionValue.nullable().optional(),
    timeline: optionValue.nullable().optional(),
    message: optionalText(3000).nullable().optional(),
    captureChannel: optionValue.nullable().optional(),
    leadSource: optionValue.nullable().optional(),
    priority: z.enum(LEAD_PRIORITIES).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided.' });

export const changeStageBody = z.object({
  stage: z.enum(LEAD_STAGES.map((s) => s.key)),
  reason: optionalText(500).optional(),
});

export const assignLeadBody = z.object({
  ownerId: z.uuid().nullable(),
  reason: optionalText(500).optional(),
});

export const qualifyLeadBody = z.object({
  budgetRange: optionValue.optional(),
  timeline: optionValue.optional(),
  decisionMaker: z.boolean(),
  notes: optionalText(1000).optional(),
});

export const createActivityBody = z.object({
  type: z.enum(['note', 'call', 'email', 'meeting']),
  body: shortText(5000),
});

export const leadIdParam = idParam;
