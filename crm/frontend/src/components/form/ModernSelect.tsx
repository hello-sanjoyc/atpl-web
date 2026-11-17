import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SelectHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

export interface Option {
  value: string;
  label: string;
}

// Omit the native numeric `size` so we can use it as a visual preset.
type NativeSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>;

export interface ModernSelectProps extends NativeSelectProps {
  options: readonly Option[];
  /** Shown as a leading placeholder entry with an empty value. */
  placeholder?: string;
  /** Visual size preset. `sm` matches the compact filter-bar control. */
  size?: 'md' | 'sm';
  /** Extra classes applied to the trigger button. */
  className?: string;
  /** Show a filter box inside the menu. Defaults to on for longer lists. */
  searchable?: boolean;
  /** Placeholder for the in-menu search box. */
  searchPlaceholder?: string;
}

/** Lists longer than this get a search box by default. */
const SEARCH_THRESHOLD = 7;

const triggerBase =
  'relative w-full flex items-center gap-2 rounded-2xl bg-[#f7f9fd] border border-[#e2e6f0] text-[#0f1117] text-left outline-none cursor-pointer transition-all hover:border-[#cdd4e4] focus-visible:bg-white focus-visible:border-[#f86223] focus-visible:ring-4 focus-visible:ring-[#f86223]/25 disabled:opacity-60 disabled:cursor-not-allowed aria-[invalid=true]:border-[#c62828] aria-[invalid=true]:bg-[#fff5f7]';

const sizeStyles = {
  md: 'px-4 py-2.5 text-sm',
  sm: 'px-3.5 py-2 text-[13px] rounded-xl',
} as const;

const OPEN_STYLE = 'bg-white border-[#f86223] ring-4 ring-[#f86223]/20';

/**
 * A modern, fully-styled select. It renders a real (visually hidden) native
 * <select> that owns the value/name/ref so it drops into react-hook-form
 * `register(...)` and controlled `value`/`onChange` call sites unchanged, with
 * a custom button + portalled listbox layered on top for the look + keyboard UX.
 */
export const ModernSelect = forwardRef<HTMLSelectElement, ModernSelectProps>(
  function ModernSelect(
    {
      options,
      placeholder,
      size = 'md',
      className = '',
      onChange,
      disabled,
      searchable,
      searchPlaceholder = 'Search…',
      ...props
    },
    forwardedRef,
  ) {
    const selectRef = useRef<HTMLSelectElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(forwardedRef, () => selectRef.current as HTMLSelectElement, []);

    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const [activeIndex, setActiveIndex] = useState(-1);
    const [query, setQuery] = useState('');

    const showSearch = searchable ?? options.length > SEARCH_THRESHOLD;

    // The list of selectable rows, including the optional placeholder row.
    const rows = useMemo<Option[]>(
      () => (placeholder ? [{ value: '', label: placeholder }, ...options] : [...options]),
      [options, placeholder],
    );

    // Rows after applying the search query. The placeholder row is hidden while filtering.
    const filteredRows = useMemo<Option[]>(() => {
      const q = query.trim().toLowerCase();
      if (!q) return rows;
      return rows.filter((r) => r.value !== '' && r.label.toLowerCase().includes(q));
    }, [rows, query]);

    // Controlled vs. uncontrolled: mirror the native select's current value.
    const isControlled = props.value !== undefined;
    const [internalValue, setInternalValue] = useState<string>(
      () => (props.defaultValue as string) ?? '',
    );
    const currentValue = isControlled ? (props.value as string) ?? '' : internalValue;

    // In uncontrolled mode the real <select> may be driven externally (e.g.
    // react-hook-form `setValue`, which updates the DOM but not our state).
    // Reading the live native value during render lets the effect below
    // reconcile our mirror whenever it diverges, so the trigger label reflects
    // programmatic changes.
    const nativeValue = selectRef.current?.value;
    useEffect(() => {
      if (isControlled || nativeValue === undefined) return;
      if (nativeValue !== internalValue) setInternalValue(nativeValue);
    }, [isControlled, nativeValue, internalValue]);

    const selected = options.find((o) => o.value === currentValue);
    const displayLabel = selected?.label ?? placeholder ?? '';
    const isPlaceholder = !selected;

    const commit = useCallback(
      (value: string) => {
        const el = selectRef.current;
        if (el) {
          // Drive the real <select> so native change events fire for RHF.
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype,
            'value',
          )?.set;
          setter?.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (!isControlled) setInternalValue(value);
      },
      [isControlled],
    );

    // Position the portalled list under the trigger, matching its width.
    useLayoutEffect(() => {
      if (!open) return;
      const update = () => {
        const r = triggerRef.current?.getBoundingClientRect();
        if (!r) return;
        setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
      };
      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      return () => {
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    }, [open]);

    // Reset the query whenever the menu closes.
    useEffect(() => {
      if (!open) setQuery('');
    }, [open]);

    // When opening, highlight the current selection within the (unfiltered) list.
    useEffect(() => {
      if (!open) return;
      const idx = rows.findIndex((r) => r.value === currentValue);
      setActiveIndex(idx >= 0 ? idx : 0);
    }, [open, rows, currentValue]);

    // As the query narrows the list, keep the highlight on a valid row.
    useEffect(() => {
      if (!open) return;
      setActiveIndex((i) => (i >= filteredRows.length ? Math.max(filteredRows.length - 1, 0) : i));
    }, [open, filteredRows.length]);

    // Keep the active row scrolled into view.
    useEffect(() => {
      if (!open || activeIndex < 0) return;
      const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
      node?.scrollIntoView({ block: 'nearest' });
    }, [open, activeIndex]);

    // Outside click close. The menu ref wraps both the search box and the list.
    useEffect(() => {
      if (!open) return;
      const onDown = (e: MouseEvent) => {
        const t = e.target as Node;
        if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
        setOpen(false);
      };
      document.addEventListener('mousedown', onDown);
      return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    const choose = (value: string) => {
      commit(value);
      setOpen(false);
      triggerRef.current?.focus();
    };

    const onTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          setOpen(true);
          break;
        case 'Escape':
          setOpen(false);
          break;
      }
    };

    const onMenuKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, filteredRows.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(filteredRows.length - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && filteredRows[activeIndex]) choose(filteredRows[activeIndex].value);
          break;
        case ' ':
          // Space selects only when not typing a query (so it can be typed in search).
          if (!showSearch) {
            e.preventDefault();
            if (activeIndex >= 0 && filteredRows[activeIndex]) choose(filteredRows[activeIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        case 'Tab':
          setOpen(false);
          break;
      }
    };

    const invalid = props['aria-invalid'];

    return (
      <div className="relative">
        {/* Real select: owns value/name/ref; kept accessible to the form, hidden visually. */}
        <select
          ref={selectRef}
          onChange={onChange}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={invalid}
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
          className={[triggerBase, sizeStyles[size], open ? OPEN_STYLE : '', className].join(' ')}
        >
          <span className={`flex-1 truncate ${isPlaceholder ? 'text-[#9ca3af]' : ''}`}>
            {displayLabel}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${
              open ? 'rotate-180 text-[#f86223]' : ''
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open &&
          createPortal(
            <div
              ref={menuRef}
              onKeyDown={onMenuKeyDown}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: coords.width,
              }}
              className="z-[400] flex max-h-72 flex-col rounded-2xl border border-[#e2e6f0] bg-white p-1.5 shadow-[0_12px_40px_rgba(16,17,23,.14),0_2px_8px_rgba(16,17,23,.08)] animate-[modernSelectIn_.14s_ease-out]"
            >
              {showSearch && (
                <div className="relative mb-1 shrink-0">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    autoFocus
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className="w-full rounded-xl bg-[#f7f9fd] border border-[#e2e6f0] pl-9 pr-3 py-2 text-sm text-[#0f1117] placeholder:text-[#9ca3af] outline-none focus:bg-white focus:border-[#f86223] focus:ring-2 focus:ring-[#f86223]/25"
                  />
                </div>
              )}

              <div
                ref={(node) => {
                  listRef.current = node;
                  if (!showSearch) node?.focus();
                }}
                role="listbox"
                tabIndex={-1}
                className="-mr-0.5 min-h-0 flex-1 overflow-y-auto pr-0.5 outline-none"
              >
                {filteredRows.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-[#9ca3af]">No matches</div>
                ) : (
                  filteredRows.map((row, i) => {
                    const isSelected = row.value === currentValue;
                    const isActive = i === activeIndex;
                    const isPh = row.value === '' && placeholder;
                    return (
                      <div
                        key={row.value || '__placeholder'}
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => choose(row.value)}
                        className={[
                          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors',
                          isActive ? 'bg-[#f86223]/10' : '',
                          isSelected ? 'font-semibold text-[#0f1117]' : 'text-[#374151]',
                          isPh ? 'text-[#9ca3af]' : '',
                        ].join(' ')}
                      >
                        <span className="flex-1 truncate">{row.label}</span>
                        {isSelected && !isPh && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#f86223"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                            className="shrink-0"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  },
);
