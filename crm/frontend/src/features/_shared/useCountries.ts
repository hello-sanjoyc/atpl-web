import { useQuery } from '@tanstack/react-query';
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

/** Reference data — fetched once and cached for the session. */
export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: () => http.get<Country[]>(endpoints.geo.countries),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
