import type { ReactNode } from 'react';
import { ModernSelect } from './form/ModernSelect';

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl p-2.5 shadow-[0_4px_16px_rgba(0,0,0,.06)]">
      {children}
    </div>
  );
}

const control =
  'px-3.5 py-2 rounded-xl bg-[#f7f9fd] border border-[#e2e6f0] text-[13px] text-[#0f1117] placeholder:text-[#9ca3af] outline-none focus:border-[#f86223] focus:ring-2 focus:ring-[#f86223]/25 transition-colors';

export function FilterSearch({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${control} flex-1 min-w-[160px]`}
    />
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <ModernSelect
      size="sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      placeholder={placeholder}
      className="min-w-[150px]"
    />
  );
}
