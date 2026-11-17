import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput } from '../../components/form/fields';
import { CountrySelect } from '../../components/form/CountrySelect';
import { useResourceMutation } from '../_shared/hooks';
import { FormLayout } from '../../components/form/FormAside';
import { FORM_INFO } from '../_shared/formInfo';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Customer } from '../_shared/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email(),
  country: z.string().optional().or(z.literal('')),
  sourceLeadId: z.string().uuid('Must be a valid ID').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function CustomerForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post<Customer>(endpoints.customers.create, body),
    {
      invalidate: ['customers'],
      successMessage: 'Customer created',
      onSuccess: (customer) => navigate(`/customers/${customer.id}`),
    },
  );

  const onSubmit = (data: FormData) => {
    const body: Record<string, unknown> = { name: data.name, email: data.email };
    for (const k of ['country', 'sourceLeadId'] as const) {
      if (data[k]) body[k] = data[k];
    }
    mutation.mutate(body);
  };

  return (
    <AppShell>
      <PageHeader title="New customer" />
      <FormLayout info={FORM_INFO.customer}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <TextInput id="name" {...register('name')} aria-invalid={!!errors.name} placeholder="Acme Inc." />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <TextInput id="email" type="email" {...register('email')} aria-invalid={!!errors.email} placeholder="contact@acme.com" />
          </Field>
          <Field label="Country" htmlFor="country" error={errors.country?.message}>
            <CountrySelect id="country" {...register('country')} aria-invalid={!!errors.country} />
          </Field>
          <Field label="Source lead ID" htmlFor="sourceLeadId" hint="Optional" error={errors.sourceLeadId?.message}>
            <TextInput id="sourceLeadId" {...register('sourceLeadId')} placeholder="lead UUID" />
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? 'Creating…' : 'Create customer'}
          </button>
          <Link to="/customers" className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
      </FormLayout>
    </AppShell>
  );
}
