import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http, type ListResult } from '../../api/client';

export interface AsyncComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

/**
 * Typeahead search-and-select. By default searches `url?q=...` (debounced, min 3 characters). If
 * `staticOptions` is passed instead, filters that pre-fetched list client-side with no minimum
 * character count or debounce — use this when the candidate list is already small and scoped
 * (e.g. one customer's contracts), where a server round-trip isn't warranted.
 * Stores the picked id while displaying its label; clearing the text clears the id too. Not a
 * react-hook-form `register`-compatible input — wire it up via `Controller` (value = id,
 * onChange = id) and pass the resolved label separately if editing.
 */
export function AsyncCombobox({
  id,
  url,
  value,
  initialLabel,
  onChange,
  placeholder = 'Type to search…',
  minChars = 3,
  mapResult,
  staticOptions,
  disabled,
}: {
  id?: string;
  url?: string;
  /** Currently selected id, or '' for none. */
  value: string;
  /** Label to show for `value` when the form loads with a pre-selected id (e.g. editing). */
  initialLabel?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  minChars?: number;
  /** Maps a raw API row to {id, label, sublabel}. Required unless `staticOptions` is used. */
  mapResult?: (row: unknown) => AsyncComboboxOption;
  /** Pre-fetched candidates to filter client-side instead of querying `url`. */
  staticOptions?: AsyncComboboxOption[];
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(initialLabel ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const trimmed = query.trim();
  const searchEnabled = !staticOptions && trimmed.length >= minChars && query !== selectedLabel;

  const { data, isFetching } = useQuery({
    queryKey: [url, 'combobox-search', debouncedQuery],
    queryFn: () => http.list<unknown>(url!, { q: debouncedQuery.trim(), pageSize: 10 }),
    enabled: searchEnabled,
    placeholderData: (prev) => prev,
  });

  const options: AsyncComboboxOption[] = staticOptions
    ? trimmed.length === 0
      ? staticOptions
      : staticOptions.filter((o) => o.label.toLowerCase().includes(trimmed.toLowerCase()))
    : searchEnabled
      ? ((data as ListResult<unknown> | undefined)?.items ?? []).map(mapResult!)
      : [];

  function pick(option: AsyncComboboxOption) {
    setQuery(option.label);
    setSelectedLabel(option.label);
    setOpen(false);
    onChange(option.id);
  }

  function handleInputChange(v: string) {
    setQuery(v);
    setOpen(true);
    if (v !== selectedLabel) {
      setSelectedLabel('');
      onChange('');
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-2xl bg-[#f7f9fd] border border-[#e2e6f0] text-sm text-[#0f1117] placeholder:text-[#9ca3af] outline-none focus:bg-white focus:border-[#f86223] focus:ring-4 focus:ring-[#f86223]/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      />
      {open && (staticOptions ? query !== selectedLabel : query.trim().length > 0 && query !== selectedLabel) && (
        <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-2xl bg-white border border-[#e2e6f0] shadow-[0_8px_24px_rgba(0,0,0,.12)] py-1.5">
          {!staticOptions && query.trim().length < minChars ? (
            <p className="px-4 py-2.5 text-xs text-[#9ca3af]">Type at least {minChars} characters to search…</p>
          ) : isFetching ? (
            <p className="px-4 py-2.5 text-xs text-[#9ca3af]">Searching…</p>
          ) : options.length === 0 ? (
            <p className="px-4 py-2.5 text-xs text-[#9ca3af]">No matches found.</p>
          ) : (
            options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o)}
                className="w-full text-left px-4 py-2.5 hover:bg-[#f7f9fd] transition-colors"
              >
                <div className="text-sm font-medium text-[#0f1117] truncate">{o.label}</div>
                {o.sublabel && <div className="text-xs text-[#9ca3af] truncate">{o.sublabel}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
