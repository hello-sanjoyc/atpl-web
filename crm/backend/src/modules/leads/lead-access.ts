import { roleHasPermission } from '../../plugins/authorization.plugin.js';
import { NotFoundError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { AuthUser } from '../../types/fastify.js';

/** Users holding `pipeline.view_all` see every record; others see only records they own. */
export function canViewAllPipeline(user: AuthUser): boolean {
  return roleHasPermission(user.role, 'pipeline.view_all');
}

/** Ownership check. Records outside the caller's scope are reported as not found, not forbidden. */
export function assertOwnedOrViewAll(user: AuthUser, ownerId: string | null, code: typeof ErrorCodes.LEAD_NOT_FOUND | typeof ErrorCodes.OPPORTUNITY_NOT_FOUND = ErrorCodes.LEAD_NOT_FOUND): void {
  if (canViewAllPipeline(user)) return;
  if (ownerId !== user.id) throw new NotFoundError(code, 'The requested record was not found.');
}

/** Returns the owner filter to apply to list queries, or undefined when the caller sees everything. */
export function ownerScope(user: AuthUser): string | undefined {
  return canViewAllPipeline(user) ? undefined : user.id;
}

/** Contact details are masked for roles without `leads.pii`. */
export function maskContact<T extends { email: string; phone: string | null }>(row: T, user: AuthUser): T {
  if (roleHasPermission(user.role, 'leads.pii')) return row;
  return { ...row, email: maskedEmail(row.email), phone: row.phone ? '***' : null };
}

export function maskedEmail(email: string): string {
  const at = email.indexOf('@');
  return at > 0 ? `${email[0]}***${email.slice(at)}` : '***';
}
