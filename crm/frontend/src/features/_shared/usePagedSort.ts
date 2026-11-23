import { useState } from 'react';

/**
 * Shared page/pageSize/sort/order state for list pages. Changing any filter, sort, or page size
 * resets back to page 1 (via the returned `reset` wrapper), matching the Pager/SortControl
 * convention used across all list pages.
 */
export function usePagedSort(defaultSort: string, defaultOrder: 'asc' | 'desc' = 'asc', defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sort, setSort] = useState(defaultSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(defaultOrder);

  function reset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return {
    page,
    pageSize,
    sort,
    order,
    setPage,
    setPageSize: reset(setPageSize),
    setSort: reset(setSort),
    setOrder: reset(setOrder),
    reset,
  };
}
