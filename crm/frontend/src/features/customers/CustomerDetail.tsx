import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/ErrorState';
import { Badge } from '../../components/Badge';
import { useResourceDetail, useResourceMutation } from '../_shared/hooks';
import { useOptions } from '../_shared/useOptions';
import { Field, TextInput, SelectInput } from '../../components/form/fields';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { formatDate } from '../../lib/format';
import type { Customer } from '../_shared/types';
import { DEFAULT_CURRENCY } from '@aranax/contracts';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customer = useResourceDetail<Customer>(['customers', id], id ? endpoints.customers.byId(id) : null);

  if (customer.isLoading) return <AppShell><Spinner /></AppShell>;
  if (customer.error) return <AppShell><ErrorState error={customer.error} /></AppShell>;
  const c = customer.data!;

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4 pt-4 text-[13px] text-[#6b7280]">
        <Link to="/customers" className="font-medium hover:text-[#0f1117] transition-colors">Customers</Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-[#0f1117] truncate">{c.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-1px] text-[#0f1117] leading-tight">{c.name}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{c.email}</p>
        </div>
        <Badge value={c.status} />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-4">Details</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label="Country" value={c.country} />
              <Detail label="Status" value={c.status} />
              <Detail label="Source lead" value={c.sourceLeadId} />
              <Detail label="Created" value={formatDate(c.createdAt)} />
            </dl>
          </section>

          <ContractForm customerId={id!} />
          <ContactForm customerId={id!} />
        </div>

        <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-3">Renewals</h2>
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
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-4">Add contract</h2>
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
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-4">Add contact</h2>
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
