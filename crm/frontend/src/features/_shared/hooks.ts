import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http, type ListResult } from '../../api/client';
import { useToast } from '../../components/Toast';

/** Fetch a paginated list with query params. */
export function useResourceList<T>(
  key: readonly unknown[],
  url: string,
  params?: Record<string, unknown>,
) {
  return useQuery<ListResult<T>>({
    queryKey: [...key, params],
    queryFn: () => http.list<T>(url, params),
    placeholderData: (prev) => prev,
  });
}

/** Fetch a single resource by URL. */
export function useResourceDetail<T>(key: readonly unknown[], url: string | null) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => http.get<T>(url as string),
    enabled: url != null,
  });
}

/**
 * Create/update mutation that toasts on success/error and invalidates the
 * given list key so tables refresh.
 */
export function useResourceMutation<TInput, TResult = unknown>(
  fn: (input: TInput) => Promise<TResult>,
  opts: {
    invalidate?: readonly unknown[];
    successMessage?: string;
    onSuccess?: (result: TResult) => void;
  } = {},
) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result) => {
      if (opts.invalidate) qc.invalidateQueries({ queryKey: opts.invalidate });
      if (opts.successMessage) toast(opts.successMessage, 'success');
      opts.onSuccess?.(result);
    },
    onError: (err: unknown) => {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    },
  });
}
