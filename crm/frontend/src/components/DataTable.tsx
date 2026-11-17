import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  isLoading,
  error,
  emptyMessage = 'Nothing here yet.',
}: Props<T>) {
  if (isLoading) return <div className="bg-white rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,.08)]"><Spinner /></div>;
  if (error) return <div className="bg-white rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,.08)]"><ErrorState error={error} /></div>;
  if (!rows || rows.length === 0)
    return <div className="bg-white rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,.08)]"><EmptyState message={emptyMessage} /></div>;

  return (
    <div className="bg-white rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e2e6f0]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`text-left px-5 py-3.5 text-[11px] font-semibold tracking-wide uppercase text-[#9ca3af] whitespace-nowrap ${c.className ?? ''}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-[#eef1f7] last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-[#f7f9fd]' : ''} transition-colors`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3.5 text-[#0f1117] align-middle ${c.className ?? ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
