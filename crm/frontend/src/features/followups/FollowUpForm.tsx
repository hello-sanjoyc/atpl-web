import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput, TextArea } from '../../components/form/fields';
import { AsyncCombobox } from '../../components/form/AsyncCombobox';
import { FormLayout } from '../../components/form/FormAside';
import { FORM_INFO } from '../_shared/formInfo';
import { useResourceMutation } from '../_shared/hooks';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { FollowUp } from '../_shared/types';
import { mapLead, mapCustomer, mapOpportunity } from '../_shared/comboboxMappers';

const schema = z
  .object({
    title: z.string().min(1, 'Title is required').max(160),
    dueAt: z.string().min(1, 'Due date is required'),
    notes: z.string().max(1000).optional().or(z.literal('')),
    leadId: z.string().optional().or(z.literal('')),
    opportunityId: z.string().optional().or(z.literal('')),
    customerId: z.string().optional().or(z.literal('')),
  })
  .refine((v) => !!(v.leadId || v.opportunityId || v.customerId), {
    message: 'Link the task to a lead, opportunity or customer.',
    path: ['leadId'],
  });
type FormData = z.infer<typeof schema>;

export default function FollowUpForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, control, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post<FollowUp>(endpoints.followUps.create, body),
    {
      invalidate: ['followups'],
      successMessage: 'Follow-up created',
      onSuccess: () => navigate('/follow-ups'),
    },
  );

  const onSubmit = (data: FormData) => {
    const body: Record<string, unknown> = {
      title: data.title,
      // datetime-local has no timezone; toISOString adds the offset the backend expects.
      dueAt: new Date(data.dueAt).toISOString(),
    };
    for (const k of ['notes', 'leadId', 'opportunityId', 'customerId'] as const) {
      if (data[k]) body[k] = data[k];
    }
    mutation.mutate(body);
  };

  return (
    <AppShell>
      <PageHeader title="New follow-up" />
      <FormLayout info={FORM_INFO.followup}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title" htmlFor="title" required error={errors.title?.message} className="sm:col-span-2">
            <TextInput id="title" {...register('title')} aria-invalid={!!errors.title} placeholder="Call back about proposal" />
          </Field>
          <Field label="Due at" htmlFor="dueAt" required error={errors.dueAt?.message} className="sm:col-span-2">
            <TextInput id="dueAt" type="datetime-local" {...register('dueAt')} aria-invalid={!!errors.dueAt} />
          </Field>
          <Field label="Lead" htmlFor="leadId" hint="Link to one of lead / opportunity / customer" error={errors.leadId?.message}>
            <Controller
              name="leadId"
              control={control}
              render={({ field }) => (
                <AsyncCombobox
                  id="leadId"
                  url={endpoints.leads.list}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  mapResult={mapLead}
                  placeholder="Search leads by name or email…"
                />
              )}
            />
          </Field>
          <Field label="Opportunity" htmlFor="opportunityId">
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
          <Field label="Customer" htmlFor="customerId">
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <AsyncCombobox
                  id="customerId"
                  url={endpoints.customers.list}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  mapResult={mapCustomer}
                  placeholder="Search customers by name or email…"
                />
              )}
            />
          </Field>
        </div>
        <Field label="Notes" htmlFor="notes" className="mt-4" error={errors.notes?.message}>
          <TextArea id="notes" {...register('notes')} placeholder="Context for this task…" />
        </Field>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? 'Creating…' : 'Create follow-up'}
          </button>
          <Link to="/follow-ups" className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
      </FormLayout>
    </AppShell>
  );
}
