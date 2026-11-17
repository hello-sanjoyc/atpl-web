import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { ModernSelect, type ModernSelectProps } from './ModernSelect';

const base =
  'w-full px-4 py-2.5 rounded-2xl bg-[#f7f9fd] border border-[#e2e6f0] text-sm text-[#0f1117] placeholder:text-[#9ca3af] outline-none focus:bg-white focus:border-[#f86223] focus:ring-4 focus:ring-[#f86223]/25 aria-[invalid=true]:border-[#c62828] aria-[invalid=true]:bg-[#fff5f7] aria-[invalid=true]:focus:border-[#c62828] aria-[invalid=true]:focus:ring-[#c62828]/20 transition-all disabled:opacity-60';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className = '',
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-[#0f1117] mb-1.5">
        {label}
        {required && <span className="text-[#c62828] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#9ca3af]">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-[#c62828]">
          {error}
        </p>
      )}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${base} ${className}`} {...props} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className = '', ...props }, ref) {
    return <textarea ref={ref} className={`${base} min-h-[96px] resize-y ${className}`} {...props} />;
  },
);

export const SelectInput = forwardRef<HTMLSelectElement, ModernSelectProps>(
  function SelectInput(props, ref) {
    return <ModernSelect ref={ref} {...props} />;
  },
);

/** Turns a snake_case / kebab enum value into a readable label. */
export function humanize(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Builds select options from a readonly string-enum array. */
export function enumOptions(values: readonly string[]): { value: string; label: string }[] {
  return values.map((v) => ({ value: v, label: humanize(v) }));
}
