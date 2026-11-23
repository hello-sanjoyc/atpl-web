import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/ErrorState';
import { Badge } from '../../components/Badge';
import { useResourceDetail, useResourceMutation } from '../_shared/hooks';
import { useOptions } from '../_shared/useOptions';
import { useCountries } from '../_shared/useCountries';
import { Field, TextInput, SelectInput } from '../../components/form/fields';
import { toTitle } from '../../components/form/CountrySelect';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { formatDate } from '../../lib/format';
import type { Contact, Contract, CustomerDetailResponse, Opportunity } from '../_shared/types';
import { DEFAULT_CURRENCY } from '@aranax/contracts';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const detail = useResourceDetail<CustomerDetailResponse>(['customers', id], id ? endpoints.customers.byId(id) : null);
  const { data: countries } = useCountries();
  const countryNameByIso = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of countries ?? []) map.set(c.iso, toTitle(c.name));
    return map;
  }, [countries]);

  if (detail.isLoading) return <AppShell><Spinner /></AppShell>;
  if (detail.error) return <AppShell><ErrorState error={detail.error} /></AppShell>;
  const { customer: c, contacts, contracts, opportunities, referral } = detail.data!;

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4 pt-4 text-[13px] text-[#6b7280]">
        <Link to="/customers" className="font-medium hover:text-[#0f1117] transition-colors">Customers</Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-[#0f1117] truncate">{c.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-[32px] font-medium tracking-tight text-[#0f1117] leading-tight">{c.name}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{c.email}</p>
        </div>
        <Badge value={c.status} />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Details</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label="Phone" value={c.phone} />
              <Detail label="Country" value={c.country ? (countryNameByIso.get(c.country) ?? c.country) : null} />
              <Detail label="Status" value={c.status} />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Source lead</dt>
                <dd className="text-[#0f1117]">
                  {c.sourceLeadId ? (
                    <Link to={`/leads/${c.sourceLeadId}`} className="text-[#f86223] hover:underline">View lead</Link>
                  ) : (
                    <span className="text-[#cbd2e0]">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Referred by</dt>
                <dd className="text-[#0f1117]">
                  {referral ? (
                    <Link to={`/referrals/${referral.id}`} className="text-[#f86223] hover:underline">
                      {referral.referrerName} ({referral.code})
                    </Link>
                  ) : (
                    <span className="text-[#cbd2e0]">—</span>
                  )}
                </dd>
              </div>
              <Detail label="Created" value={formatDate(c.createdAt)} />
            </dl>
          </section>

          <ContactsList contacts={contacts} />
          <ContractsList contracts={contracts} />
          <OpportunitiesList opportunities={opportunities} />

          <ContractForm customerId={id!} />
          <ContactForm customerId={id!} />
        </div>

        <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-3">Renewals</h2>
          <Link
            to="/customers"
            className="text-[13px] font-semibold text-[#6b7280] hover:text-[#0f1117] transition-colors"
          >
            View all customers
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}

function ContactsList({ contacts }: { contacts: Contact[] }) {
  return (
    <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
      <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Contacts</h2>
      {contacts.length === 0 ? (
        <p className="text-sm text-[#9ca3af]">No contacts yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#f7f9fd]">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#0f1117] truncate">
                  {contact.name}
                  {contact.isPrimary && <span className="ml-2 text-[10px] font-bold text-[#f86223]">PRIMARY</span>}
                </div>
                <div className="text-xs text-[#9ca3af] truncate">{[contact.role, contact.email, contact.phone].filter(Boolean).join(' · ') || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ContractsList({ contracts }: { contracts: Contract[] }) {
  return (
    <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
      <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Contracts</h2>
      {contracts.length === 0 ? (
        <p className="text-sm text-[#9ca3af]">No contracts yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {contracts.map((contract) => (
            <div key={contract.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#f7f9fd]">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#0f1117] truncate">{contract.name}</div>
                <div className="text-xs text-[#9ca3af] truncate">
                  {contract.kind} · {contract.currency} {contract.value}
                  {contract.renewsOn && ` · renews ${formatDate(contract.renewsOn)}`}
                </div>
              </div>
              <Badge value={contract.status} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function OpportunitiesList({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
      <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Opportunities</h2>
      {opportunities.length === 0 ? (
        <p className="text-sm text-[#9ca3af]">No linked opportunities.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {opportunities.map((opp) => (
            <Link
              key={opp.id}
              to={`/opportunities/${opp.id}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#f7f9fd] hover:bg-[#eef2fb] transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#0f1117] truncate">{opp.title}</div>
                <div className="text-xs text-[#9ca3af] truncate">{opp.currency} {opp.estimatedValue}</div>
              </div>
              <Badge value={opp.stage} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function ContractForm({ customerId }: { customerId: string }) {
  const { optionsFor } = useOptions();
  const contractKindOptions = optionsFor('contract_kind');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<string>('subscription');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [opportunityId, setOpportunityId] = useState('');

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post(endpoints.customers.contracts(customerId), body),
    {
      invalidate: ['customers', customerId],
      successMessage: 'Contract added',
      onSuccess: () => {
        setName('');
        setValue('');
        setOpportunityId('');
      },
    },
  );

  const submit = () => {
    if (!name.trim() || !value.trim()) return;
    const body: Record<string, unknown> = { name: name.trim(), kind, value: value.trim(), currency };
    if (opportunityId.trim()) body.opportunityId = opportunityId.trim();
    mutation.mutate(body);
  };

  return (
    <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
      <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Add contract</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Annual subscription" />
        </Field>
        <Field label="Kind">
          <SelectInput value={kind} onChange={(e) => setKind(e.target.value)} options={contractKindOptions} />
        </Field>
        <Field label="Value" required>
          <TextInput value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder="12000.00" />
        </Field>
        <Field label="Currency">
          <SelectInput value={currency} onChange={(e) => setCurrency(e.target.value)} options={optionsFor('currency')} />
        </Field>
        <Field label="Opportunity ID" hint="Optional" className="sm:col-span-2">
          <TextInput value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)} placeholder="opportunity UUID" />
        </Field>
      </div>
      <button
        onClick={submit}
        disabled={!name.trim() || !value.trim() || mutation.isPending}
        className="mt-4 px-5 py-2.5 rounded-full bg-[#f86223] text-white text-[13px] font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
      >
        {mutation.isPending ? 'Adding…' : 'Add contract'}
      </button>
    </section>
  );
}

function ContactForm({ customerId }: { customerId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post(endpoints.customers.contacts(customerId), body),
    {
      invalidate: ['customers', customerId],
      successMessage: 'Contact added',
      onSuccess: () => {
        setName('');
        setEmail('');
        setPhone('');
        setIsPrimary(false);
      },
    },
  );

  const submit = () => {
    if (!name.trim()) return;
    const body: Record<string, unknown> = { name: name.trim(), isPrimary };
    if (email.trim()) body.email = email.trim();
    if (phone.trim()) body.phone = phone.trim();
    mutation.mutate(body);
  };

  return (
    <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
      <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Add contact</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </Field>
        <Field label="Email">
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="jane@acme.com" />
        </Field>
        <Field label="Phone">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
        </Field>
        <label className="flex items-center gap-2 mt-7 text-[13px] text-[#6b7280] select-none cursor-pointer">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-4 h-4 rounded border-[#e2e6f0] accent-[#f86223] cursor-pointer"
          />
          Primary contact
        </label>
      </div>
      <button
        onClick={submit}
        disabled={!name.trim() || mutation.isPending}
        className="mt-4 px-5 py-2.5 rounded-full bg-[#f86223] text-white text-[13px] font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
      >
        {mutation.isPending ? 'Adding…' : 'Add contact'}
      </button>
    </section>
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
