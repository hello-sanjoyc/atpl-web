import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput, SelectInput, enumOptions } from '../../components/form/fields';
import { useResourceMutation } from '../_shared/hooks';
import { FormLayout } from '../../components/form/FormAside';
import { FORM_INFO } from '../_shared/formInfo';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Campaign } from '../_shared/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  slug: z.string().regex(/^[a-z0-9-]{2,80}$/, 'Lowercase letters, digits and hyphens only (2-80).'),
  channel: z.string().min(1, 'Channel is required').max(60),
  status: z.enum(['active', 'paused', 'ended']),
  startsOn: z.string().optional().or(z.literal('')),
  endsOn: z.string().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function CampaignForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { status: 'active' },
  });

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post<Campaign>(endpoints.campaigns.create, body),
    {
      invalidate: ['campaigns'],
      successMessage: 'Campaign created',
      onSuccess: (campaign) => navigate(`/campaigns/${campaign.id}`),
    },
  );

  const onSubmit = (data: FormData) => {
    const body: Record<string, unknown> = {
      name: data.name,
      slug: data.slug,
      channel: data.channel,
      status: data.status,
    };
    for (const k of ['startsOn', 'endsOn'] as const) {
      if (data[k]) body[k] = data[k];
    }
    mutation.mutate(body);
  };

  return (
    <AppShell>
      <PageHeader title="New campaign" />
      <FormLayout info={FORM_INFO.campaign}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <TextInput id="name" {...register('name')} aria-invalid={!!errors.name} placeholder="Spring launch" />
          </Field>
          <Field label="Slug" htmlFor="slug" required hint="Lowercase, digits, hyphens" error={errors.slug?.message}>
            <TextInput id="slug" {...register('slug')} aria-invalid={!!errors.slug} placeholder="spring-launch" />
          </Field>
          <Field label="Channel" htmlFor="channel" required error={errors.channel?.message}>
            <TextInput id="channel" {...register('channel')} aria-invalid={!!errors.channel} placeholder="email" />
          </Field>
          <Field label="Status" htmlFor="status" error={errors.status?.message}>
            <SelectInput id="status" {...register('status')} options={enumOptions(['active', 'paused', 'ended'])} />
          </Field>
          <Field label="Starts on" htmlFor="startsOn" error={errors.startsOn?.message}>
            <TextInput id="startsOn" type="date" {...register('startsOn')} />
          </Field>
          <Field label="Ends on" htmlFor="endsOn" error={errors.endsOn?.message}>
            <TextInput id="endsOn" type="date" {...register('endsOn')} />
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? 'Creating…' : 'Create campaign'}
          </button>
          <Link to="/campaigns" className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
      </FormLayout>
    </AppShell>
  );
}
