import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * A filter value backed by a URL query param, so a page's current filter (e.g. ?stage=negotiation)
 * is linkable — the Dashboard deep-links into a list page pre-filtered by stage/status this way.
 * Reads its initial value from the URL on mount; setting it updates the URL in place.
 */
export function useUrlFilter(param: string, defaultValue = ''): [string, (v: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(param) ?? defaultValue;

  const setValue = useCallback(
    (v: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v) next.set(param, v);
          else next.delete(param);
          return next;
        },
        { replace: true },
      );
    },
    [param, setSearchParams],
  );

  return [value, setValue];
}
