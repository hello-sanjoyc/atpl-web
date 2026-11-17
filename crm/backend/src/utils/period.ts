import { ValidationError } from '../errors/app.error.js';

export interface Period {
  /** Inclusive lower bound (UTC). */
  from: Date;
  /** Exclusive upper bound (UTC). */
  to: Date;
}

export interface PeriodQuery {
  from?: string;
  to?: string;
  year?: number;
  quarter?: 1 | 2 | 3 | 4;
  month?: number;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolves a reporting period. Precedence: explicit from/to, then month (with year), then quarter
 * (with year), then year. Boundaries are UTC midnight, as the reporting timezone is fixed to UTC.
 */
export function resolvePeriod(query: PeriodQuery, now: Date = new Date()): Period {
  if (query.from || query.to) {
    if (!query.from || !query.to || !DATE_ONLY.test(query.from) || !DATE_ONLY.test(query.to)) {
      throw new ValidationError('from and to must both be provided as YYYY-MM-DD.');
    }
    const from = new Date(`${query.from}T00:00:00.000Z`);
    const to = new Date(`${query.to}T00:00:00.000Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      throw new ValidationError('The reporting period is invalid.');
    }
    // "to" is an inclusive calendar date in the API; convert to exclusive bound.
    return { from, to: new Date(to.getTime() + 86_400_000) };
  }
  const year = query.year ?? now.getUTCFullYear();
  if (query.month !== undefined) {
    if (query.month < 1 || query.month > 12) throw new ValidationError('month must be between 1 and 12.');
    return { from: utc(year, query.month - 1, 1), to: utc(year, query.month, 1) };
  }
  if (query.quarter !== undefined) {
    const startMonth = (query.quarter - 1) * 3;
    return { from: utc(year, startMonth, 1), to: utc(year, startMonth + 3, 1) };
  }
  return { from: utc(year, 0, 1), to: utc(year + 1, 0, 1) };
}

function utc(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
