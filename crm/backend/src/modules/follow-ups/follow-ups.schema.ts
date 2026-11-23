import { z } from 'zod';
import { optionalText, paginationQuery, shortText } from '../common/schemas.js';

export const createFollowUpBody = z
  .object({
    leadId: z.uuid().optional(),
    opportunityId: z.uuid().optional(),
    customerId: z.uuid().optional(),
    ownerId: z.uuid().optional(),
    title: shortText(160),
    notes: optionalText(1000).optional(),
    dueAt: z.iso.datetime({ offset: true }),
  })
  .refine((v) => Boolean(v.leadId || v.opportunityId || v.customerId), {
    message: 'Link the task to a lead, opportunity or customer.',
    path: ['leadId'],
  });

export const listFollowUpsQuery = paginationQuery.extend({
  status: z.enum(['open', 'completed', 'cancelled']).optional(),
  dueBefore: z.iso.datetime({ offset: true }).optional(),
  ownerId: z.uuid().optional(),
  sort: z.enum(['dueAt', 'title']).default('dueAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
});
