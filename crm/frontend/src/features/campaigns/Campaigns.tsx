import { useNavigate } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { Pager } from '../../components/Pager';
import { SortControl } from '../../components/SortControl';
import { useResourceList } from '../_shared/hooks';
import { usePagedSort } from '../_shared/usePagedSort';
import { useUrlFilter } from '../_shared/useUrlFilter';
import { useOptions } from '../_shared/useOptions';
import { enumOptions } from '../../components/form/fields';
import { formatDate } from '../../lib/format';
import { endpoints } from '../../api/endpoints';
import type { Campaign } from '../_shared/types';

const statusOptions = enumOptions(['active', 'paused', 'ended']);
const sortOptions = [
  { value: 'createdAt', label: 'Created' },
  { value: 'name', label: 'Name' },
];

export default function Campaigns() {
  const navigate = useNavigate();
  const { labelFor } = useOptions();
  const [status, setStatus] = useUrlFilter('status');
  const { page, pageSize, sort, order, setPage, setPageSize, setSort, setOrder, reset } = usePagedSort('createdAt', 'desc');

  const params: Record<string, unknown> = { page, pageSize, sort, order };
  if (status) params.status = status;

  const { data, isLoading, error } = useResourceList<Campaign>(['campaigns'], endpoints.campaigns.list, params);

  const columns: Column<Campaign>[] = [
    { key: 'name', header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'channel', header: 'Channel', render: (c) => labelFor('campaign_channel', c.channel) ?? c.channel },
    { key: 'status', header: 'Status', render: (c) => <Badge value={c.status} /> },
    { key: 'slug', header: 'Slug', render: (c) => <span className="text-[#6b7280]">{c.slug}</span> },
    { key: 'createdAt', header: 'Created', render: (c) => <span className="text-[#6b7280]">{formatDate(c.createdAt)}</span> },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Campaigns"
        subtitle={data ? `${data.pagination.total} total` : undefined}
        action={{ label: 'New campaign', to: '/campaigns/new' }}
      >
        <FilterBar>
          <FilterSelect value={status} onChange={reset(setStatus)} options={statusOptions} placeholder="All statuses" />
          <SortControl sort={sort} order={order} onSortChange={setSort} onOrderChange={setOrder} options={sortOptions} />
        </FilterBar>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(c) => c.id}
        onRowClick={(c) => navigate(`/campaigns/${c.id}`)}
        isLoading={isLoading}
        error={error}
        emptyMessage="No campaigns match these filters."
      />
      {data && <Pager pagination={data.pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </AppShell>
  );
}
