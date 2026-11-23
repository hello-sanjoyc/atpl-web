import type { Pagination } from '../api/client';
import { ModernSelect } from './form/ModernSelect';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const;

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function Pager({
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  /** Omit to hide the page-size selector (e.g. when a page doesn't support it). */
  onPageSizeChange?: (pageSize: number) => void;
}) {
  if (pagination.totalPages <= 1 && !onPageSizeChange) return null;

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="flex items-center justify-between gap-4 mt-4 px-5 py-3.5 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,.06)] flex-wrap">
      <span className="text-[13px] text-[#0f1a3d]">
        Showing {from}-{to} of {pagination.total}
      </span>

      <div className="flex items-center gap-5 flex-wrap">
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-[13px] text-[#6b7280]">
            Rows
            <ModernSelect
              size="sm"
              value={String(pagination.pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
              searchable={false}
              className="min-w-[88px]"
            />
          </div>
        )}

        <span className="text-[13px] text-[#6b7280]">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              aria-label="Previous page"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#e2e6f0] text-[#6b7280] hover:border-[#0f1117] hover:text-[#0f1117] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <IconChevronLeft />
            </button>
            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page >= pagination.totalPages}
              aria-label="Next page"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#e2e6f0] text-[#6b7280] hover:border-[#0f1117] hover:text-[#0f1117] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <IconChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
