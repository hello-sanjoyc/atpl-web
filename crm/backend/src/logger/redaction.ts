const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|cookie|api[-_]?key|credential|jwt|signature|private[-_]?key|set-cookie/i;

const MAX_DEPTH = 6;
const MAX_STRING = 500;

/**
 * Deep sanitiser for arbitrary payloads (provider responses, request fragments, error metadata).
 * Sensitive keys are replaced wholesale; long strings are truncated so that bodies cannot be dumped.
 */
export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…[truncated]` : value;
  }
  if (typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[MaxDepth]';
  if (value instanceof Error) {
    return { name: value.name, code: (value as NodeJS.ErrnoException).code };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeForLog(item, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitizeForLog(child, depth + 1);
  }
  return out;
}

/** Masks an email for logs: "jane.doe@acme.com" -> "j***@acme.com". */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '[invalid-email]';
  return `${email[0]}***${email.slice(at)}`;
}
