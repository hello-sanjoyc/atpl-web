import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

const base = import.meta.env.VITE_API_BASE_URL ?? '';
const prefix = import.meta.env.VITE_API_PREFIX ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: `${base}${prefix}`,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Envelope types ──────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: { requestId: string; [key: string]: unknown };
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
  meta: { requestId: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiSuccess<T>(r: ApiResponse<T>): r is ApiSuccess<T> {
  return r.success === true;
}

export class ApiResponseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly requestId: string,
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export function unwrap<T>(response: ApiResponse<T>): T {
  if (isApiSuccess(response)) return response.data;
  throw new ApiResponseError(
    response.error.code,
    response.error.message,
    response.meta.requestId,
  );
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResult<T> {
  items: T[];
  pagination: Pagination;
}

/**
 * The backend list envelope is { success, data: [...items], meta: { pagination } }.
 * `data` is the item array and pagination lives in `meta.pagination` — not the
 * nested { items, total } shape. This type captures the raw envelope so `http.list`
 * can normalise it.
 */
interface ListEnvelope<T> {
  success: true;
  data: T[];
  meta: { requestId: string; pagination?: Pagination };
}

// ─── Blob download result ─────────────────────────────────────────────────────

export interface DownloadResult {
  blob: Blob;
  filename: string;
  rowCount: number | null;
  truncated: boolean;
}

// ─── Request options ──────────────────────────────────────────────────────────

type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>;

// ─── Core request wrapper ─────────────────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const response: AxiosResponse<ApiResponse<T>> = await apiClient.request({
    method,
    url,
    data,
    ...options,
  });
  return unwrap(response.data);
}

// ─── Method helpers ───────────────────────────────────────────────────────────

export const http = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', url, undefined, options);
  },

  post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', url, data, options);
  },

  put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', url, data, options);
  },

  patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', url, data, options);
  },

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', url, undefined, options);
  },

  /**
   * GET a paginated list, normalising the backend's
   * { data: [...items], meta: { pagination } } envelope into { items, pagination }.
   */
  async list<T>(
    url: string,
    params?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ListResult<T>> {
    const response: AxiosResponse<ListEnvelope<T> | ApiError> = await apiClient.get(url, {
      ...options,
      params: { ...(options?.params as object), ...params },
    });
    const body = response.data;
    if (!body.success) {
      throw new ApiResponseError(body.error.code, body.error.message, body.meta.requestId);
    }
    return {
      items: body.data,
      pagination: body.meta.pagination ?? {
        page: 1,
        pageSize: body.data.length,
        total: body.data.length,
        totalPages: 1,
      },
    };
  },

  /**
   * Downloads a file as a Blob and surfaces the x-export-row-count /
   * x-export-truncated response headers. Use for CSV export endpoints.
   */
  async download(url: string, options?: RequestOptions): Promise<DownloadResult> {
    const response: AxiosResponse<Blob> = await apiClient.get(url, {
      ...options,
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    const filename = disposition?.match(/filename="?([^";\n]+)"?/)?.[1] ?? 'download';
    const rowCountHeader = response.headers['x-export-row-count'];
    const rowCount = rowCountHeader != null ? Number(rowCountHeader) : null;
    const truncated = response.headers['x-export-truncated'] === 'true';

    return { blob: response.data, filename, rowCount, truncated };
  },
};

// ─── Trigger a browser file download from a Blob ──────────────────────────────

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
