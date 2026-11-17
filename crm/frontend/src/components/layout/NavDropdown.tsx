import { NavLink, useLocation } from 'react-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { NavItem } from '../../app/navConfig';

export function NavDropdown({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close on route change.
  useEffect(() => setOpen(false), [location.pathname]);

  // Position the portalled menu under the trigger whenever it opens.
  // The menu is portalled to <body> to escape the pill's overflow-x-auto clip.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      setCoords({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const anyActive = items.some((i) => location.pathname.startsWith(i.to));

  return (
    <div className="shrink-0 flex items-center">
      {/* Divider separating the menu trigger from the nav links */}
      <span aria-hidden className="w-px h-5 bg-white/15 mx-1 shrink-0" />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          'flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] lg:px-4 lg:py-2.5 lg:text-sm font-medium whitespace-nowrap transition-all',
          anyActive || open
            ? 'bg-white/20 text-white'
            : 'bg-white/[.06] text-white/90 hover:bg-white/[.14] hover:text-white',
        ].join(' ')}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        More
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, right: coords.right }}
            className="min-w-[180px] bg-[#00308a] rounded-2xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,.28),0_2px_8px_rgba(0,0,0,.16)] z-[300]"
          >
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    'block px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-[#f86223] text-white font-semibold'
                      : 'text-white/75 hover:bg-white/[.12] hover:text-white',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
