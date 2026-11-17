import { describe, expect, it } from 'vitest';
import { sanitizeForLog, maskEmail } from '../../src/logger/redaction.js';
import { sanitizeInboundId, fingerprint, newId } from '../../src/logger/correlation.js';

describe('log redaction', () => {
  it('removes secrets from nested objects', () => {
    const out = JSON.stringify(
      sanitizeForLog({ password: 'hunter2-secret', nested: { authorization: 'Bearer abc.def.ghi', token: 'tok-123' }, safe: 'ok' }),
    );
    expect(out).not.toContain('hunter2-secret');
    expect(out).not.toContain('abc.def.ghi');
    expect(out).not.toContain('tok-123');
    expect(out).toContain('ok');
  });

  it('masks email addresses', () => {
    expect(maskEmail('jane.doe@example.com')).not.toContain('jane.doe');
    expect(maskEmail('jane.doe@example.com')).toContain('@example.com');
  });

  it('produces stable, non-reversible fingerprints', () => {
    expect(fingerprint('A@Example.com')).toBe(fingerprint('a@example.com'));
    expect(fingerprint('a@example.com')).not.toContain('example');
  });
});

describe('correlation identifiers', () => {
  it('accepts well-formed inbound IDs', () => {
    expect(sanitizeInboundId('req-abc12345')).toBe('req-abc12345');
  });

  it('rejects malformed or oversized inbound IDs', () => {
    expect(sanitizeInboundId('short')).toBeUndefined();
    expect(sanitizeInboundId('has spaces and \n newline')).toBeUndefined();
    expect(sanitizeInboundId('x'.repeat(200))).toBeUndefined();
    expect(sanitizeInboundId(['array'])).toBeUndefined();
  });

  it('generates prefixed identifiers', () => {
    expect(newId('req')).toMatch(/^req-[0-9a-f-]{36}$/);
  });
});
