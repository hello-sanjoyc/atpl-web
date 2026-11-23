import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput, SelectInput, enumOptions } from '../../components/form/fields';
import { useResourceDetail, useResourceMutation } from '../_shared/hooks';
import { FormLayout } from '../../components/form/FormAside';
import { FORM_INFO } from '../_shared/formInfo';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { UserRow } from '../_shared/types';
import { ROLES } from '@aranax/contracts';

// Create schema (password required)
const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email(),
  phone: z.string().max(30).nullable().optional(),
  password: z.string().min(12, 'At least 12 characters').max(128),
  role: z.enum(ROLES),
});

// Edit schema (password omitted — backend supports partial updates)
const editSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email(),
  phone: z.string().max(30).nullable().optional(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
});

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  // Load existing user when editing
  const { data: existing } = useResourceDetail<UserRow>(
    ['users', id],
    isEdit ? endpoints.users.byId(id!) : null,
  );

  // Create form
  const createForm = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    mode: 'onChange',
  });

  // Edit form
  const editForm = useForm<EditData>({
    resolver: zodResolver(editSchema),
    mode: 'onChange',
  });

  // Populate edit form once data loads
  useEffect(() => {
    if (existing) {
      editForm.reset({ name: existing.name, email: existing.email, phone: existing.phone ?? '', role: existing.role as typeof ROLES[number], isActive: existing.isActive });
    }
  }, [existing, editForm]);

  const createMutation = useResourceMutation(
    (body: CreateData) => http.post<UserRow>(endpoints.users.create, body),
    { invalidate: ['users'], successMessage: 'User created', onSuccess: () => navigate('/users') },
  );

  const editMutation = useResourceMutation(
    (body: EditData) => http.patch<UserRow>(endpoints.users.update(id!), body),
    { invalidate: ['users', id], successMessage: 'User updated', onSuccess: () => navigate(`/users/${id}`) },
  );

  if (isEdit) {
    const { register, handleSubmit, formState: { errors, isValid } } = editForm;
    return (
      <AppShell>
        <PageHeader
          title="Edit user"
        />
        <FormLayout info={FORM_INFO.user}>
          <form onSubmit={handleSubmit((d) => editMutation.mutate(d))} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name" htmlFor="name" required error={errors.name?.message}>
                <TextInput id="name" {...register('name')} aria-invalid={!!errors.name} placeholder="Jane Doe" />
              </Field>
              <Field label="Email" htmlFor="email" required error={errors.email?.message}>
                <TextInput id="email" type="email" {...register('email')} aria-invalid={!!errors.email} placeholder="jane@company.com" />
              </Field>
              <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
                <TextInput id="phone" type="tel" {...register('phone')} placeholder="+1 555 000 0000" />
              </Field>
              <Field label="Role" htmlFor="role" required error={errors.role?.message}>
                <SelectInput id="role" {...register('role')} options={enumOptions(ROLES)} placeholder="Select a role" />
              </Field>
              <Field label="Status" htmlFor="isActive" error={errors.isActive?.message}>
                <SelectInput
                  id="isActive"
                  {...register('isActive', { setValueAs: (v) => v === 'true' || v === true })}
                  options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
                />
              </Field>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                type="submit"
                disabled={!isValid || editMutation.isPending}
                className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {editMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <Link to={`/users/${id}`} className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        </FormLayout>
      </AppShell>
    );
  }

  // Create mode
  const { register, handleSubmit, formState: { errors, isValid } } = createForm;
  return (
    <AppShell>
      <PageHeader title="New user" />
      <FormLayout info={FORM_INFO.user}>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} noValidate className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" htmlFor="name" required error={errors.name?.message}>
              <TextInput id="name" {...register('name')} aria-invalid={!!errors.name} placeholder="Jane Doe" />
            </Field>
            <Field label="Email" htmlFor="email" required error={errors.email?.message}>
              <TextInput id="email" type="email" {...register('email')} aria-invalid={!!errors.email} placeholder="jane@company.com" />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <TextInput id="phone" type="tel" {...register('phone')} placeholder="+1 555 000 0000" />
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
              disabled={!isValid || createMutation.isPending}
              className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {createMutation.isPending ? 'Creating…' : 'Create user'}
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
