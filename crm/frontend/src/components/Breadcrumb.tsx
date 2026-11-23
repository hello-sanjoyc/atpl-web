import { Link, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { UserRow } from '../features/_shared/types';

interface Crumb {
  segment: string;
  to: string;
  prevSegment: string;
}

function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/** Resolve dynamic crumb labels from the react-query cache (no extra network requests). */
function useDynamicLabel(segment: string, prevSegment: string): string | null {
  const qc = useQueryClient();
  // /users/:id  — look up cached user name
  if (prevSegment === 'users' && segment !== 'new' && segment !== 'edit') {
    const cached = qc.getQueryData<UserRow>(['users', segment]);
    return cached?.name ?? null;
  }
  return null;
}

/** Capitalise and humanise a URL segment into a readable label. */
function humanise(segment: string): string {
  if (segment === 'new') return 'New';
  if (segment === 'edit') return 'Edit';
  if (segment === 'llm') return 'LLM Configuration';
  if (segment === 'roles') return 'Roles & Permissions';
  if (segment === 'rbac') return 'RBAC Settings';
  if (segment === 'user-roles') return 'User Roles';
  if (segment === 'settings') return 'Settings';
  if (segment === 'users') return 'Users';
  if (segment === 'follow-ups') return 'Follow-ups';
  if (segment === 'super_admin') return 'Super Admin';
  if (segment === 'sales_manager') return 'Sales Manager';
  if (segment === 'sales_executive') return 'Sales Executive';
  if (segment === 'marketing_manager') return 'Marketing Manager';
  if (segment === 'finance') return 'Finance';
  if (segment === 'read_only_analyst') return 'Read Only Analyst';
  // UUIDs or opaque IDs — shorten to first 8 chars
  if (/^[0-9a-f-]{30,}$/i.test(segment)) return segment.slice(0, 8) + '…';
  return segment
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Only show breadcrumbs on /settings/**, /users/**, and top-level /<entity>/new create pages
 *  (detail pages like /leads/:id build their own inline breadcrumb instead). */
function shouldShow(pathname: string): boolean {
  if (pathname.startsWith('/settings/') || pathname.startsWith('/users')) return true;
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);
  return segments.length === 2 && segments[1] === 'new';
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);
  const crumbs: Crumb[] = [];

  // For /users/... prepend a synthetic Settings root so the trail always starts there
  if (segments[0] === 'users') {
    crumbs.push({ segment: 'settings', to: '/settings', prevSegment: '' });
  }

  let path = '';
  for (let i = 0; i < segments.length; i++) {
    path += '/' + segments[i];
    crumbs.push({ segment: segments[i], to: path, prevSegment: segments[i - 1] ?? '' });
  }
  return crumbs;
}

function CrumbItem({ segment, to, prevSegment, isLast }: { segment: string; to: string; prevSegment: string; isLast: boolean }) {
  const dynamic = useDynamicLabel(segment, prevSegment);
  const label = dynamic ?? humanise(segment);

  if (isLast) {
    return <span className="text-[13px] font-semibold text-[#0f1117] truncate max-w-[160px]">{label}</span>;
  }

  return (
    <Link to={to} className="text-[13px] text-[#6b7280] hover:text-[#f86223] transition-colors truncate max-w-[160px]">
      {label}
    </Link>
  );
}

export function Breadcrumb() {
  const { pathname } = useLocation();

  if (!shouldShow(pathname)) return null;

  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-4 flex-wrap">
      {crumbs.map((crumb, i) => (
        <span key={crumb.to} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[#c8cfe0] shrink-0"><IconChevron /></span>}
          <CrumbItem
            segment={crumb.segment}
            to={crumb.to}
            prevSegment={crumb.prevSegment}
            isLast={i === crumbs.length - 1}
          />
        </span>
      ))}
    </nav>
  );
}
