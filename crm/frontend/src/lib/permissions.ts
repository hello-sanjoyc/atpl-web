import { ROLE_PERMISSIONS } from '@aranax/contracts';
import type { Permission, Role } from '@aranax/contracts';

export function can(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission);
}
