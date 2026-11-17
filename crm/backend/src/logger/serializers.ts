import { AppError } from '../errors/app.error.js';
import { sanitizeForLog } from './redaction.js';

export interface SerializedError {
  type: string;
  message: string;
  code?: string;
  statusCode?: number;
  operational?: boolean;
  retryable?: boolean;
  stack?: string;
  cause?: unknown;
}

/**
 * Safe error serialisation. Application errors expose only their stable code and classification.
 * Stack traces appear only when LOG_INCLUDE_STACK is enabled (set via `includeStack`).
 */
export function createErrorSerializer(includeStack: boolean) {
  return function serializeError(err: unknown): SerializedError | unknown {
    if (!(err instanceof Error)) return sanitizeForLog(err);
    const base: SerializedError = {
      type: err.name,
      message: err instanceof AppError ? err.message : safeMessage(err),
    };
    if (err instanceof AppError) {
      base.code = err.code;
      base.statusCode = err.statusCode;
      base.operational = err.operational;
      base.retryable = err.retryable;
    } else {
      const code = (err as NodeJS.ErrnoException).code ?? pgCodeOf(err);
      if (code) base.code = code;
    }
    if (includeStack && err.stack) base.stack = err.stack;
    return base;
  };
}

/** Third-party/HTTP errors: category and status only, never the provider payload. */
export function externalErrorSummary(provider: string, err: unknown): Record<string, unknown> {
  const e = err as { statusCode?: number; status?: number; code?: string; name?: string };
  return {
    provider,
    errorType: e?.name ?? 'Error',
    providerStatus: e?.statusCode ?? e?.status,
    errorCode: e?.code,
  };
}

function safeMessage(err: Error): string {
  // Driver messages may echo SQL fragments or bind values; expose only a generic description.
  if (pgCodeOf(err)) return 'Database operation failed';
  return err.message.length > 300 ? `${err.message.slice(0, 300)}…` : err.message;
}

export function pgCodeOf(err: unknown): string | undefined {
  const direct = (err as { code?: unknown })?.code;
  if (typeof direct === 'string' && /^[0-9A-Z]{5}$/.test(direct)) return direct;
  const nested = (err as { cause?: { code?: unknown } })?.cause?.code;
  if (typeof nested === 'string' && /^[0-9A-Z]{5}$/.test(nested)) return nested;
  return undefined;
}
