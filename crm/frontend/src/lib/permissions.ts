import { ROLE_PERMISSIONS } from '@aranax/contracts';
import type { Permission, Role } from '@aranax/contracts';

/** Static fallback — used in nav config and tests where live context isn't available. */
export function can(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission);
}

/** Check a permission against a live Set<Permission> loaded from the DB. */
export function canWith(permissions: Set<Permission> | null, permission: Permission): boolean {
  if (!permissions) return false;
  return permissions.has(permission);
}
