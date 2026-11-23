import { useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar, FilterSelect } from '../../components/FilterBar';
import { Badge } from '../../components/Badge';
import { Pager } from '../../components/Pager';
import { SortControl } from '../../components/SortControl';
import { useResourceList, useResourceMutation } from '../_shared/hooks';
import { usePagedSort } from '../_shared/usePagedSort';
import { enumOptions, humanize } from '../../components/form/fields';
import { formatDate } from '../../lib/format';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { UserRow } from '../_shared/types';
import { ROLES } from '@aranax/contracts';

const roleOptions = enumOptions(ROLES);
const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created' },
];

export default function Users() {
  const [role, setRole] = useState('');
  const { page, pageSize, sort, order, setPage, setPageSize, setSort, setOrder, reset } = usePagedSort('name', 'asc');

  const params: Record<string, unknown> = { page, pageSize, sort, order };
  if (role) params.role = role;

  const { data, isLoading, error } = useResourceList<UserRow>(['users'], endpoints.users.list, params);

  const toggleActive = useResourceMutation(
    (input: { id: string; isActive: boolean }) => http.patch(endpoints.users.update(input.id), { isActive: input.isActive }),
    { invalidate: ['users'], successMessage: 'User updated' },
  );

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <Link to={`/users/${u.id}`} className="min-w-0 group block">
          <div className="font-medium truncate text-[#0f1117] group-hover:text-[#f86223] transition-colors">{u.name}</div>
          <div className="text-xs text-[#9ca3af] truncate">{u.email}</div>
          {u.phone && <div className="text-xs text-[#9ca3af] truncate">{u.phone}</div>}
        </Link>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <Badge value={u.role} tone="purple" label={humanize(u.role)} /> },
    {
      key: 'isActive',
      header: 'Status',
      render: (u) => (
        <Badge value={u.isActive ? 'active' : 'inactive'} tone={u.isActive ? 'green' : 'neutral'} label={u.isActive ? 'Active' : 'Inactive'} />
      ),
    },
    { key: 'createdAt', header: 'Created', render: (u) => <span className="text-[#6b7280]">{formatDate(u.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <button
          onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
          disabled={toggleActive.isPending}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors disabled:opacity-50 ${
            u.isActive
              ? 'bg-[#fce4ec] text-[#c62828] hover:bg-[#f8d0dc]'
              : 'bg-[#e8f5e9] text-[#2e7d32] hover:bg-[#d4edd6]'
          }`}
        >
          {u.isActive ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Users"
        subtitle={data ? `${data.pagination.total} total` : undefined}
        action={{ label: 'New user', to: '/users/new' }}
      >
        <FilterBar>
          <FilterSelect value={role} onChange={reset(setRole)} options={roleOptions} placeholder="All roles" />
          <SortControl sort={sort} order={order} onSortChange={setSort} onOrderChange={setOrder} options={sortOptions} />
        </FilterBar>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No users match these filters."
      />
      {data && <Pager pagination={data.pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </AppShell>
  );
}
