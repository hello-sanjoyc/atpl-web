import { describe, expect, it } from 'vitest';
import { parseConfig } from '../../src/config/env.js';

const base = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(40),
};

describe('parseConfig', () => {
  it('accepts blank optional values as unset', () => {
    const config = parseConfig({ ...base, SMTP_HOST: '', SALES_NOTIFICATION_EMAIL: '   ', BOOKING_PROVIDER: 'none' });
    expect(config.SMTP_HOST).toBeUndefined();
    expect(config.SALES_NOTIFICATION_EMAIL).toBeUndefined();
  });

  it('rejects production without log redaction', () => {
    expect(() => parseConfig({ ...base, NODE_ENV: 'production', LOG_REDACTION: 'false', LOG_PRETTY: 'false' })).toThrow(/LOG_REDACTION/);
  });

  it('requires SMTP_FROM when SMTP_HOST is set', () => {
    expect(() => parseConfig({ ...base, SMTP_HOST: 'smtp.example.com' })).toThrow(/SMTP_FROM/);
  });

  it('requires a booking webhook secret when a booking provider is enabled', () => {
    expect(() => parseConfig({ ...base, BOOKING_PROVIDER: 'calendly' })).toThrow(/BOOKING_WEBHOOK_SECRET/);
  });

  it('only accepts UTC as the reporting timezone', () => {
    expect(() => parseConfig({ ...base, REPORTING_TIMEZONE: 'Europe/London' })).toThrow();
  });

  it('parses CORS origins into a list', () => {
    const config = parseConfig({ ...base, CORS_ORIGINS: 'https://a.example, https://b.example' });
    expect(config.corsOrigins).toEqual(['https://a.example', 'https://b.example']);
  });
});
