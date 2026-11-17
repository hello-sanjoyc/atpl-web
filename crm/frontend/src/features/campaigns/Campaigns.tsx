import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { useResourceList } from '../_shared/hooks';
import { enumOptions } from '../../components/form/fields';
import { formatDate } from '../../lib/format';
import { endpoints } from '../../api/endpoints';
import type { Campaign } from '../_shared/types';

const statusOptions = enumOptions(['active', 'paused', 'ended']);

export default function Campaigns() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');

  const params: Record<string, unknown> = { pageSize: 25 };
  if (status) params.status = status;

  const { data, isLoading, error } = useResourceList<Campaign>(['campaigns'], endpoints.campaigns.list, params);

  const columns: Column<Campaign>[] = [
    { key: 'name', header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'channel', header: 'Channel', render: (c) => c.channel },
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
          <FilterSelect value={status} onChange={setStatus} options={statusOptions} placeholder="All statuses" />
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
    </AppShell>
  );
}
