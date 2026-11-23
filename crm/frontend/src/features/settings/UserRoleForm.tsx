import { useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@aranax/contracts';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput } from '../../components/form/fields';
import { useToast } from '../../components/Toast';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';

interface RoleMetaRow { role: string; label: string; description: string }

/** Derive a URL-safe slug from a label: lowercase, spaces→underscore, strip non-alphanumeric. */
function toSlug(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

const roleFormSchema = z.object({
  label: z.string().min(1, 'Label is required').max(80),
  description: z.string().max(400),
});

type FormData = z.infer<typeof roleFormSchema>;

const DEFAULT_LABELS: Record<string, string> = {
  super_admin:        'Super Admin',
  sales_manager:      'Sales Manager',
  sales_executive:    'Sales Executive',
  marketing_manager:  'Marketing Manager',
  finance:            'Finance',
  read_only_analyst:  'Read Only Analyst',
};

export default function UserRoleForm() {
  const { role } = useParams<{ role?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isNew = !role;
  const isSuperAdmin = role === 'super_admin';

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { label: '', description: '' },
  });

  // For the "New" form, show the auto-generated slug preview
  const watchedLabel = watch('label');
  const slugPreview = isNew ? toSlug(watchedLabel) : '';

  const load = useCallback(async () => {
    if (isNew || !role) return;
    try {
      const metaList = await http.get<RoleMetaRow[]>(endpoints.settings.roles);
      const found = metaList.find((m) => m.role === role);
      reset({
        label: found?.label ?? DEFAULT_LABELS[role] ?? role,
        description: found?.description ?? '',
      });
    } catch {
      toast('Failed to load role info', 'error');
    }
  }, [role, isNew, toast, reset]);

  useEffect(() => { void load(); }, [load]);

  async function onSubmit(data: FormData) {
    try {
      if (isNew) {
        const slug = toSlug(data.label);
        if (!slug || slug.length < 2) {
          toast('Label must produce a valid role slug (at least 2 characters)', 'error');
          return;
        }
        await http.post(endpoints.settings.roles, { role: slug, ...data });
        toast('Role created successfully', 'success');
      } else {
        await http.put(endpoints.settings.roleById(role!), data);
        toast('Role info saved', 'success');
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roleMeta });
      navigate('/settings/user-roles');
    } catch (err) {
      console.error('[UserRoleForm] save error', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast(isNew ? `Failed to create role: ${msg}` : `Failed to save: ${msg}`, 'error');
    }
  }

  return (
    <AppShell>
      <PageHeader title={isNew ? 'New User Role' : `Edit Role — ${DEFAULT_LABELS[role!] ?? role}`} />

      <div className="max-w-xl">
        <form
          onSubmit={handleSubmit(onSubmit, (errs) => console.error('[UserRoleForm] validation', errs))}
          noValidate
          className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]"
        >
          <div className="flex flex-col gap-4">
            <Field label="Label" htmlFor="label" required error={errors.label?.message}>
              <TextInput
                id="label"
                {...register('label')}
                placeholder="e.g. Sales Manager"
                disabled={isSuperAdmin}
              />
            </Field>

            {isNew && slugPreview && (
              <div className="flex items-center gap-2 -mt-2">
                <span className="text-[11px] text-[#9ca3af]">Role ID:</span>
                <code className="text-[11px] font-mono bg-[#f7f9fd] border border-[#e2e6f0] rounded-md px-2 py-0.5 text-[#4f46e5]">
                  {slugPreview}
                </code>
              </div>
            )}

            <Field label="Description" htmlFor="description" error={errors.description?.message}>
              <TextInput
                id="description"
                {...register('description')}
                placeholder="Short description of this role's responsibilities"
                disabled={isSuperAdmin}
              />
            </Field>
          </div>

          {isSuperAdmin ? (
            <p className="mt-4 text-[12px] text-[#9ca3af]">System role — label and description cannot be edited.</p>
          ) : (
            <div className="flex items-center gap-3 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (isNew ? 'Creating…' : 'Saving…') : (isNew ? 'Create Role' : 'Save')}
              </button>
              <Link
                to="/settings/user-roles"
                className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors"
              >
                Cancel
              </Link>
            </div>
          )}
        </form>

        {isNew && (
          <p className="mt-3 text-[12px] text-[#9ca3af] px-1">
            The role ID is auto-generated from the label and cannot be changed later.
          </p>
        )}
      </div>
    </AppShell>
  );
}
