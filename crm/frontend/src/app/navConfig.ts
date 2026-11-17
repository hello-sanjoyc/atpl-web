import type { Permission, Role } from '@aranax/contracts';
import { can } from '../lib/permissions';

export interface NavItem {
  label: string;
  to: string;
  /** Permission required to see this link (and the route). Undefined = any signed-in user. */
  permission?: Permission;
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
  { label: 'Users', to: '/users', permission: 'users.manage' },
];

export function visibleItems(items: NavItem[], role: Role | undefined): NavItem[] {
  if (!role) return items.filter((i) => !i.permission);
  return items.filter((i) => !i.permission || can(role, i.permission));
}
