import { useQuery } from '@tanstack/react-query';
import { CACHE_TTL, QUERY_KEYS } from '@aranax/contracts';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';

export interface Country {
  id: string;
  iso: string;
  iso3: string | null;
  name: string;
  phoneCode: string;
  currency: string | null;
  currencyCode: string | null;
  flag: string | null;
}

/** Reference data — matches backend 24h Redis TTL, then SSE invalidation. */
export function useCountries() {
  return useQuery<Country[]>({
    queryKey: QUERY_KEYS.countries,
    queryFn: () => http.get<Country[]>(endpoints.geo.countries),
    staleTime: CACHE_TTL.static.ms,
    gcTime: CACHE_TTL.static.ms,
  });
}
