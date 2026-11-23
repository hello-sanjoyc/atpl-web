import { useNavigate } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar } from '../../components/FilterBar';
import { Pager } from '../../components/Pager';
import { SortControl } from '../../components/SortControl';
import { useResourceList } from '../_shared/hooks';
import { usePagedSort } from '../_shared/usePagedSort';
import { formatDate } from '../../lib/format';
import { endpoints } from '../../api/endpoints';
import type { Referral } from '../_shared/types';

const sortOptions = [
  { value: 'createdAt', label: 'Created' },
  { value: 'referrerName', label: 'Referrer' },
];

export default function Referrals() {
  const navigate = useNavigate();
  const { page, pageSize, sort, order, setPage, setPageSize, setSort, setOrder } = usePagedSort('createdAt', 'desc');

  const { data, isLoading, error } = useResourceList<Referral>(['referrals'], endpoints.referrals.list, { page, pageSize, sort, order });

  const columns: Column<Referral>[] = [
    { key: 'code', header: 'Code', render: (r) => <span className="font-mono font-medium">{r.code}</span> },
    { key: 'referrerName', header: 'Referrer', render: (r) => r.referrerName },
    { key: 'referrerEmail', header: 'Email', render: (r) => r.referrerEmail ?? <span className="text-[#cbd2e0]">—</span> },
    { key: 'createdAt', header: 'Created', render: (r) => <span className="text-[#6b7280]">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Referrals"
        subtitle={data ? `${data.pagination.total} total` : undefined}
        action={{ label: 'New referral', to: '/referrals/new' }}
      >
        <FilterBar>
          <SortControl sort={sort} order={order} onSortChange={setSort} onOrderChange={setOrder} options={sortOptions} />
        </FilterBar>
      </PageHeader>
      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/referrals/${r.id}`)}
        isLoading={isLoading}
        error={error}
        emptyMessage="No referrals yet."
      />
      {data && <Pager pagination={data.pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </AppShell>
  );
}
