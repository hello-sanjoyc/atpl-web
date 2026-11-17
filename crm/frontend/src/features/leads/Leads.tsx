import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSearch, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { useResourceList } from '../_shared/hooks';
import { enumOptions } from '../../components/form/fields';
import { formatDate } from '../../lib/format';
import { endpoints } from '../../api/endpoints';
import type { Lead } from '../_shared/types';
import { LEAD_STAGES, LEAD_PRIORITIES } from '@aranax/contracts';

const stageOptions = enumOptions(LEAD_STAGES.map((s) => s.key));
const priorityOptions = enumOptions(LEAD_PRIORITIES);

export default function Leads() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('');
  const [priority, setPriority] = useState('');

  const params: Record<string, unknown> = { pageSize: 25 };
  if (q) params.q = q;
  if (stage) params.stage = stage;
  if (priority) params.priority = priority;

  const { data, isLoading, error } = useResourceList<Lead>(['leads'], endpoints.leads.list, params);

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (l) => (
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-[#e4e9f4] text-[11px] font-bold text-[#6b7280] flex items-center justify-center shrink-0">
            {(l.name || l.email || '?').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-medium truncate">{l.name}</div>
            <div className="text-xs text-[#9ca3af] truncate">{l.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'company', header: 'Company', render: (l) => l.company ?? <span className="text-[#cbd2e0]">—</span> },
    { key: 'stage', header: 'Stage', render: (l) => <Badge value={l.stage} /> },
    { key: 'priority', header: 'Priority', render: (l) => <Badge value={l.priority} /> },
    { key: 'score', header: 'Score', render: (l) => (l.score != null ? l.score : <span className="text-[#cbd2e0]">—</span>) },
    { key: 'createdAt', header: 'Created', render: (l) => <span className="text-[#6b7280]">{formatDate(l.createdAt)}</span> },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Leads"
        subtitle={data ? `${data.pagination.total} total` : undefined}
        action={{ label: 'New lead', to: '/leads/new' }}
      >
        <FilterBar>
          <FilterSearch value={q} onChange={setQ} placeholder="Search name, email, company…" />
          <FilterSelect value={stage} onChange={setStage} options={stageOptions} placeholder="All stages" />
          <FilterSelect value={priority} onChange={setPriority} options={priorityOptions} placeholder="All priorities" />
        </FilterBar>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(l) => l.id}
        onRowClick={(l) => navigate(`/leads/${l.id}`)}
        isLoading={isLoading}
        error={error}
        emptyMessage="No leads match these filters."
      />
    </AppShell>
  );
}
