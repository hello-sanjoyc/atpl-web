import { z } from 'zod';
import { paginationQuery } from '../common/schemas.js';
import { SECURITY_EVENTS } from '../../logger/audit-logger.js';

export const listSecurityEventsQuery = paginationQuery.extend({
  event: z.enum(SECURITY_EVENTS).optional(),
  userId: z.uuid().optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});
