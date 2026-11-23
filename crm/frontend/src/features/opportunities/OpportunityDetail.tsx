import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/ErrorState';
import { Badge } from '../../components/Badge';
import { useResourceDetail, useResourceMutation } from '../_shared/hooks';
import { SelectInput, enumOptions } from '../../components/form/fields';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { formatDate, formatMoney } from '../../lib/format';
import type { Opportunity } from '../_shared/types';
import { OPPORTUNITY_STAGES } from '@aranax/contracts';
import { useOptions } from '../_shared/useOptions';

const stageOptions = enumOptions(OPPORTUNITY_STAGES.map((s) => s.key));

interface OppHealth {
  opportunityId: string;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  stalledDays: number | null;
  risks: string[];
  strengths: string[];
  nextSteps: string[];
  summary: string;
}

interface ProposalVersion {
  id: string;
  version: number;
  markdownContent: string;
  generatedAt: string;
}

const riskColors: Record<string, string> = {
  low: 'text-green-700 bg-green-50',
  medium: 'text-amber-700 bg-amber-50',
  high: 'text-red-700 bg-red-50',
};

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { labelFor } = useOptions();
  const opp = useResourceDetail<Opportunity>(['opportunities', id], id ? endpoints.opportunities.byId(id) : null);
  const health = useResourceDetail<OppHealth>(['opportunities', id, 'health'], id ? endpoints.opportunities.health(id) : null);

  const [stage, setStage] = useState('');
  const [proposals, setProposals] = useState<ProposalVersion[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ProposalVersion | null>(null);

  const stageMutation = useResourceMutation(
    (newStage: string) => http.post(endpoints.opportunities.stage(id!), { stage: newStage }),
    { invalidate: ['opportunities', id], successMessage: 'Stage updated' },
  );

  const generateProposalMutation = useResourceMutation(
    () =>
      http.post(endpoints.opportunities.generateProposal(id!), {}).then(async () => {
        const res = await http.get<ProposalVersion[]>(endpoints.opportunities.proposals(id!));
        setProposals(res ?? []);
      }),
    { successMessage: 'Proposal generated' },
  );

  const loadProposals = async () => {
    const res = await http.get<ProposalVersion[]>(endpoints.opportunities.proposals(id!));
    setProposals(res ?? []);
  };

  if (opp.isLoading) return <AppShell><Spinner /></AppShell>;
  if (opp.error) return <AppShell><ErrorState error={opp.error} /></AppShell>;
  const o = opp.data!;

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4 pt-4 text-[13px] text-[#6b7280]">
        <Link to="/opportunities" className="font-medium hover:text-[#0f1117] transition-colors">Opportunities</Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-[#0f1117] truncate">{o.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-[32px] font-medium tracking-tight text-[#0f1117] leading-tight">{o.title}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{formatMoney(o.estimatedValue, o.currency)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge value={o.stage} />
          <Badge value={o.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Main column */}
        <div className="flex flex-col gap-5">
          {/* Details */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Details</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label="Type" value={labelFor('opportunity_type', o.opportunityType)} />
              <Detail label="Service interest" value={labelFor('service_interest', o.serviceInterest)} />
              <Detail label="Estimated value" value={formatMoney(o.estimatedValue, o.currency)} />
              <Detail label="Currency" value={o.currency} />
              <Detail label="Expected close" value={o.expectedCloseDate ? formatDate(o.expectedCloseDate) : null} />
              <Detail label="Country" value={o.country} />
              <DetailLink label="Lead" name={o.leadName} to={o.leadId ? `/leads/${o.leadId}` : null} />
              <DetailLink label="Customer" name={o.customerName} to={o.customerId ? `/customers/${o.customerId}` : null} />
              <Detail label="Created" value={formatDate(o.createdAt)} />
            </dl>
          </section>

          {/* Opportunity Health */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">AI Opportunity Health</h2>
            {health.isLoading ? (
              <Spinner />
            ) : health.data ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  {/* Health score meter */}
                  <div className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-[#f9fafb] min-w-[100px]">
                    <p className="font-mono text-xs font-medium uppercase tracking-wide text-[#9ca3af]">Health</p>
                    <p className="font-serif text-[32px] font-medium tracking-tight" style={{ color: health.data.healthScore >= 70 ? '#16a34a' : health.data.healthScore >= 40 ? '#d97706' : '#dc2626' }}>
                      {health.data.healthScore}
                    </p>
                    <div className="w-full h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${health.data.healthScore}%`, backgroundColor: health.data.healthScore >= 70 ? '#16a34a' : health.data.healthScore >= 40 ? '#d97706' : '#dc2626' }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <span className={`self-start text-xs font-bold px-2 py-0.5 rounded-full ${riskColors[health.data.riskLevel]}`}>
                      {health.data.riskLevel.toUpperCase()} RISK
                    </span>
                    {health.data.stalledDays && (
                      <p className="text-sm text-amber-700 font-medium">⚠ Stalled for {health.data.stalledDays} days</p>
                    )}
                    <p className="text-sm text-[#0f1117]">{health.data.summary}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <BulletList label="Risks" items={health.data.risks} accent="#dc2626" />
                  <BulletList label="Strengths" items={health.data.strengths} accent="#16a34a" />
                  <BulletList label="Next Steps" items={health.data.nextSteps} accent="#f86223" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#9ca3af]">Health analysis unavailable.</p>
            )}
          </section>

          {/* AI Proposal Assistant */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af]">AI Proposal</h2>
              <div className="flex gap-2">
                {proposals.length === 0 && (
                  <button onClick={loadProposals} className="text-xs text-[#6b7280] hover:text-[#0f1117] underline">
                    Load existing
                  </button>
                )}
                <button
                  onClick={() => generateProposalMutation.mutate(undefined)}
                  disabled={generateProposalMutation.isPending}
                  className="px-3 py-1.5 rounded-full bg-[#f86223] text-white text-[12px] font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
                >
                  {generateProposalMutation.isPending ? 'Generating…' : '+ Generate'}
                </button>
              </div>
            </div>
            {proposals.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 flex-wrap">
                  {proposals.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProposal(p)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${selectedProposal?.id === p.id ? 'bg-[#00308a] text-white' : 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0]'}`}
                    >
                      v{p.version} · {formatDate(p.generatedAt)}
                    </button>
                  ))}
                </div>
                {selectedProposal && (
                  <div className="border border-[#eef1f7] rounded-2xl p-4 max-h-[500px] overflow-y-auto">
                    <pre className="text-sm text-[#0f1117] whitespace-pre-wrap font-sans leading-relaxed">{selectedProposal.markdownContent}</pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#9ca3af]">No proposals yet. Click Generate to create one.</p>
            )}
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-3">Move stage</h2>
          <SelectInput
            value={stage || o.stage}
            onChange={(e) => setStage(e.target.value)}
            options={stageOptions}
          />
          <button
            onClick={() => stage && stage !== o.stage && stageMutation.mutate(stage)}
            disabled={!stage || stage === o.stage || stageMutation.isPending}
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
      <dd className="text-[#0f1117] break-words">{value || <span className="text-[#cbd2e0]">—</span>}</dd>
    </div>
  );
}

function DetailLink({ label, name, to }: { label: string; name?: string | null; to: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">{label}</dt>
      <dd className="text-[#0f1117] break-words">
        {name && to ? (
          <Link to={to} className="font-medium text-[#f86223] hover:underline">{name}</Link>
        ) : (
          <span className="text-[#cbd2e0]">—</span>
        )}
      </dd>
    </div>
  );
}

function BulletList({ label, items, accent }: { label: string; items: string[]; accent: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="p-3 rounded-2xl bg-[#f9fafb]">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: accent }}>{label}</p>
      <ul className="text-sm text-[#0f1117] space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-1.5">
            <span style={{ color: accent }} aria-hidden>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
