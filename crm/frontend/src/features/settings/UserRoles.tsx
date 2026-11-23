import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CACHE_TTL, QUERY_KEYS } from '@aranax/contracts';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';

interface RoleMetaRow { role: string; label: string; description: string }
interface PermissionEntry { permission: string; granted: boolean }
interface RoleConfig { role: string; permissions: PermissionEntry[] }
interface RbacData { roles: RoleConfig[]; allPermissions: string[]; allRoles: string[] }

function useRoleMeta() {
  return useQuery({
    queryKey: QUERY_KEYS.roleMeta,
    queryFn: () => http.get<RoleMetaRow[]>(endpoints.settings.roles),
    staleTime: CACHE_TTL.list.ms,
  });
}

function useRolePermissions() {
  return useQuery({
    queryKey: QUERY_KEYS.rbacConfigs,
    queryFn: () => http.get<RbacData>(endpoints.settings.rolesPermissions),
    staleTime: CACHE_TTL.list.ms,
  });
}

function PermissionBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color =
    pct === 100 ? '#22c55e' : pct >= 60 ? '#f86223' : pct >= 30 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-[#f0f2f5] overflow-hidden">
        <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full transition-all" />
      </div>
      <span className="text-[11px] text-[#9ca3af] tabular-nums whitespace-nowrap">{count}/{total}</span>
    </div>
  );
}

export default function UserRoles() {
  const { data: roles = [], isLoading: metaLoading } = useRoleMeta();
  const { data: rbac, isLoading: rbacLoading } = useRolePermissions();

  const isLoading = metaLoading || rbacLoading;
  const total = rbac?.allPermissions.length ?? 0;
  const countByRole = Object.fromEntries(
    (rbac?.roles ?? []).map((rc) => [
      rc.role,
      rc.role === 'super_admin' ? total : rc.permissions.filter((p) => p.granted).length,
    ]),
  );

  return (
    <AppShell>
      <PageHeader
        title="User Roles"
        action={
          <Link
            to="/settings/user-roles/new"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#f86223] text-white rounded-full text-[13px] font-bold hover:bg-[#d94f15] transition-all"
          >
            + New User Role
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#6b7280] text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(({ role, label, description }) => {
            const count = countByRole[role] ?? 0;
            const isFixed = role === 'super_admin';

            return (
              <div
                key={role}
                className="bg-white rounded-2xl border border-[#e2e6f0] shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[#0f1117] leading-snug">{label}</p>
                      {isFixed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f0f4ff] text-[#4f46e5]">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#6b7280] mt-1 leading-snug">
                      {description || <span className="italic text-[#c8cfe0]">No description</span>}
                    </p>
                  </div>
                  <Link
                    to={`/settings/user-roles/${role}/edit`}
                    className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold text-[#f86223] border border-[#f86223] hover:bg-[#fff5f1] transition-colors"
                  >
                    Edit
                  </Link>
                </div>
                <div>
                  <p className="font-mono text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide">Permissions</p>
                  <PermissionBar count={count} total={total} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
