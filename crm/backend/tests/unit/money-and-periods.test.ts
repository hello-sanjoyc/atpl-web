import { describe, expect, it } from 'vitest';
import { formatMoney, toMoney, MONEY_PATTERN, moneyInsufficient, moneyOk } from '../../src/utils/money.js';
import { resolvePeriod, toIsoDate } from '../../src/utils/period.js';
import { ValidationError } from '../../src/errors/app.error.js';

describe('money', () => {
  it('adds binary-float-problematic amounts exactly', () => {
    expect(formatMoney(toMoney('0.1').plus(toMoney('0.2')))).toBe('0.30');
  });

  it('rounds half up to cents', () => {
    expect(formatMoney(toMoney('2.345'))).toBe('2.35');
    expect(formatMoney(toMoney('2.344'))).toBe('2.34');
  });

  it('validates the wire format', () => {
    expect(MONEY_PATTERN.test('1200.50')).toBe(true);
    expect(MONEY_PATTERN.test('1.234')).toBe(false);
    expect(MONEY_PATTERN.test('-5')).toBe(false);
  });

  it('expresses missing data explicitly instead of zero', () => {
    expect(moneyInsufficient('No rate', ['EUR'])).toEqual({ status: 'insufficient_data', reason: 'No rate', missingCurrencies: ['EUR'] });
    expect(moneyOk(toMoney('10'), 'USD')).toEqual({ status: 'ok', amount: '10.00', currency: 'USD' });
  });
});

describe('resolvePeriod', () => {
  const now = new Date('2026-06-15T10:00:00.000Z');

  it('resolves a quarter to UTC month boundaries', () => {
    const period = resolvePeriod({ year: 2026, quarter: 2 }, now);
    expect(toIsoDate(period.from)).toBe('2026-04-01');
    expect(toIsoDate(period.to)).toBe('2026-07-01');
  });

  it('treats the to date as inclusive', () => {
    const period = resolvePeriod({ from: '2026-01-01', to: '2026-01-31' }, now);
    expect(toIsoDate(period.to)).toBe('2026-02-01');
  });

  it('defaults to the current year', () => {
    expect(toIsoDate(resolvePeriod({}, now).from)).toBe('2026-01-01');
  });

  it('rejects inverted ranges and bad months', () => {
    expect(() => resolvePeriod({ from: '2026-02-01', to: '2026-01-01' }, now)).toThrow(ValidationError);
    expect(() => resolvePeriod({ month: 13, year: 2026 }, now)).toThrow(ValidationError);
  });
});
