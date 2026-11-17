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
import type { UserRow } from '../_shared/types';
import { ROLES } from '@aranax/contracts';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email(),
  password: z.string().min(12, 'At least 12 characters').max(128),
  role: z.enum(ROLES),
});
type FormData = z.infer<typeof schema>;

export default function UserForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const mutation = useResourceMutation(
    (body: FormData) => http.post<UserRow>(endpoints.users.create, body),
    {
      invalidate: ['users'],
      successMessage: 'User created',
      onSuccess: () => navigate('/users'),
    },
  );

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <AppShell>
      <PageHeader title="New user" />
      <FormLayout info={FORM_INFO.user}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <TextInput id="name" {...register('name')} aria-invalid={!!errors.name} placeholder="Jane Doe" />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <TextInput id="email" type="email" {...register('email')} aria-invalid={!!errors.email} placeholder="jane@company.com" />
          </Field>
          <Field label="Password" htmlFor="password" required hint="At least 12 characters" error={errors.password?.message}>
            <TextInput id="password" type="password" {...register('password')} aria-invalid={!!errors.password} placeholder="••••••••••••" />
          </Field>
          <Field label="Role" htmlFor="role" required error={errors.role?.message}>
            <SelectInput id="role" {...register('role')} options={enumOptions(ROLES)} placeholder="Select a role" />
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? 'Creating…' : 'Create user'}
          </button>
          <Link to="/users" className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
      </FormLayout>
    </AppShell>
  );
}
