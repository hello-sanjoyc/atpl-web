import { forwardRef, useMemo } from 'react';
import { useCountries } from '../../features/_shared/useCountries';
import { ModernSelect, type ModernSelectProps } from './ModernSelect';

type CountrySelectProps = Omit<ModernSelectProps, 'options' | 'placeholder'>;

/**
 * Country dropdown backed by GET /countries. Submits the 2-letter ISO code (what the backend
 * expects). Works with react-hook-form `register` (forwarded ref) and as a controlled input.
 */
export const CountrySelect = forwardRef<HTMLSelectElement, CountrySelectProps>(
  function CountrySelect({ disabled, ...props }, ref) {
    const { data: countries, isLoading } = useCountries();

    const options = useMemo(
      () =>
        (countries ?? []).map((c) => ({
          value: c.iso,
          label: `${c.flag ? `${c.flag}  ` : ''}${toTitle(c.name)}`,
        })),
      [countries],
    );

    return (
      <ModernSelect
        ref={ref}
        options={options}
        placeholder={isLoading ? 'Loading countries…' : 'Select country'}
        disabled={isLoading || disabled}
        {...props}
      />
    );
  },
);

// Source names are UPPERCASE; present them title-cased.
function toTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase())
    .replace(/\b(Of|And|The)\b/g, (w) => w.toLowerCase());
}
