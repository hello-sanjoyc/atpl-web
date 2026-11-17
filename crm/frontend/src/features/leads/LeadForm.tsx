import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput, TextArea, SelectInput, enumOptions } from '../../components/form/fields';
import { CountrySelect } from '../../components/form/CountrySelect';
import { FormLayout } from '../../components/form/FormAside';
import { FORM_INFO } from '../_shared/formInfo';
import { useCountries } from '../_shared/useCountries';
import { useOptions } from '../_shared/useOptions';
import { useResourceMutation } from '../_shared/hooks';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Lead } from '../_shared/types';
import { LEAD_PRIORITIES } from '@aranax/contracts';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email(),
  phone: z.string().min(1, 'Phone is required').max(40),
  company: z.string().max(160).optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  serviceInterest: z.string().optional().or(z.literal('')),
  budgetRange: z.string().optional().or(z.literal('')),
  timeline: z.string().optional().or(z.literal('')),
  captureChannel: z.string().optional().or(z.literal('')),
  leadSource: z.string().optional().or(z.literal('')),
  priority: z.enum(LEAD_PRIORITIES),
  message: z.string().max(3000).optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

/** Strips a leading "+<digits>" dial code (and the space after it) from a phone value. */
function stripDialCode(phone: string): string {
  return phone.replace(/^\s*\+\d{1,4}\s*/, '');
}

/** Returns the leading "+<digits>" dial code of a phone value, or null. */
function extractDialCode(phone: string): string | null {
  const m = phone.match(/^\s*(\+\d{1,4})/);
  return m ? m[1] : null;
}

export default function LeadForm() {
  const navigate = useNavigate();
  const { data: countries } = useCountries();
  const { optionsFor } = useOptions();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { priority: 'medium', captureChannel: 'contact_form', leadSource: 'website' },
  });

  // Two-way sync between the Country select and the phone field's dial code.
  // Each effect only writes when the derived target differs from the current
  // value, so the pair settles after one round instead of looping.
  const country = useWatch({ control, name: 'country' });
  const phone = useWatch({ control, name: 'phone' });
  const prevCountry = useRef<string | undefined>(undefined);

  // Country → phone: swap the dial code, keeping the local digits the user typed.
  useEffect(() => {
    // Skip the first run so we don't clobber a value the user is editing on mount.
    if (prevCountry.current === undefined) {
      prevCountry.current = country;
      return;
    }
    if (country === prevCountry.current) return;
    prevCountry.current = country;

    const code = countries?.find((c) => c.iso === country)?.phoneCode;
    const localDigits = stripDialCode(getValues('phone') ?? '');
    const next = code ? `${code} ${localDigits}`.trimEnd() : localDigits;
    if (next !== (getValues('phone') ?? '')) {
      setValue('phone', next, { shouldValidate: true, shouldDirty: true });
    }
  }, [country, countries, getValues, setValue]);

  // Phone → country: when the leading dial code maps to a country, select it;
  // when it maps to none, fall back to the default "Select country" option.
  useEffect(() => {
    if (!countries) return;
    const code = extractDialCode(phone ?? '');
    // The country that this dial code resolves to ('' = no match / default).
    const nextIso = code ? (countries.find((c) => c.phoneCode === code)?.iso ?? '') : '';

    // Only reset to default when a code was actually typed; leave an empty
    // phone alone so the user can still pick a country first.
    if (!code && getValues('country')) return;

    if (nextIso !== getValues('country')) {
      prevCountry.current = nextIso; // pre-sync so the country→phone effect no-ops
      setValue('country', nextIso, { shouldValidate: true, shouldDirty: true });
    }
  }, [phone, countries, getValues, setValue]);

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post<Lead>(endpoints.leads.create, body),
    {
      invalidate: ['leads'],
      successMessage: 'Lead created',
      onSuccess: (lead) => navigate(`/leads/${lead.id}`),
    },
  );

  const onSubmit = (data: FormData) => {
    // Strip empty-string optionals so the backend validators see omitted fields.
    const body: Record<string, unknown> = { name: data.name, email: data.email, priority: data.priority };
    for (const k of ['phone', 'company', 'country', 'serviceInterest', 'budgetRange', 'timeline', 'captureChannel', 'leadSource', 'message'] as const) {
      if (data[k]) body[k] = data[k];
    }
    mutation.mutate(body);
  };

  return (
    <AppShell>
      <PageHeader title="New lead" />
      <FormLayout info={FORM_INFO.lead}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <TextInput id="name" {...register('name')} aria-invalid={!!errors.name} placeholder="Jane Doe" />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <TextInput id="email" type="email" {...register('email')} aria-invalid={!!errors.email} placeholder="jane@company.com" />
          </Field>
          <Field label="Phone" htmlFor="phone" required error={errors.phone?.message}>
            <TextInput id="phone" {...register('phone')} aria-invalid={!!errors.phone} placeholder="+1 555 000 0000" />
          </Field>
          <Field label="Company" htmlFor="company" error={errors.company?.message}>
            <TextInput id="company" {...register('company')} placeholder="Acme Inc." />
          </Field>
          <Field label="Country" htmlFor="country" error={errors.country?.message}>
            <CountrySelect id="country" {...register('country')} aria-invalid={!!errors.country} />
          </Field>
          <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
            <SelectInput id="priority" {...register('priority')} options={enumOptions(LEAD_PRIORITIES)} />
          </Field>
          <Field label="Capture Channel" htmlFor="captureChannel" error={errors.captureChannel?.message}>
            <SelectInput id="captureChannel" {...register('captureChannel')} options={optionsFor('capture_channel')} />
          </Field>
          <Field label="Lead Source" htmlFor="leadSource" error={errors.leadSource?.message}>
            <SelectInput id="leadSource" {...register('leadSource')} options={optionsFor('lead_source')} />
          </Field>
          <Field label="Service interest" htmlFor="serviceInterest">
            <SelectInput id="serviceInterest" {...register('serviceInterest')} options={optionsFor('service_interest')} placeholder="—" />
          </Field>
          <Field label="Budget range" htmlFor="budgetRange">
            <SelectInput id="budgetRange" {...register('budgetRange')} options={optionsFor('budget_range')} placeholder="—" />
          </Field>
          <Field label="Timeline" htmlFor="timeline">
            <SelectInput id="timeline" {...register('timeline')} options={optionsFor('timeline')} placeholder="—" />
          </Field>
        </div>
        <Field label="Message" htmlFor="message" className="mt-4" error={errors.message?.message}>
          <TextArea id="message" {...register('message')} placeholder="Notes about this lead…" />
        </Field>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? 'Creating…' : 'Create lead'}
          </button>
          <Link to="/leads" className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
      </FormLayout>
    </AppShell>
  );
}
