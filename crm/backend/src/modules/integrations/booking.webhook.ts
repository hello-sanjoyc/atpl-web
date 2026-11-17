import { createHmac, timingSafeEqual } from 'node:crypto';

export type SignatureVerdict =
  | { ok: true }
  | { ok: false; reason: 'malformed' | 'timestamp' | 'signature' };

export interface VerifyInput {
  secret: string;
  timestampHeader: string | undefined;
  signatureHeader: string | undefined;
  rawBody: Buffer;
  toleranceSeconds: number;
  nowMs: number;
}

/**
 * Verifies `X-Booking-Signature: sha256=<hex>` over `${timestamp}.${rawBody}` and rejects requests
 * outside the tolerance window, which bounds replay of captured deliveries.
 */
export function verifyBookingSignature(input: VerifyInput): SignatureVerdict {
  if (!input.timestampHeader || !input.signatureHeader) return { ok: false, reason: 'malformed' };
  const timestamp = Number(input.timestampHeader);
  if (!Number.isInteger(timestamp)) return { ok: false, reason: 'malformed' };
  if (Math.abs(input.nowMs / 1000 - timestamp) > input.toleranceSeconds) return { ok: false, reason: 'timestamp' };

  const match = /^sha256=([0-9a-f]{64})$/i.exec(input.signatureHeader.trim());
  if (!match?.[1]) return { ok: false, reason: 'malformed' };

  const expected = createHmac('sha256', input.secret).update(`${timestamp}.`).update(input.rawBody).digest();
  const provided = Buffer.from(match[1], 'hex');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: 'signature' };
  }
  return { ok: true };
}

/** Signs a payload the same way the provider does. Used by tests and by operators replaying events. */
export function signBookingPayload(secret: string, timestamp: number, rawBody: Buffer): string {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex')}`;
}
