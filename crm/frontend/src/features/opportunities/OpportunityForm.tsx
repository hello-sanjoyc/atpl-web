import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput, SelectInput } from '../../components/form/fields';
import { CountrySelect } from '../../components/form/CountrySelect';
import { useResourceMutation } from '../_shared/hooks';
import { useOptions } from '../_shared/useOptions';
import { FormLayout } from '../../components/form/FormAside';
import { FORM_INFO } from '../_shared/formInfo';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Opportunity } from '../_shared/types';
import { DEFAULT_CURRENCY } from '@aranax/contracts';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(160),
  estimatedValue: z.string().min(1, 'Value is required'),
  currency: z.string().length(3, 'Use a 3-letter currency code'),
  opportunityType: z.string().min(1, 'Type is required'),
  serviceInterest: z.string().optional().or(z.literal('')),
  expectedCloseDate: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  leadId: z.string().optional().or(z.literal('')),
  customerId: z.string().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function OpportunityForm() {
  const navigate = useNavigate();
  const { optionsFor } = useOptions();
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { currency: DEFAULT_CURRENCY, opportunityType: 'new_business' },
  });

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post<Opportunity>(endpoints.opportunities.create, body),
    {
      invalidate: ['opportunities'],
      successMessage: 'Opportunity created',
      onSuccess: (opp) => navigate(`/opportunities/${opp.id}`),
    },
  );

  const onSubmit = (data: FormData) => {
    const body: Record<string, unknown> = {
      title: data.title,
      estimatedValue: data.estimatedValue,
      currency: data.currency,
      opportunityType: data.opportunityType,
    };
    for (const k of ['serviceInterest', 'expectedCloseDate', 'country', 'leadId', 'customerId'] as const) {
      if (data[k]) body[k] = data[k];
    }
    mutation.mutate(body);
  };

  return (
    <AppShell>
      <PageHeader title="New opportunity" />
      <FormLayout info={FORM_INFO.opportunity}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title" htmlFor="title" required error={errors.title?.message} className="sm:col-span-2">
            <TextInput id="title" {...register('title')} aria-invalid={!!errors.title} placeholder="Enterprise rollout — Acme" />
          </Field>
          <Field label="Estimated value" htmlFor="estimatedValue" required error={errors.estimatedValue?.message}>
            <TextInput id="estimatedValue" {...register('estimatedValue')} aria-invalid={!!errors.estimatedValue} placeholder="25000" inputMode="decimal" />
          </Field>
          <Field label="Currency" htmlFor="currency" required error={errors.currency?.message}>
            <SelectInput id="currency" {...register('currency')} options={optionsFor('currency')} aria-invalid={!!errors.currency} />
          </Field>
          <Field label="Type" htmlFor="opportunityType" error={errors.opportunityType?.message}>
            <SelectInput id="opportunityType" {...register('opportunityType')} options={optionsFor('opportunity_type')} />
          </Field>
          <Field label="Service interest" htmlFor="serviceInterest">
            <SelectInput id="serviceInterest" {...register('serviceInterest')} options={optionsFor('service_interest')} placeholder="—" />
          </Field>
          <Field label="Expected close date" htmlFor="expectedCloseDate" error={errors.expectedCloseDate?.message}>
            <TextInput id="expectedCloseDate" type="date" {...register('expectedCloseDate')} />
          </Field>
          <Field label="Country" htmlFor="country" error={errors.country?.message}>
            <CountrySelect id="country" {...register('country')} aria-invalid={!!errors.country} />
          </Field>
          <Field label="Lead ID" htmlFor="leadId" hint="Link to an existing lead (optional)">
            <TextInput id="leadId" {...register('leadId')} placeholder="uuid" />
          </Field>
          <Field label="Customer ID" htmlFor="customerId" hint="Link to an existing customer (optional)">
            <TextInput id="customerId" {...register('customerId')} placeholder="uuid" />
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? 'Creating…' : 'Create opportunity'}
          </button>
          <Link to="/opportunities" className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
      </FormLayout>
    </AppShell>
  );
}
