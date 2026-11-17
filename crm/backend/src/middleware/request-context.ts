import type { IncomingMessage } from 'node:http';
import { newId, sanitizeInboundId } from '../logger/correlation.js';

const correlationByRequest = new WeakMap<IncomingMessage, string>();

/**
 * Resolves request identifiers. Client-supplied values are validated and used only for tracing;
 * an invalid or absent value is replaced by a server-generated identifier.
 */
export function resolveRequestId(raw: IncomingMessage): string {
  const requestId = sanitizeInboundId(raw.headers['x-request-id']) ?? newId('req');
  const correlationId = sanitizeInboundId(raw.headers['x-correlation-id']) ?? requestId;
  correlationByRequest.set(raw, correlationId);
  return requestId;
}

export function correlationFor(raw: IncomingMessage): string {
  return correlationByRequest.get(raw) ?? newId('cor');
}
