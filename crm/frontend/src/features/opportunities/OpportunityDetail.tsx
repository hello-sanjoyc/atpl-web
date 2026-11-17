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

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { labelFor } = useOptions();
  const opp = useResourceDetail<Opportunity>(['opportunities', id], id ? endpoints.opportunities.byId(id) : null);

  const [stage, setStage] = useState('');

  const stageMutation = useResourceMutation(
    (newStage: string) => http.post(endpoints.opportunities.stage(id!), { stage: newStage }),
    { invalidate: ['opportunities', id], successMessage: 'Stage updated' },
  );

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
          <h1 className="text-[32px] font-extrabold tracking-[-1px] text-[#0f1117] leading-tight">{o.title}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{formatMoney(o.estimatedValue, o.currency)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge value={o.stage} />
          <Badge value={o.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-4">Details</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Type" value={labelFor('opportunity_type', o.opportunityType)} />
            <Detail label="Service interest" value={labelFor('service_interest', o.serviceInterest)} />
            <Detail label="Estimated value" value={formatMoney(o.estimatedValue, o.currency)} />
            <Detail label="Currency" value={o.currency} />
            <Detail label="Expected close" value={o.expectedCloseDate ? formatDate(o.expectedCloseDate) : null} />
            <Detail label="Country" value={o.country} />
            <Detail label="Lead ID" value={o.leadId} />
            <Detail label="Customer ID" value={o.customerId} />
            <Detail label="Created" value={formatDate(o.createdAt)} />
          </dl>
        </section>

        <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-3">Move stage</h2>
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
