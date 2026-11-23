import { z } from 'zod';
import { ROLES } from '../../config/constants.js';
import { emailField, paginationQuery, shortText } from '../common/schemas.js';

export const createUserBody = z.object({
  email: emailField,
  name: shortText(120),
  phone: z.string().max(30).nullable().optional(),
  password: z.string().min(12, 'Password must be at least 12 characters.').max(128),
  role: z.enum(ROLES),
});

export const updateUserBody = z
  .object({
    name: shortText(120).optional(),
    email: emailField.optional(),
    phone: z.string().max(30).nullable().optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided.' });

export const listUsersQuery = paginationQuery.extend({
  role: z.enum(ROLES).optional(),
  sort: z.enum(['name', 'createdAt']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateUserInput = z.infer<typeof createUserBody>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
