import { useQuery } from '@tanstack/react-query';
import { CACHE_TTL, QUERY_KEYS } from '@aranax/contracts';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';

export interface OptionItem {
  value: string;
  label: string;
}

/** Grouped dropdown options keyed by category, e.g. { service_interest: [...], ... }. */
export type GroupedOptions = Record<string, OptionItem[]>;

/** Categories served by GET /options. */
export type OptionCategory =
  | 'service_interest'
  | 'budget_range'
  | 'timeline'
  | 'capture_channel'
  | 'lead_source'
  | 'opportunity_type'
  | 'contract_kind'
  | 'campaign_channel'
  | 'currency';

const EMPTY: OptionItem[] = [];

/**
 * All app-managed dropdown options, fetched once from the public GET /options and cached for the
 * session (same pattern as useCountries). `optionsFor(category)` returns that group's options, or
 * an empty list until the data loads.
 */
export function useOptions() {
  const query = useQuery<GroupedOptions>({
    queryKey: QUERY_KEYS.options,
    queryFn: () => http.get<GroupedOptions>(endpoints.options),
    staleTime: CACHE_TTL.static.ms,
    gcTime: CACHE_TTL.static.ms,
  });

  const optionsFor = (category: OptionCategory): OptionItem[] => query.data?.[category] ?? EMPTY;

  /** Looks up a value's label within a category (falls back to the raw value). */
  const labelFor = (category: OptionCategory, value: string | null | undefined): string | null => {
    if (!value) return null;
    return optionsFor(category).find((o) => o.value === value)?.label ?? value;
  };

  return { ...query, optionsFor, labelFor };
}
