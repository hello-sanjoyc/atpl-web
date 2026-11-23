import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/ErrorState';
import { Badge } from '../../components/Badge';
import { Field, TextInput, SelectInput, enumOptions } from '../../components/form/fields';
import { useResourceDetail, useResourceMutation } from '../_shared/hooks';
import { useOptions } from '../_shared/useOptions';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { formatDate } from '../../lib/format';
import type { Campaign } from '../_shared/types';
import { DEFAULT_CURRENCY } from '@aranax/contracts';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { optionsFor, labelFor } = useOptions();
  const campaign = useResourceDetail<Campaign>(['campaigns', id], id ? endpoints.campaigns.byId(id) : null);

  const [channel, setChannel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [source, setSource] = useState('manual');

  const costMutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post(endpoints.campaigns.acquisitionCosts(id!), body),
    {
      invalidate: ['campaigns', id],
      successMessage: 'Acquisition cost recorded',
      onSuccess: () => {
        setChannel('');
        setAmount('');
        setPeriodStart('');
        setPeriodEnd('');
      },
    },
  );

  if (campaign.isLoading) return <AppShell><Spinner /></AppShell>;
  if (campaign.error) return <AppShell><ErrorState error={campaign.error} /></AppShell>;
  const c = campaign.data!;

  const canSubmit = channel.trim() && amount.trim() && periodStart && periodEnd;

  const submitCost = () => {
    if (!canSubmit) return;
    costMutation.mutate({
      channel: channel.trim(),
      amount: amount.trim(),
      currency,
      periodStart,
      periodEnd,
      source,
    });
  };

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4 pt-4 text-[13px] text-[#6b7280]">
        <Link to="/campaigns" className="font-medium hover:text-[#0f1117] transition-colors">Campaigns</Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-[#0f1117] truncate">{c.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-[32px] font-medium tracking-tight text-[#0f1117] leading-tight">{c.name}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{c.slug}</p>
        </div>
        <Badge value={c.status} />
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
        <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Details</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Channel" value={labelFor('campaign_channel', c.channel)} />
            <Detail label="Status" value={c.status} />
            <Detail label="Slug" value={c.slug} />
            <Detail label="Starts on" value={c.startsOn ? formatDate(c.startsOn) : null} />
            <Detail label="Ends on" value={c.endsOn ? formatDate(c.endsOn) : null} />
            <Detail label="Created" value={formatDate(c.createdAt)} />
          </dl>
        </section>

        <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Record acquisition cost</h2>
          <div className="flex flex-col gap-4">
            <Field label="Channel" htmlFor="cost-channel" required>
              <TextInput id="cost-channel" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="email" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount" htmlFor="cost-amount" required>
                <TextInput id="cost-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000.00" />
              </Field>
              <Field label="Currency" htmlFor="cost-currency">
                <SelectInput id="cost-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={optionsFor('currency')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Period start" htmlFor="cost-start" required>
                <TextInput id="cost-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </Field>
              <Field label="Period end" htmlFor="cost-end" required>
                <TextInput id="cost-end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </Field>
            </div>
            <Field label="Source" htmlFor="cost-source">
              <SelectInput id="cost-source" value={source} onChange={(e) => setSource(e.target.value)} options={enumOptions(['manual', 'ad_platform_export'])} />
            </Field>
            <button
              onClick={submitCost}
              disabled={!canSubmit || costMutation.isPending}
              className="w-full px-4 py-2.5 rounded-full bg-[#00308a] text-white text-[13px] font-bold hover:bg-[#002266] disabled:opacity-40 transition-all"
            >
              {costMutation.isPending ? 'Saving…' : 'Record cost'}
            </button>
          </div>
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
