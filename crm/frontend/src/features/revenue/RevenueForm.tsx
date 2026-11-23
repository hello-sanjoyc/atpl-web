import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput, SelectInput } from '../../components/form/fields';
import { AsyncCombobox } from '../../components/form/AsyncCombobox';
import { useResourceDetail, useResourceMutation } from '../_shared/hooks';
import { useOptions } from '../_shared/useOptions';
import { FormLayout } from '../../components/form/FormAside';
import { FORM_INFO } from '../_shared/formInfo';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { CustomerDetailResponse, RevenueRecord } from '../_shared/types';
import { mapCustomer, mapOpportunity, contractToOption } from '../_shared/comboboxMappers';
import { DEFAULT_CURRENCY } from '@aranax/contracts';

const kindOptions = [
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'collected', label: 'Collected' },
];

const schema = z.object({
  kind: z.enum(['invoiced', 'collected']),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => Number(v) > 0, 'Amount must be greater than zero'),
  currency: z.string().length(3, 'Use a 3-letter currency code'),
  recognizedOn: z.string().min(1, 'Date is required'),
  customerId: z.string().uuid('Must be a valid ID').optional().or(z.literal('')),
  opportunityId: z.string().uuid('Must be a valid ID').optional().or(z.literal('')),
  contractId: z.string().uuid('Must be a valid ID').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function RevenueForm() {
  const navigate = useNavigate();
  const { optionsFor } = useOptions();
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { kind: 'invoiced', currency: DEFAULT_CURRENCY },
  });

  const customerId = watch('customerId');
  const customerDetail = useResourceDetail<CustomerDetailResponse>(
    ['customers', customerId],
    customerId ? endpoints.customers.byId(customerId) : null,
  );
  const contractOptions = (customerDetail.data?.contracts ?? []).map(contractToOption);

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post<RevenueRecord>(endpoints.revenue.createRecord, body),
    {
      invalidate: ['revenue-records'],
      successMessage: 'Revenue record created',
      onSuccess: () => navigate('/revenue'),
    },
  );

  const onSubmit = (data: FormData) => {
    const body: Record<string, unknown> = {
      kind: data.kind,
      amount: data.amount,
      currency: data.currency,
      recognizedOn: data.recognizedOn,
    };
    for (const k of ['customerId', 'opportunityId', 'contractId'] as const) {
      if (data[k]) body[k] = data[k];
    }
    mutation.mutate(body);
  };

  return (
    <AppShell>
      <PageHeader title="New revenue record" />
      <FormLayout info={FORM_INFO.revenue}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Kind" htmlFor="kind" required error={errors.kind?.message}>
            <SelectInput id="kind" {...register('kind')} options={kindOptions} />
          </Field>
          <Field label="Amount" htmlFor="amount" required error={errors.amount?.message}>
            <TextInput id="amount" {...register('amount')} aria-invalid={!!errors.amount} inputMode="decimal" placeholder="12000.00" />
          </Field>
          <Field label="Currency" htmlFor="currency" required error={errors.currency?.message}>
            <SelectInput id="currency" {...register('currency')} options={optionsFor('currency')} aria-invalid={!!errors.currency} />
          </Field>
          <Field label="Recognized on" htmlFor="recognizedOn" required error={errors.recognizedOn?.message}>
            <TextInput id="recognizedOn" type="date" {...register('recognizedOn')} aria-invalid={!!errors.recognizedOn} />
          </Field>
          <Field label="Customer" htmlFor="customerId" hint="Optional" error={errors.customerId?.message}>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <AsyncCombobox
                  id="customerId"
                  url={endpoints.customers.list}
                  value={field.value ?? ''}
                  onChange={(id) => {
                    field.onChange(id);
                    setValue('contractId', '');
                  }}
                  mapResult={mapCustomer}
                  placeholder="Search customers by name or email…"
                />
              )}
            />
          </Field>
          <Field label="Opportunity" htmlFor="opportunityId" hint="Optional" error={errors.opportunityId?.message}>
            <Controller
              name="opportunityId"
              control={control}
              render={({ field }) => (
                <AsyncCombobox
                  id="opportunityId"
                  url={endpoints.opportunities.list}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  mapResult={mapOpportunity}
                  placeholder="Search opportunities by title…"
                />
              )}
            />
          </Field>
          <Field
            label="Contract"
            htmlFor="contractId"
            hint={customerId ? 'Optional' : 'Pick a customer first'}
            error={errors.contractId?.message}
          >
            <Controller
              name="contractId"
              control={control}
              render={({ field }) => (
                <AsyncCombobox
                  id="contractId"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  staticOptions={contractOptions}
                  disabled={!customerId}
                  placeholder={customerId ? 'Search this customer’s contracts…' : 'Pick a customer first'}
                />
              )}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? 'Creating…' : 'Create record'}
          </button>
          <Link to="/revenue" className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
      </FormLayout>
    </AppShell>
  );
}
