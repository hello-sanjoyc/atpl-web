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
import { formatDate, formatMoney } from '../../lib/format';
import { endpoints } from '../../api/endpoints';
import type { Opportunity } from '../_shared/types';
import { OPPORTUNITY_STAGES } from '@aranax/contracts';

const statusOptions = enumOptions(['open', 'won', 'lost']);
const stageOptions = enumOptions(OPPORTUNITY_STAGES.map((s) => s.key));
const sortOptions = [
  { value: 'createdAt', label: 'Created' },
  { value: 'estimatedValue', label: 'Value' },
  { value: 'expectedCloseDate', label: 'Expected close' },
];

export default function Opportunities() {
  const navigate = useNavigate();
  const { optionsFor } = useOptions();
  const typeOptions = optionsFor('opportunity_type');
  const [status, setStatus] = useUrlFilter('status');
  const [stage, setStage] = useUrlFilter('stage');
  const [opportunityType, setOpportunityType] = useUrlFilter('opportunityType');
  const { page, pageSize, sort, order, setPage, setPageSize, setSort, setOrder, reset } = usePagedSort('createdAt', 'desc');

  const params: Record<string, unknown> = { page, pageSize, sort, order };
  if (status) params.status = status;
  if (stage) params.stage = stage;
  if (opportunityType) params.opportunityType = opportunityType;

  const { data, isLoading, error } = useResourceList<Opportunity>(
    ['opportunities'],
    endpoints.opportunities.list,
    params,
  );

  const columns: Column<Opportunity>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (o) => <div className="font-medium truncate">{o.title}</div>,
    },
    { key: 'stage', header: 'Stage', render: (o) => <Badge value={o.stage} /> },
    { key: 'status', header: 'Status', render: (o) => <Badge value={o.status} /> },
    {
      key: 'estimatedValue',
      header: 'Value',
      render: (o) => <span className="font-semibold">{formatMoney(o.estimatedValue, o.currency)}</span>,
    },
    {
      key: 'expectedCloseDate',
      header: 'Expected close',
      render: (o) =>
        o.expectedCloseDate ? (
          <span className="text-[#6b7280]">{formatDate(o.expectedCloseDate)}</span>
        ) : (
          <span className="text-[#cbd2e0]">—</span>
        ),
    },
    { key: 'createdAt', header: 'Created', render: (o) => <span className="text-[#6b7280]">{formatDate(o.createdAt)}</span> },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Opportunities"
        subtitle={data ? `${data.pagination.total} total` : undefined}
        action={{ label: 'New opportunity', to: '/opportunities/new' }}
      >
        <FilterBar>
          <FilterSelect value={status} onChange={reset(setStatus)} options={statusOptions} placeholder="All statuses" />
          <FilterSelect value={stage} onChange={reset(setStage)} options={stageOptions} placeholder="All stages" />
          <FilterSelect value={opportunityType} onChange={reset(setOpportunityType)} options={typeOptions} placeholder="All types" />
          <SortControl sort={sort} order={order} onSortChange={setSort} onOrderChange={setOrder} options={sortOptions} />
        </FilterBar>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(o) => o.id}
        onRowClick={(o) => navigate(`/opportunities/${o.id}`)}
        isLoading={isLoading}
        error={error}
        emptyMessage="No opportunities match these filters."
      />
      {data && <Pager pagination={data.pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </AppShell>
  );
}
