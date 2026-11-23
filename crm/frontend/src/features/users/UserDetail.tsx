import { Link, useParams } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { endpoints } from '../../api/endpoints';
import { formatDate } from '../../lib/format';
import { humanize } from '../../components/form/fields';
import { useResourceDetail } from '../_shared/hooks';
import type { UserRow } from '../_shared/types';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-[#f0f2f5] last:border-0">
      <dt className="text-[13px] font-semibold text-[#6b7280] sm:w-40 shrink-0">{label}</dt>
      <dd className="text-[14px] text-[#0f1117]">{children}</dd>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useResourceDetail<UserRow>(
    ['users', id],
    id ? endpoints.users.byId(id) : null,
  );

  return (
    <AppShell>
      <PageHeader
        title={data?.name ?? 'User'}
        action={
          data ? (
            <Link
              to={`/users/${id}/edit`}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#f86223] text-white rounded-full text-[13px] font-bold hover:bg-[#d94f15] transition-all"
            >
              Edit
            </Link>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="bg-white rounded-[28px] p-8 shadow-[0_4px_16px_rgba(0,0,0,.08)] animate-pulse">
          <div className="h-4 bg-[#f0f2f5] rounded w-1/3 mb-3" />
          <div className="h-4 bg-[#f0f2f5] rounded w-1/2 mb-3" />
          <div className="h-4 bg-[#f0f2f5] rounded w-1/4" />
        </div>
      )}

      {error && (
        <div className="bg-[#fff5f5] border border-[#fca5a5] rounded-2xl px-5 py-4 text-sm text-[#c62828]">
          Failed to load user.
        </div>
      )}

      {data && (
        <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
          <dl>
            <DetailRow label="Name">{data.name}</DetailRow>
            <DetailRow label="Email">
              <a href={`mailto:${data.email}`} className="text-[#00308a] hover:underline">{data.email}</a>
            </DetailRow>
            {data.phone && (
              <DetailRow label="Phone">
                <a href={`tel:${data.phone}`} className="text-[#00308a] hover:underline">{data.phone}</a>
              </DetailRow>
            )}
            <DetailRow label="Role">
              <Badge value={data.role} tone="purple" label={humanize(data.role)} />
            </DetailRow>
            <DetailRow label="Status">
              <Badge value={data.isActive ? 'active' : 'inactive'} tone={data.isActive ? 'green' : 'neutral'} label={data.isActive ? 'Active' : 'Inactive'} />
            </DetailRow>
            <DetailRow label="Created">{formatDate(data.createdAt)}</DetailRow>
            <DetailRow label="User ID">
              <span className="font-mono text-[12px] text-[#9ca3af]">{data.id}</span>
            </DetailRow>
          </dl>
        </div>
      )}
    </AppShell>
  );
}
