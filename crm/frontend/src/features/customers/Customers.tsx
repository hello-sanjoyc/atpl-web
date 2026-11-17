import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSearch, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { useResourceList } from '../_shared/hooks';
import { formatDate } from '../../lib/format';
import { endpoints } from '../../api/endpoints';
import type { Customer } from '../_shared/types';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'churned', label: 'Churned' },
];

export default function Customers() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const params: Record<string, unknown> = { pageSize: 25 };
  if (q) params.q = q;
  if (status) params.status = status;

  const { data, isLoading, error } = useResourceList<Customer>(['customers'], endpoints.customers.list, params);

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-[#e4e9f4] text-[11px] font-bold text-[#6b7280] flex items-center justify-center shrink-0">
            {(c.name || c.email || '?').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-medium truncate">{c.name}</div>
            <div className="text-xs text-[#9ca3af] truncate">{c.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (c) => <Badge value={c.status} /> },
    { key: 'country', header: 'Country', render: (c) => c.country ?? <span className="text-[#cbd2e0]">—</span> },
    { key: 'createdAt', header: 'Created', render: (c) => <span className="text-[#6b7280]">{formatDate(c.createdAt)}</span> },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.pagination.total} total` : undefined}
        action={{ label: 'New customer', to: '/customers/new' }}
      >
        <FilterBar>
          <FilterSearch value={q} onChange={setQ} placeholder="Search name or email…" />
          <FilterSelect value={status} onChange={setStatus} options={statusOptions} placeholder="All statuses" />
        </FilterBar>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(c) => c.id}
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        isLoading={isLoading}
        error={error}
        emptyMessage="No customers match these filters."
      />
    </AppShell>
  );
}
