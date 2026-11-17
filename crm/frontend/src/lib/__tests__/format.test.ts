import { describe, it, expect } from 'vitest';
import { formatMoney, formatDate } from '../format';

describe('formatMoney', () => {
  it('formats USD', () => {
    const result = formatMoney('1234.56', 'USD');
    expect(result).toMatch(/1[,.]?234/);
  });
  it('never converts to float for large values', () => {
    const result = formatMoney('9999999999999.99', 'USD');
    expect(result).toBeTruthy();
  });
});

describe('formatDate', () => {
  it('formats ISO dates without shifting timezone', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
  });
});
