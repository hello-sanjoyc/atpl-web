import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyBookingSignature, signBookingPayload } from '../../src/modules/integrations/booking.webhook.js';
import { hashPassword, verifyPassword } from '../../src/utils/password.js';
import { stableStringify } from '../../src/utils/hash.js';
import { toCsv } from '../../src/utils/csv.js';
import { backoffMs } from '../../src/jobs/queues/outbox.repository.js';

const SECRET = 'booking-secret-0123456789abcdefghij';

describe('booking webhook signature', () => {
  const body = Buffer.from('{"event":"booking.created"}');
  const now = Date.UTC(2026, 5, 15, 10, 0, 0);
  const ts = Math.floor(now / 1000);

  it('accepts a correctly signed, fresh delivery', () => {
    const verdict = verifyBookingSignature({
      secret: SECRET,
      timestampHeader: String(ts),
      signatureHeader: signBookingPayload(SECRET, ts, body),
      rawBody: body,
      toleranceSeconds: 300,
      nowMs: now,
    });
    expect(verdict).toEqual({ ok: true });
  });

  it('rejects a tampered body', () => {
    const verdict = verifyBookingSignature({
      secret: SECRET,
      timestampHeader: String(ts),
      signatureHeader: signBookingPayload(SECRET, ts, body),
      rawBody: Buffer.from('{"event":"booking.cancelled"}'),
      toleranceSeconds: 300,
      nowMs: now,
    });
    expect(verdict).toEqual({ ok: false, reason: 'signature' });
  });

  it('rejects a replayed delivery outside the tolerance window', () => {
    const verdict = verifyBookingSignature({
      secret: SECRET,
      timestampHeader: String(ts - 3600),
      signatureHeader: signBookingPayload(SECRET, ts - 3600, body),
      rawBody: body,
      toleranceSeconds: 300,
      nowMs: now,
    });
    expect(verdict).toEqual({ ok: false, reason: 'timestamp' });
  });

  it('rejects a signature made with another secret', () => {
    const forged = `sha256=${createHmac('sha256', 'wrong-secret-0123456789abcdefghijkl').update(`${ts}.`).update(body).digest('hex')}`;
    expect(
      verifyBookingSignature({ secret: SECRET, timestampHeader: String(ts), signatureHeader: forged, rawBody: body, toleranceSeconds: 300, nowMs: now }),
    ).toEqual({ ok: false, reason: 'signature' });
  });

  it('rejects malformed headers', () => {
    expect(
      verifyBookingSignature({ secret: SECRET, timestampHeader: undefined, signatureHeader: undefined, rawBody: body, toleranceSeconds: 300, nowMs: now }).ok,
    ).toBe(false);
  });
});

describe('password hashing', () => {
  it('verifies the correct password and rejects others', async () => {
    const stored = await hashPassword('correct-horse-battery');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('correct-horse-battery', stored)).toBe(true);
    expect(await verifyPassword('wrong-password', stored)).toBe(false);
  });

  it('salts each hash differently', async () => {
    expect(await hashPassword('same-password-value')).not.toBe(await hashPassword('same-password-value'));
  });
});

describe('stableStringify', () => {
  it('ignores key order so equal payloads hash identically', () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 2 }, b: 1 }));
  });
});

describe('csv export', () => {
  it('quotes cells containing delimiters and quotes', () => {
    expect(toCsv(['a'], [['x,"y"']])).toBe('a\r\n"x,""y"""\r\n');
  });

  it('neutralises spreadsheet formula injection', () => {
    expect(toCsv(['a'], [['=HYPERLINK("http://evil")']])).toContain("'=HYPERLINK");
  });
});

describe('outbox backoff', () => {
  it('doubles from 30 seconds and caps at one hour', () => {
    expect(backoffMs(1)).toBe(30_000);
    expect(backoffMs(2)).toBe(60_000);
    expect(backoffMs(20)).toBe(3_600_000);
  });
});
