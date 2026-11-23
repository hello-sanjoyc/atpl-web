import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSearch, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { Pager } from '../../components/Pager';
import { SortControl } from '../../components/SortControl';
import { useResourceList } from '../_shared/hooks';
import { usePagedSort } from '../_shared/usePagedSort';
import { useUrlFilter } from '../_shared/useUrlFilter';
import { useCountries } from '../_shared/useCountries';
import { toTitle } from '../../components/form/CountrySelect';
import { formatDate } from '../../lib/format';
import { endpoints } from '../../api/endpoints';
import type { Customer } from '../_shared/types';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'churned', label: 'Churned' },
];
const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created' },
];

export default function Customers() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useUrlFilter('status');
  const { page, pageSize, sort, order, setPage, setPageSize, setSort, setOrder, reset } = usePagedSort('name', 'asc');

  const params: Record<string, unknown> = { page, pageSize, sort, order };
  if (q) params.q = q;
  if (status) params.status = status;

  const { data, isLoading, error } = useResourceList<Customer>(['customers'], endpoints.customers.list, params);

  const { data: countries } = useCountries();
  const countryNameByIso = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of countries ?? []) map.set(c.iso, toTitle(c.name));
    return map;
  }, [countries]);

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fde8dd] to-[#e4e9f4] text-[11px] font-bold text-[#6b7280] flex items-center justify-center shrink-0">
            {(c.name || c.email || '?').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-medium truncate">{c.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      render: (c) => c.company ?? <span className="text-[#cbd2e0]">—</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (c) => (
        <div className="min-w-0">
          <div className="truncate">{c.email}</div>
          {c.phone && <div className="text-xs text-[#9ca3af] truncate">{c.phone}</div>}
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      render: (c) => (c.country ? (countryNameByIso.get(c.country) ?? c.country) : <span className="text-[#cbd2e0]">—</span>),
    },
    { key: 'status', header: 'Status', render: (c) => <Badge value={c.status} /> },
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
          <FilterSearch value={q} onChange={reset(setQ)} placeholder="Search name or email…" />
          <FilterSelect value={status} onChange={reset(setStatus)} options={statusOptions} placeholder="All statuses" />
          <SortControl sort={sort} order={order} onSortChange={setSort} onOrderChange={setOrder} options={sortOptions} />
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
      {data && <Pager pagination={data.pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </AppShell>
  );
}
