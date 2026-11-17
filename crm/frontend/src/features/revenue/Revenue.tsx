import { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { useResourceList } from '../_shared/hooks';
import { formatDate, formatMoney } from '../../lib/format';
import { endpoints } from '../../api/endpoints';
import type { RevenueRecord, ExchangeRate } from '../_shared/types';

const kindOptions = [
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'collected', label: 'Collected' },
];

type Tab = 'records' | 'rates';

export default function Revenue() {
  const [tab, setTab] = useState<Tab>('records');

  return (
    <AppShell>
      <PageHeader
        title="Revenue"
        action={tab === 'records' ? { label: 'New record', to: '/revenue/new' } : undefined}
      >
        <div className="inline-flex items-center gap-1 bg-white rounded-full p-1 shadow-[0_4px_16px_rgba(0,0,0,.06)]">
          <TabButton active={tab === 'records'} onClick={() => setTab('records')}>Records</TabButton>
          <TabButton active={tab === 'rates'} onClick={() => setTab('rates')}>Exchange rates</TabButton>
        </div>
      </PageHeader>

      {tab === 'records' ? <RecordsTab /> : <RatesTab />}
    </AppShell>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors',
        active ? 'bg-[#00308a] text-white' : 'text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function RecordsTab() {
  const [kind, setKind] = useState('');
  const params: Record<string, unknown> = { pageSize: 25 };
  if (kind) params.kind = kind;

  const { data, isLoading, error } = useResourceList<RevenueRecord>(['revenue-records'], endpoints.revenue.records, params);

  const columns: Column<RevenueRecord>[] = [
    { key: 'kind', header: 'Kind', render: (r) => <Badge value={r.kind} /> },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-semibold">{formatMoney(r.amount, r.currency)}</span> },
    { key: 'recognizedOn', header: 'Recognized', render: (r) => <span className="text-[#6b7280]">{formatDate(r.recognizedOn)}</span> },
    { key: 'customerId', header: 'Customer', render: (r) => <span className="text-[#6b7280] truncate block max-w-[160px]">{r.customerId ?? '—'}</span> },
  ];

  return (
    <>
      <FilterBar>
        <FilterSelect value={kind} onChange={setKind} options={kindOptions} placeholder="All kinds" />
      </FilterBar>
      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={data?.items}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          emptyMessage="No revenue records yet."
        />
      </div>
    </>
  );
}

function RatesTab() {
  const { data, isLoading, error } = useResourceList<ExchangeRate>(['exchange-rates'], endpoints.revenue.exchangeRates, { pageSize: 25 });

  const columns: Column<ExchangeRate>[] = [
    { key: 'base', header: 'Base', render: (r) => <span className="font-semibold">{r.base}</span> },
    { key: 'quote', header: 'Quote', render: (r) => <span className="font-semibold">{r.quote}</span> },
    { key: 'rate', header: 'Rate', render: (r) => r.rate },
    { key: 'rateDate', header: 'Date', render: (r) => <span className="text-[#6b7280]">{formatDate(r.rateDate)}</span> },
    { key: 'source', header: 'Source', render: (r) => <span className="text-[#6b7280]">{r.source}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data?.items}
      rowKey={(r) => r.id}
      isLoading={isLoading}
      error={error}
      emptyMessage="No exchange rates yet."
    />
  );
}
