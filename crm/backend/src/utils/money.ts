import { Decimal } from 'decimal.js';

/**
 * Decimal-safe money handling. Amounts cross the API as strings and are never converted to
 * binary floating point. Precision is high for intermediate arithmetic; output is rounded to cents.
 */
export const MoneyDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type Money = InstanceType<typeof MoneyDecimal>;

export const MONEY_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

export function toMoney(value: string | number | null | undefined): Money {
  if (value === null || value === undefined || value === '') return new MoneyDecimal(0);
  return new MoneyDecimal(value);
}

export function formatMoney(value: Money): string {
  return value.toDecimalPlaces(2).toFixed(2);
}

export function formatRate(value: Money): string {
  return value.toDecimalPlaces(8).toFixed(8);
}

export type MoneyResult =
  | { status: 'ok'; amount: string; currency: string }
  | { status: 'insufficient_data'; reason: string; missingCurrencies?: string[] };

export function moneyOk(value: Money, currency: string): MoneyResult {
  return { status: 'ok', amount: formatMoney(value), currency };
}

export function moneyInsufficient(reason: string, missingCurrencies?: string[]): MoneyResult {
  return missingCurrencies && missingCurrencies.length > 0
    ? { status: 'insufficient_data', reason, missingCurrencies }
    : { status: 'insufficient_data', reason };
}
