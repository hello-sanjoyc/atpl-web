import { Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { Pager } from '../../components/Pager';
import { SortControl } from '../../components/SortControl';
import { useResourceList, useResourceMutation } from '../_shared/hooks';
import { usePagedSort } from '../_shared/usePagedSort';
import { useUrlFilter } from '../_shared/useUrlFilter';
import { enumOptions } from '../../components/form/fields';
import { formatDateTime } from '../../lib/format';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { FollowUp } from '../_shared/types';

const statusOptions = enumOptions(['open', 'completed', 'cancelled']);
const sortOptions = [
  { value: 'dueAt', label: 'Due date' },
  { value: 'title', label: 'Title' },
];

function LinkedTo({ f }: { f: FollowUp }) {
  if (f.leadId) {
    return (
      <span className="text-[#6b7280]">
        Lead · <Link to={`/leads/${f.leadId}`} className="text-[#f86223] hover:underline" onClick={(e) => e.stopPropagation()}>{f.leadName ?? f.leadId.slice(0, 8)}</Link>
      </span>
    );
  }
  if (f.opportunityId) {
    return (
      <span className="text-[#6b7280]">
        Opportunity · <Link to={`/opportunities/${f.opportunityId}`} className="text-[#f86223] hover:underline" onClick={(e) => e.stopPropagation()}>{f.opportunityTitle ?? f.opportunityId.slice(0, 8)}</Link>
      </span>
    );
  }
  if (f.customerId) {
    return (
      <span className="text-[#6b7280]">
        Customer · <Link to={`/customers/${f.customerId}`} className="text-[#f86223] hover:underline" onClick={(e) => e.stopPropagation()}>{f.customerName ?? f.customerId.slice(0, 8)}</Link>
      </span>
    );
  }
  return <span className="text-[#cbd2e0]">—</span>;
}

export default function FollowUps() {
  const [status, setStatus] = useUrlFilter('status');
  const { page, pageSize, sort, order, setPage, setPageSize, setSort, setOrder, reset } = usePagedSort('dueAt', 'asc');

  const params: Record<string, unknown> = { page, pageSize, sort, order };
  if (status) params.status = status;

  const { data, isLoading, error } = useResourceList<FollowUp>(['followups'], endpoints.followUps.list, params);

  const completeMutation = useResourceMutation(
    (fid: string) => http.patch(endpoints.followUps.complete(fid), {}),
    { invalidate: ['followups'], successMessage: 'Follow-up completed' },
  );

  const columns: Column<FollowUp>[] = [
    { key: 'title', header: 'Title', render: (f) => <div className="font-medium truncate">{f.title}</div> },
    { key: 'status', header: 'Status', render: (f) => <Badge value={f.status} /> },
    { key: 'dueAt', header: 'Due', render: (f) => <span className="text-[#6b7280]">{formatDateTime(f.dueAt)}</span> },
    { key: 'linked', header: 'Linked to', render: (f) => <LinkedTo f={f} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (f) =>
        f.status === 'open' ? (
          <button
            onClick={() => completeMutation.mutate(f.id)}
            disabled={completeMutation.isPending}
            className="px-3.5 py-1.5 rounded-full bg-[#fde8dd] text-[#9a3b12] text-[12px] font-bold hover:bg-[#e0f3a8] disabled:opacity-50 transition-colors"
          >
            Complete
          </button>
        ) : null,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Follow-ups"
        subtitle={data ? `${data.pagination.total} total` : undefined}
        action={{ label: 'New follow-up', to: '/follow-ups/new' }}
      >
        <FilterBar>
          <FilterSelect value={status} onChange={reset(setStatus)} options={statusOptions} placeholder="All statuses" />
          <SortControl sort={sort} order={order} onSortChange={setSort} onOrderChange={setOrder} options={sortOptions} />
        </FilterBar>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(f) => f.id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No follow-ups match this filter."
      />
      {data && <Pager pagination={data.pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </AppShell>
  );
}
