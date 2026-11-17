import type { z } from 'zod';
import type {
  assignLeadBody,
  changeStageBody,
  createActivityBody,
  createLeadBody,
  listLeadsQuery,
  publicLeadBody,
  qualifyLeadBody,
  updateLeadBody,
} from './leads.schema.js';

export type PublicLeadBody = z.infer<typeof publicLeadBody>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuery>;
export type CreateLeadBody = z.infer<typeof createLeadBody>;
export type UpdateLeadBody = z.infer<typeof updateLeadBody>;
export type ChangeStageBody = z.infer<typeof changeStageBody>;
export type AssignLeadBody = z.infer<typeof assignLeadBody>;
export type QualifyLeadBody = z.infer<typeof qualifyLeadBody>;
export type CreateActivityBody = z.infer<typeof createActivityBody>;
