import { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { useResourceList, useResourceMutation } from '../_shared/hooks';
import { enumOptions } from '../../components/form/fields';
import { formatDateTime } from '../../lib/format';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { FollowUp } from '../_shared/types';

const statusOptions = enumOptions(['open', 'completed', 'cancelled']);

function linkedTo(f: FollowUp): string {
  if (f.leadId) return `Lead · ${f.leadId.slice(0, 8)}`;
  if (f.opportunityId) return `Opportunity · ${f.opportunityId.slice(0, 8)}`;
  if (f.customerId) return `Customer · ${f.customerId.slice(0, 8)}`;
  return '—';
}

export default function FollowUps() {
  const [status, setStatus] = useState('');

  const params: Record<string, unknown> = { pageSize: 25 };
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
    { key: 'linked', header: 'Linked to', render: (f) => <span className="text-[#6b7280]">{linkedTo(f)}</span> },
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
          <FilterSelect value={status} onChange={setStatus} options={statusOptions} placeholder="All statuses" />
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
    </AppShell>
  );
}
