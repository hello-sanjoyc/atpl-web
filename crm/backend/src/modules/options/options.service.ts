import { ValidationError } from '../../errors/app.error.js';
import type { Database } from '../../db/client.js';
import { listActiveOptions, type OptionRow } from './options.repository.js';

interface OptionsServiceDeps {
  db: Database;
}

export interface OptionItemDto {
  value: string;
  label: string;
}

/** Grouped options keyed by category, e.g. { service_interest: [{value,label}, …], … }. */
export type GroupedOptions = Record<string, OptionItemDto[]>;

/** How long a snapshot is reused before the DB is read again. Keeps GET /options cheap while still
 * reflecting direct DB edits within a minute, with no restart needed. */
const CACHE_TTL_MS = 60_000;

interface Snapshot {
  grouped: GroupedOptions;
  valueSets: Map<string, Set<string>>;
  loadedAt: number;
}

function buildSnapshot(rows: OptionRow[]): Snapshot {
  const grouped: GroupedOptions = {};
  const valueSets = new Map<string, Set<string>>();
  for (const row of rows) {
    (grouped[row.category] ??= []).push({ value: row.value, label: row.label });
    (valueSets.get(row.category) ?? valueSets.set(row.category, new Set()).get(row.category)!).add(row.value);
  }
  return { grouped, valueSets, loadedAt: Date.now() };
}

export interface OptionsService {
  /** All active options grouped by category — the payload for GET /options. */
  getGrouped(): Promise<GroupedOptions>;
  /** True if `value` is an active option in `category`. Empty/undefined is treated as "no value". */
  isValid(category: string, value: string | null | undefined): Promise<boolean>;
  /**
   * Validates several option fields on an input object at once, throwing a ValidationError that
   * names every field whose value is not an active option. `null` clears a field and passes.
   * `fields` maps the input key to its option category, e.g. { serviceInterest: 'service_interest' }.
   */
  validateFields(
    input: Record<string, unknown> | object,
    fields: Record<string, OptionCategory>,
  ): Promise<void>;
  /** Drop the cache so the next read reflects DB changes immediately (used after seeding/tests). */
  invalidate(): void;
}

/** Category keys accepted by the service; kept as a string alias to avoid a circular import. */
export type OptionCategory = string;

export function createOptionsService(deps: OptionsServiceDeps): OptionsService {
  let snapshot: Snapshot | null = null;
  let inflight: Promise<Snapshot> | null = null;

  async function load(): Promise<Snapshot> {
    const rows = await listActiveOptions(deps.db);
    snapshot = buildSnapshot(rows);
    return snapshot;
  }

  async function current(): Promise<Snapshot> {
    if (snapshot && Date.now() - snapshot.loadedAt < CACHE_TTL_MS) return snapshot;
    // Collapse concurrent refreshes into a single DB read.
    inflight ??= load().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  return {
    async getGrouped() {
      return (await current()).grouped;
    },
    async isValid(category, value) {
      if (value === null || value === undefined || value === '') return true;
      const set = (await current()).valueSets.get(category);
      return set?.has(value) ?? false;
    },
    async validateFields(input, fields) {
      const snap = await current();
      const record = input as Record<string, unknown>;
      const issues: { field: string; message: string }[] = [];
      for (const [field, category] of Object.entries(fields)) {
        const value = record[field];
        // Absent (undefined) or cleared (null/'') values are allowed; only present ones are checked.
        if (value === undefined || value === null || value === '') continue;
        if (typeof value !== 'string' || !(snap.valueSets.get(category)?.has(value) ?? false)) {
          issues.push({ field, message: `"${String(value)}" is not a valid ${category} option.` });
        }
      }
      if (issues.length > 0) throw new ValidationError('One or more option fields are invalid.', issues);
    },
    invalidate() {
      snapshot = null;
    },
  };
}
