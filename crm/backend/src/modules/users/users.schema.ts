import { z } from 'zod';
import { ROLES } from '../../config/constants.js';
import { emailField, paginationQuery, shortText } from '../common/schemas.js';

export const createUserBody = z.object({
  email: emailField,
  name: shortText(120),
  password: z.string().min(12, 'Password must be at least 12 characters.').max(128),
  role: z.enum(ROLES),
});

export const updateUserBody = z
  .object({
    name: shortText(120).optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided.' });

export const listUsersQuery = paginationQuery;

export type CreateUserInput = z.infer<typeof createUserBody>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
