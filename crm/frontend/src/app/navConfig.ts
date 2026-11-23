import type { Permission, Role } from '@aranax/contracts';
import { can } from '../lib/permissions';

export interface NavItem {
  label: string;
  to: string;
  /** Permission required to see this link. Undefined = any signed-in user. */
  permission?: Permission;
  /** Role(s) allowed. Takes precedence over permission when set. */
  roles?: Role[];
}

/** Links shown directly in the pill. */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Leads', to: '/leads', permission: 'leads.read' },
  { label: 'Opportunities', to: '/opportunities', permission: 'opportunities.read' },
  { label: 'Follow-ups', to: '/follow-ups', permission: 'follow_ups.manage' },
  { label: 'Customers', to: '/customers', permission: 'customers.read' },
  { label: 'Revenue', to: '/revenue', permission: 'revenue.read' },
];

/** Back-office links tucked under the "More" dropdown. */
export const MORE_NAV: NavItem[] = [
  { label: 'Campaigns', to: '/campaigns', permission: 'campaigns.manage' },
  { label: 'Referrals', to: '/referrals', permission: 'referrals.manage' },
  { label: 'Attribution', to: '/analytics/attribution', permission: 'analytics.read' },
];

/** Settings hub link — only the gear icon / mobile drawer entry for super_admin. */
export const SETTINGS_NAV: NavItem[] = [
  { label: 'Settings', to: '/settings', roles: ['super_admin'] },
];

export function visibleItems(items: NavItem[], role: Role | undefined): NavItem[] {
  if (!role) return items.filter((i) => !i.permission && !i.roles);
  return items.filter((i) => {
    if (i.roles) return i.roles.includes(role);
    if (i.permission) return can(role, i.permission);
    return true;
  });
}
