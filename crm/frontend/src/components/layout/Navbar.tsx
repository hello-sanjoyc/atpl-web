import { NavLink, useLocation, useNavigate } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../app/AuthContext';
import { NavDropdown } from './NavDropdown';
import { PRIMARY_NAV, MORE_NAV, SETTINGS_NAV, visibleItems } from '../../app/navConfig';

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const ROLE_LABELS: Record<string, string> = {
  super_admin:        'Super Admin',
  sales_manager:      'Sales Manager',
  sales_executive:    'Sales Executive',
  marketing_manager:  'Marketing Manager',
  finance:            'Finance',
  read_only_analyst:  'Analyst',
};

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const primary = visibleItems(PRIMARY_NAV, user?.role);
  const more = visibleItems(MORE_NAV, user?.role);
  const settings = visibleItems(SETTINGS_NAV, user?.role);
  const allItems = [...primary, ...more];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close the user menu on outside click.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      className={[
        'sticky top-0 z-50 flex justify-center px-6 py-3 transition-all duration-300 max-sm:px-4',
        scrolled ? 'bg-[rgba(220,228,244,0.72)] backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,.06)]' : 'bg-transparent',
      ].join(' ')}
    >
      <div className="flex items-center justify-between w-full max-w-[1360px] gap-2 lg:gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 sm:flex-1 sm:basis-0 lg:min-w-[120px]">
          <span className="flex items-center text-[#f86223]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="currentColor" />
            </svg>
          </span>
          <span className="font-serif text-[18px] font-medium tracking-tight text-[#0f1117] max-[900px]:hidden max-sm:inline">Aranax</span>
        </div>

        {/* Center pill — desktop */}
        <div
          className="flex items-center bg-[#00308a] rounded-full p-1.5 lg:p-2 shadow-[0_4px_24px_rgba(0,0,0,.18),0_1px_4px_rgba(0,0,0,.12)] shrink min-w-0 max-sm:hidden"
          role="navigation"
          aria-label="Main navigation"
        >
          <nav className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {primary.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'flex items-center px-3 py-2 rounded-full text-[13px] lg:px-5 lg:py-2.5 lg:text-sm whitespace-nowrap transition-all shrink-0',
                    isActive
                      ? 'bg-[#f86223] text-white font-semibold'
                      : 'text-white/65 font-normal hover:bg-white/[.10] hover:text-white/90',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
            {more.length > 0 && <NavDropdown items={more} />}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 shrink-0 sm:flex-1 sm:basis-0 lg:min-w-[120px] justify-end max-sm:min-w-0 max-sm:ml-auto">
          <button
            className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-white/60 hover:text-[#0f1117] transition-colors max-sm:hidden"
            aria-label="Notifications"
          >
            <IconBell />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden />
          </button>
          {settings.length > 0 && (
            <button
              onClick={() => navigate('/settings')}
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-white/60 hover:text-[#0f1117] transition-colors max-sm:hidden"
              aria-label="Settings"
              title="Settings"
            >
              <IconSettings />
            </button>
          )}
          <div ref={userMenuRef} className="relative shrink-0">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label={user?.name ?? 'User menu'}
              className="w-8 h-8 rounded-full bg-[#002266] text-white text-xs font-bold flex items-center justify-center hover:ring-2 hover:ring-[#f86223]/40 transition-all"
            >
              {initials}
            </button>
            {userMenuOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+10px)] min-w-[220px] bg-white rounded-2xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,.14),0_2px_8px_rgba(0,0,0,.06)] z-50">
                {/* Profile block */}
                <div className="px-3 py-2.5 border-b border-[#eef1f7] mb-1">
                  <p className="text-[13px] font-semibold text-[#0f1117] truncate">{user?.name}</p>
                  <p className="text-xs text-[#9ca3af] truncate">{user?.email}</p>
                  {user?.role && (
                    <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-[#f0f4ff] font-mono text-[10px] font-medium text-[#00308a] uppercase tracking-wide">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#c62828] hover:bg-[#fce4ec] transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
          {/* Hamburger — mobile only */}
          <button
            className="hidden max-sm:flex w-9 h-9 items-center justify-center bg-[#00308a] rounded-full text-white/80"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <IconMenu />
          </button>
        </div>

      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[300]" role="dialog" aria-modal aria-label="Navigation menu">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[min(280px,85vw)] bg-[#00308a] flex flex-col p-6 gap-2 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-bold text-white">Menu</span>
              <button
                className="w-8 h-8 flex items-center justify-center bg-white/15 rounded-full text-white/90"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <IconClose />
              </button>
            </div>
            {allItems.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'flex items-center px-4 py-3 rounded-xl text-[15px] font-medium transition-colors',
                    isActive
                      ? 'bg-[#f86223] text-white font-bold'
                      : 'text-white/85 hover:bg-white/[.12] hover:text-white',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
            {settings.length > 0 && (
              <>
                <div className="border-t border-white/10 my-2" />
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors',
                      isActive
                        ? 'bg-[#f86223] text-white font-bold'
                        : 'text-white/85 hover:bg-white/[.12] hover:text-white',
                    ].join(' ')
                  }
                >
                  <IconSettings />
                  Settings
                </NavLink>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 mt-auto px-4 py-3 rounded-xl text-[15px] font-medium text-[#ff8a9b] hover:bg-white/[.08] transition-colors"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
