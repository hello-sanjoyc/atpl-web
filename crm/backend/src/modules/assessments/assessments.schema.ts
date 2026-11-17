import { z } from 'zod';
import { countryField, emailField, idParam, optionalText, phoneField, shortText, utmFields } from '../common/schemas.js';

export const assessmentSlugParam = z.object({ slug: z.string().regex(/^[a-z0-9-]{3,80}$/) });

const answersField = z.record(z.string().min(1).max(64), z.string().min(1).max(64));

export const evaluateAssessmentBody = z.object({ answers: answersField });

export const submitAssessmentBody = z.object({
  name: shortText(120),
  email: emailField,
  phone: phoneField.optional(),
  company: optionalText(160).optional(),
  country: countryField.optional(),
  answers: answersField,
  consent: z.object({
    privacyPolicy: z.literal(true, { message: 'The privacy policy must be accepted.' }),
    privacyPolicyVersion: z.string().trim().min(1).max(40),
    marketing: z.boolean().default(false),
  }),
  referralCode: z.string().trim().max(40).optional(),
  website: z.string().max(200).optional(),
  ...utmFields,
});

