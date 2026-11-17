import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomUUID } from 'node:crypto';

export interface RequestContext {
  requestId: string;
  correlationId: string;
  userId?: string;
  jobId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Client-supplied IDs are accepted only when they match this shape; they are never trusted for authorisation. */
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export function sanitizeInboundId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return SAFE_ID.test(trimmed) ? trimmed : undefined;
}

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function setContextUser(userId: string): void {
  const ctx = storage.getStore();
  if (ctx) ctx.userId = userId;
}

/** Short, non-reversible fingerprint used where a value must be correlated but not revealed. */
export function fingerprint(value: string): string {
  return createHash('sha256').update(value.toLowerCase()).digest('hex').slice(0, 16);
}
