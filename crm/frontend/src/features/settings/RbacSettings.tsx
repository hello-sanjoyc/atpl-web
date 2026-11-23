import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CACHE_TTL, QUERY_KEYS } from '@aranax/contracts';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../app/AuthContext';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';

interface PermissionEntry { permission: string; granted: boolean }
interface RoleConfig { role: string; permissions: PermissionEntry[] }
interface RoleMetaRow { role: string; label: string; description: string }
interface RbacData { roles: RoleConfig[]; allPermissions: string[]; allRoles: string[] }

interface PendingToggle {
  role: string;
  roleLabel: string;
  permission: string;
  nextGranted: boolean;
}

function groupByModule(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const p of permissions) {
    const prefix = p.includes('.') ? p.split('.')[0]! : 'other';
    (groups[prefix] ??= []).push(p);
  }
  return groups;
}

type AccessLevel = 'Full Access' | 'View Only' | 'No Access';

function getAccessLevel(granted: Set<string>, perms: string[]): AccessLevel {
  if (perms.length === 0) return 'No Access';
  const grantedCount = perms.filter((p) => granted.has(p)).length;
  if (grantedCount === 0) return 'No Access';
  const nonRead = perms.filter((p) => !p.endsWith('.read') && !p.endsWith('.view_all'));
  const grantedNonRead = nonRead.filter((p) => granted.has(p)).length;
  if (nonRead.length > 0 && grantedNonRead > 0) return 'Full Access';
  return 'View Only';
}

function AccessBadge({ level }: { level: AccessLevel }) {
  const styles: Record<AccessLevel, string> = {
    'Full Access': 'bg-[#dcfce7] text-[#15803d]',
    'View Only':   'bg-[#fef9c3] text-[#92400e]',
    'No Access':   'bg-[#f3f4f6] text-[#6b7280]',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${styles[level]}`}>
      {level}
    </span>
  );
}

function ConfirmDialog({ pending, saving, onCancel, onConfirm }: {
  pending: PendingToggle;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <p className="text-[14px] font-semibold text-[#0f1117]">
          {pending.nextGranted ? 'Grant permission?' : 'Revoke permission?'}
        </p>
        <p className="text-[13px] text-[#6b7280] mt-2 leading-snug">
          {pending.nextGranted ? 'Grant' : 'Revoke'} <code className="font-mono text-[12px] bg-[#f7f9fd] border border-[#e2e6f0] rounded px-1.5 py-0.5">{pending.permission}</code> for <strong>{pending.roleLabel}</strong>?
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 rounded-full text-[13px] font-bold text-white bg-[#f86223] hover:bg-[#d94f15] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RbacSettings() {
  const { toast } = useToast();
  const { reloadPermissions } = useAuth();
  const queryClient = useQueryClient();

  const { data: rbac, isLoading: rbacLoading } = useQuery({
    queryKey: QUERY_KEYS.rbacConfigs,
    queryFn: () => http.get<RbacData>(endpoints.settings.rolesPermissions),
    staleTime: CACHE_TTL.list.ms,
  });

  const { data: metaList = [], isLoading: metaLoading } = useQuery({
    queryKey: QUERY_KEYS.roleMeta,
    queryFn: () => http.get<RoleMetaRow[]>(endpoints.settings.roles),
    staleTime: CACHE_TTL.list.ms,
  });

  const [pending, setPending] = useState<PendingToggle | null>(null);
  const [saving, setSaving] = useState(false);

  const loading = rbacLoading || metaLoading;
  const roles = rbac?.roles ?? [];
  const allPermissions = rbac?.allPermissions ?? [];
  const meta = Object.fromEntries(metaList.map((m) => [m.role, m]));
  const modules = groupByModule(allPermissions);
  const moduleNames = Object.keys(modules);

  function requestToggle(role: string, roleLabel: string, permission: string, currentlyGranted: boolean) {
    if (role === 'super_admin') return;
    setPending({ role, roleLabel, permission, nextGranted: !currentlyGranted });
  }

  async function confirmToggle() {
    if (!pending) return;
    setSaving(true);
    try {
      await http.put(endpoints.settings.rolePermissionsById(pending.role), {
        permissions: { [pending.permission]: pending.nextGranted },
      });
      toast(`${pending.nextGranted ? 'Granted' : 'Revoked'} ${pending.permission} for ${pending.roleLabel}`, 'success');
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rbacConfigs });
      await reloadPermissions();
      setPending(null);
    } catch {
      toast(`Failed to update ${pending.permission} for ${pending.roleLabel}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="RBAC Settings" />

      {pending && (
        <ConfirmDialog
          pending={pending}
          saving={saving}
          onCancel={() => setPending(null)}
          onConfirm={() => void confirmToggle()}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#6b7280] text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e2e6f0] bg-white shadow-sm">
          <table className="min-w-max w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#f7f9fd] border-b border-[#e2e6f0]">
                <th className="text-left px-5 py-3.5 font-semibold text-[#0f1117] text-[13px] min-w-[180px]">Role</th>
                {moduleNames.map((mod) => (
                  <th key={mod} className="text-left px-4 py-3.5 font-semibold text-[#0f1117] text-[13px] min-w-[160px] capitalize">
                    {mod.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="text-left px-4 py-3.5 font-semibold text-[#0f1117] text-[13px] min-w-[90px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {roles.map((rc) => {
                const isSuper = rc.role === 'super_admin';
                const roleMeta = meta[rc.role];
                const label = roleMeta?.label ?? rc.role;
                const description = roleMeta?.description ?? '';

                const grantedMap = Object.fromEntries(rc.permissions.map((p) => [p.permission, p.granted]));
                const isGranted = (perm: string) => (isSuper ? true : (grantedMap[perm] ?? false));
                const grantedSet = new Set(allPermissions.filter(isGranted));

                return (
                  <tr key={rc.role} className="hover:bg-[#fafbff] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#0f1117] text-[13px]">{label}</div>
                      {description && (
                        <div className="text-[11px] text-[#9ca3af] mt-0.5 max-w-[200px] leading-snug">{description}</div>
                      )}
                    </td>
                    {moduleNames.map((mod) => (
                      <td key={mod} className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <AccessBadge level={getAccessLevel(grantedSet, modules[mod] ?? [])} />
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(modules[mod] ?? []).map((perm) => {
                              const action = perm.split('.')[1] ?? perm;
                              const granted = isGranted(perm);
                              return (
                                <button
                                  key={perm}
                                  type="button"
                                  title={perm}
                                  disabled={isSuper}
                                  onClick={() => requestToggle(rc.role, label, perm, granted)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono leading-none transition-colors ${
                                    isSuper ? 'cursor-not-allowed' : 'cursor-pointer'
                                  } ${
                                    granted
                                      ? 'bg-[#f0fdf4] text-[#166534] hover:bg-[#dcfce7]'
                                      : 'bg-[#f3f4f6] text-[#9ca3af] line-through hover:bg-[#e5e7eb]'
                                  }`}
                                >
                                  {action}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803d]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block" />
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
