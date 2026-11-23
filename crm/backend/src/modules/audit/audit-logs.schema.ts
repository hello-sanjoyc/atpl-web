import { z } from 'zod';
import { paginationQuery } from '../common/schemas.js';

export const listAuditLogsQuery = paginationQuery.extend({
  entityType: z.string().min(1).optional(),
  actorId: z.uuid().optional(),
  action: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});
