import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput } from '../../components/form/fields';
import { useResourceMutation } from '../_shared/hooks';
import { FormLayout } from '../../components/form/FormAside';
import { FORM_INFO } from '../_shared/formInfo';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Referral } from '../_shared/types';

const schema = z.object({
  code: z.string().regex(/^[A-Za-z0-9]{4,20}$/, '4-20 letters or digits.'),
  referrerName: z.string().min(1, 'Name is required').max(120),
  referrerEmail: z.string().email().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function ReferralForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const mutation = useResourceMutation(
    (body: Record<string, unknown>) => http.post<Referral>(endpoints.referrals.create, body),
    {
      invalidate: ['referrals'],
      successMessage: 'Referral created',
      onSuccess: (referral) => navigate(`/referrals/${referral.id}`),
    },
  );

  const onSubmit = (data: FormData) => {
    const body: Record<string, unknown> = { code: data.code, referrerName: data.referrerName };
    if (data.referrerEmail) body.referrerEmail = data.referrerEmail;
    mutation.mutate(body);
  };

  return (
    <AppShell>
      <PageHeader title="New referral" />
      <FormLayout info={FORM_INFO.referral}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Code" htmlFor="code" required hint="4-20 letters or digits" error={errors.code?.message}>
            <TextInput id="code" {...register('code')} aria-invalid={!!errors.code} placeholder="PARTNER2026" />
          </Field>
          <Field label="Referrer name" htmlFor="referrerName" required error={errors.referrerName?.message}>
            <TextInput id="referrerName" {...register('referrerName')} aria-invalid={!!errors.referrerName} placeholder="Jane Partner" />
          </Field>
          <Field label="Referrer email" htmlFor="referrerEmail" error={errors.referrerEmail?.message}>
            <TextInput id="referrerEmail" type="email" {...register('referrerEmail')} placeholder="jane@partner.com" />
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? 'Creating…' : 'Create referral'}
          </button>
          <Link to="/referrals" className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
      </FormLayout>
    </AppShell>
  );
}
