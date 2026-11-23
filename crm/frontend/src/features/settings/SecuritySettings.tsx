import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, SECURITY_EVENTS, type SecurityEventName } from '@aranax/contracts';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSelect, FilterSearch } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { Pager } from '../../components/Pager';
import { enumOptions } from '../../components/form/fields';
import { formatDateTime } from '../../lib/format';
import { useResourceList } from '../_shared/hooks';
import { usePagedSort } from '../_shared/usePagedSort';

interface SecurityEventRow {
  id: string;
  occurredAt: string;
  event: SecurityEventName;
  level: 'warn' | 'error';
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
}

interface SecurityConfig {
  jwtAccessTtl: string;
  rateLimit: { max: number; window: string };
  publicRateLimitMax: number;
  corsOrigins: string[];
  trustProxy: boolean;
  logRedaction: boolean;
  lockoutPolicy: { maxFailures: number; lockMinutes: number };
}

const eventOptions = enumOptions(SECURITY_EVENTS);

function useSecurityConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.securityConfig,
    queryFn: () => http.get<SecurityConfig>(endpoints.settings.securityConfig),
  });
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-[#eef1f7] last:border-b-0">
      <span className="text-sm text-[#6b7280]">{label}</span>
      <span className="text-sm font-semibold text-[#0f1117] font-mono text-right">{value}</span>
    </div>
  );
}

function SecurityConfigCard() {
  const { data, isLoading } = useSecurityConfig();

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
      <h3 className="font-serif font-medium text-[#0f1117] text-[17px] mb-1">Security Configuration</h3>
      <p className="text-xs text-[#9ca3af] mb-3">Read-only — set via environment configuration at deploy time.</p>
      {isLoading || !data ? (
        <div className="py-6 text-center text-sm text-[#9ca3af]">Loading…</div>
      ) : (
        <div>
          <ConfigRow label="Access token lifetime" value={data.jwtAccessTtl} />
          <ConfigRow label="Rate limit" value={`${data.rateLimit.max} requests / ${data.rateLimit.window}`} />
          <ConfigRow label="Public rate limit" value={`${data.publicRateLimitMax} requests / minute`} />
          <ConfigRow label="CORS allowed origins" value={data.corsOrigins.length ? data.corsOrigins.join(', ') : '(none configured)'} />
          <ConfigRow label="Trust proxy (X-Forwarded-For)" value={data.trustProxy ? 'Enabled' : 'Disabled'} />
          <ConfigRow label="Log redaction" value={data.logRedaction ? 'Enabled' : 'Disabled'} />
          <ConfigRow label="Account lockout" value={`${data.lockoutPolicy.maxFailures} failed attempts → ${data.lockoutPolicy.lockMinutes} min lock`} />
        </div>
      )}
    </div>
  );
}

function AccessLogSection() {
  const { page, pageSize, setPage, setPageSize, reset } = usePagedSort('occurredAt');
  const [event, setEvent] = useState('');

  const params: Record<string, unknown> = { page, pageSize };
  if (event) params.event = event;

  const { data, isLoading, error } = useResourceList<SecurityEventRow>(
    QUERY_KEYS.securityEvents,
    endpoints.settings.securityEvents,
    params,
  );

  const columns: Column<SecurityEventRow>[] = [
    {
      key: 'event',
      header: 'Event',
      render: (r) => <Badge value={r.event} tone={r.level === 'error' ? 'red' : 'amber'} />,
    },
    {
      key: 'occurredAt',
      header: 'Time',
      render: (r) => <span className="text-[#6b7280]">{formatDateTime(r.occurredAt)}</span>,
    },
    {
      key: 'userId',
      header: 'User',
      render: (r) =>
        r.userName ? (
          <div className="min-w-0">
            <div className="font-medium truncate">{r.userName}</div>
            {r.userEmail && <div className="text-xs text-[#9ca3af] truncate">{r.userEmail}</div>}
          </div>
        ) : (
          <span className="text-[#cbd2e0]">—</span>
        ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (r) => <span className="font-mono text-xs">{r.ip ?? <span className="text-[#cbd2e0]">—</span>}</span>,
    },
    {
      key: 'userAgent',
      header: 'User agent',
      render: (r) => <span className="text-xs text-[#9ca3af] truncate block max-w-[220px]">{r.userAgent ?? '—'}</span>,
    },
  ];

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="font-serif font-medium text-[#0f1117] text-[17px]">Access Log</h3>
        <FilterBar>
          <FilterSelect
            value={event}
            onChange={reset(setEvent)}
            options={eventOptions}
            placeholder="All events"
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No security events recorded yet."
      />

      {data && <Pager pagination={data.pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </div>
  );
}

interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

interface AuditLogRow {
  id: string;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  metadata: { changes?: FieldChange[] } & Record<string, unknown>;
}

const ACTION_TONE: Record<string, 'green' | 'blue' | 'red'> = {
  created: 'green',
  updated: 'blue',
  deleted: 'red',
};

function actionTone(action: string): 'green' | 'blue' | 'red' | undefined {
  const verb = action.split('.').pop() ?? '';
  if (verb.includes('delet')) return ACTION_TONE.deleted;
  if (verb.includes('creat')) return ACTION_TONE.created;
  if (verb.includes('updat') || verb.includes('chang')) return ACTION_TONE.updated;
  return undefined;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function useAuditEntityTypes() {
  return useQuery({
    queryKey: QUERY_KEYS.auditEntityTypes,
    queryFn: () => http.get<string[]>(endpoints.settings.auditEntityTypes),
  });
}

function AuditDetailModal({ row, onClose }: { row: AuditLogRow; onClose: () => void }) {
  const changes = row.metadata?.changes ?? [];
  const extra = Object.entries(row.metadata ?? {}).filter(([k]) => k !== 'changes');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-[#eef1f7]">
          <div>
            <h3 className="font-serif font-medium text-[#0f1117] text-[17px]">{row.action}</h3>
            <p className="text-sm text-[#6b7280] mt-1">
              {row.actorName ?? 'System'}
              {row.actorEmail ? ` (${row.actorEmail})` : ''} · {formatDateTime(row.occurredAt)}
            </p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#0f1117] text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-6 py-4">
          {changes.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold tracking-wide uppercase text-[#9ca3af]">
                  <th className="pb-2 pr-3">Field</th>
                  <th className="pb-2 pr-3">From</th>
                  <th className="pb-2">To</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c) => (
                  <tr key={c.field} className="border-t border-[#eef1f7] align-top">
                    <td className="py-2.5 pr-3 font-semibold text-[#0f1117] whitespace-nowrap">{c.field}</td>
                    <td className="py-2.5 pr-3 text-[#c62828] break-all">{formatValue(c.from)}</td>
                    <td className="py-2.5 text-[#2e7d32] break-all">{formatValue(c.to)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[#9ca3af]">No field-level changes recorded for this entry.</p>
          )}

          {extra.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#eef1f7] flex flex-col gap-2">
              {extra.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#6b7280]">{key}</span>
                  <span className="font-semibold text-[#0f1117] text-right break-all">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[#eef1f7] text-xs text-[#9ca3af]">
            <span className="capitalize">{row.entityType}: {row.entityName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditTrailSection() {
  const { page, pageSize, setPage, setPageSize, reset } = usePagedSort('occurredAt');
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  const { data: entityTypes } = useAuditEntityTypes();
  const entityTypeOptions = enumOptions(entityTypes ?? []);

  const params: Record<string, unknown> = { page, pageSize };
  if (entityType) params.entityType = entityType;
  if (search) params.search = search;

  const { data, isLoading, error } = useResourceList<AuditLogRow>(
    QUERY_KEYS.auditLogs,
    endpoints.settings.auditLogs,
    params,
  );

  const columns: Column<AuditLogRow>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (r) => <Badge value={r.action} tone={actionTone(r.action)} label={r.action} />,
    },
    {
      key: 'occurredAt',
      header: 'Time',
      render: (r) => <span className="text-[#6b7280]">{formatDateTime(r.occurredAt)}</span>,
    },
    {
      key: 'actorId',
      header: 'Actor',
      render: (r) =>
        r.actorName ? (
          <div className="min-w-0">
            <div className="font-medium truncate">{r.actorName}</div>
            {r.actorEmail && <div className="text-xs text-[#9ca3af] truncate">{r.actorEmail}</div>}
          </div>
        ) : (
          <span className="text-[#cbd2e0]">System</span>
        ),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (r) => (
        <div className="min-w-0">
          <div className="font-medium truncate max-w-[200px]">{r.entityName}</div>
          <div className="text-xs text-[#9ca3af] capitalize">{r.entityType}</div>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (r) =>
        (r.metadata?.changes?.length ?? 0) > 0 ? (
          <button
            onClick={() => setSelected(r)}
            className="text-[#f86223] text-xs font-semibold hover:underline"
          >
            View
          </button>
        ) : (
          <span className="text-[#cbd2e0]">—</span>
        ),
    },
  ];

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="font-serif font-medium text-[#0f1117] text-[17px]">Audit Trail</h3>
          <p className="text-xs text-[#9ca3af] mt-0.5">Every create, update, and delete action, with before/after values.</p>
        </div>
        <FilterBar>
          <FilterSearch value={search} onChange={reset(setSearch)} placeholder="Search entity or actor…" />
          <FilterSelect value={entityType} onChange={reset(setEntityType)} options={entityTypeOptions} placeholder="All entities" />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No audit entries recorded yet."
        onRowClick={(r) => ((r.metadata?.changes?.length ?? 0) > 0 ? setSelected(r) : undefined)}
      />

      {data && <Pager pagination={data.pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />}

      {selected && <AuditDetailModal row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function SecuritySettings() {
  return (
    <AppShell>
      <PageHeader
        title="Security"
        subtitle="Review authentication events, the audit trail, and current security configuration."
      />

      <div className="flex flex-col gap-4">
        <SecurityConfigCard />
        <AuditTrailSection />
        <AccessLogSection />
      </div>
    </AppShell>
  );
}
