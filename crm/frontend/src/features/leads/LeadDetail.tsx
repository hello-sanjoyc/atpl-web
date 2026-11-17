import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/ErrorState';
import { Badge } from '../../components/Badge';
import { useResourceDetail, useResourceList, useResourceMutation } from '../_shared/hooks';
import { useOptions } from '../_shared/useOptions';
import { SelectInput, TextArea, enumOptions, humanize } from '../../components/form/fields';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { formatDate, formatDateTime } from '../../lib/format';
import type { Lead, LeadActivity } from '../_shared/types';
import { LEAD_STAGES } from '@aranax/contracts';

const stageOptions = enumOptions(LEAD_STAGES.map((s) => s.key));

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { labelFor } = useOptions();
  const lead = useResourceDetail<Lead>(['leads', id], id ? endpoints.leads.byId(id) : null);
  const activities = useResourceList<LeadActivity>(
    ['leads', id, 'activities'],
    id ? endpoints.leads.activities(id) : '',
  );

  const [note, setNote] = useState('');
  const [stage, setStage] = useState('');

  const stageMutation = useResourceMutation(
    (newStage: string) => http.patch(endpoints.leads.stage(id!), { stage: newStage }),
    { invalidate: ['leads', id], successMessage: 'Stage updated' },
  );
  const noteMutation = useResourceMutation(
    (body: string) => http.post(endpoints.leads.activities(id!), { type: 'note', body }),
    { invalidate: ['leads', id, 'activities'], successMessage: 'Note added', onSuccess: () => setNote('') },
  );

  if (lead.isLoading) return <AppShell><Spinner /></AppShell>;
  if (lead.error) return <AppShell><ErrorState error={lead.error} /></AppShell>;
  const l = lead.data!;

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4 pt-4 text-[13px] text-[#6b7280]">
        <Link to="/leads" className="font-medium hover:text-[#0f1117] transition-colors">Leads</Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-[#0f1117] truncate">{l.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-1px] text-[#0f1117] leading-tight">{l.name}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{l.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge value={l.stage} />
          <Badge value={l.priority} />
          <Badge value={l.qualificationStatus} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Main */}
        <div className="flex flex-col gap-5">
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-4">Details</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label="Company" value={l.company} />
              <Detail label="Phone" value={l.phone} />
              <Detail label="Country" value={l.country} />
              <Detail label="Capture channel" value={labelFor('capture_channel', l.captureChannel)} />
              <Detail label="Lead source" value={labelFor('lead_source', l.leadSource)} />
              <Detail label="Service interest" value={labelFor('service_interest', l.serviceInterest)} />
              <Detail label="Budget" value={labelFor('budget_range', l.budgetRange)} />
              <Detail label="Timeline" value={l.timeline && humanize(l.timeline)} />
              <Detail label="Score" value={l.score != null ? String(l.score) : null} />
              <Detail label="Created" value={formatDate(l.createdAt)} />
            </dl>
            {l.message && (
              <div className="mt-5 pt-5 border-t border-[#eef1f7]">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Message</dt>
                <p className="text-sm text-[#0f1117] whitespace-pre-wrap">{l.message}</p>
              </div>
            )}
          </section>

          {/* Activities */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-4">Activity</h2>
            <div className="flex flex-col gap-2 mb-4">
              <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="min-h-[72px]" />
              <button
                onClick={() => note.trim() && noteMutation.mutate(note.trim())}
                disabled={!note.trim() || noteMutation.isPending}
                className="self-start px-4 py-2 rounded-full bg-[#f86223] text-white text-[13px] font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
              >
                Add note
              </button>
            </div>
            {activities.isLoading ? (
              <Spinner />
            ) : activities.data && activities.data.items.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {activities.data.items.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <Badge value={a.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#0f1117] whitespace-pre-wrap">{a.body}</p>
                      <p className="text-xs text-[#9ca3af] mt-0.5">{formatDateTime(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#9ca3af]">No activity yet.</p>
            )}
          </section>
        </div>

        {/* Side: stage change */}
        <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-3">Move stage</h2>
          <SelectInput
            value={stage || l.stage}
            onChange={(e) => setStage(e.target.value)}
            options={stageOptions}
          />
          <button
            onClick={() => stage && stage !== l.stage && stageMutation.mutate(stage)}
            disabled={!stage || stage === l.stage || stageMutation.isPending}
            className="mt-3 w-full px-4 py-2.5 rounded-full bg-[#00308a] text-white text-[13px] font-bold hover:bg-[#002266] disabled:opacity-40 transition-all"
          >
            {stageMutation.isPending ? 'Updating…' : 'Update stage'}
          </button>
        </aside>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">{label}</dt>
      <dd className="text-[#0f1117]">{value || <span className="text-[#cbd2e0]">—</span>}</dd>
    </div>
  );
}
