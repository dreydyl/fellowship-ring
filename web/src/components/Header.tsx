// Shared site header rendered on every page. Sticky teal bar with the brand
// lockup, desktop nav (active-state driven by useLocation()), a mobile
// hamburger menu, and a sign-out action wired to useAuth().signOut().
// See docs/DESIGN.md section 6 ("Component Library" — Header).

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'History', to: '/entries' },
] as const;

function CrossIcon() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none" aria-hidden="true">
      <rect x="7.5" y="0" width="3" height="22" rx="1.5" fill="white" opacity="0.9" />
      <rect x="0" y="5" width="18" height="3" rx="1.5" fill="white" opacity="0.9" />
    </svg>
  );
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className="relative font-display font-600 text-sm transition-colors duration-150"
      style={{ color: active ? 'white' : 'rgba(255,255,255,0.72)' }}
      onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
        if (!active) e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => {
        if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.72)';
      }}
    >
      {label}
      {active && (
        <span
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-white"
          style={{ opacity: 0.7 }}
        />
      )}
    </Link>
  );
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const accountTo = session ? '/account' : '/login';
  const navItems = [...NAV_ITEMS, { label: 'Account', to: accountTo }];

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  // Outside-click-close: see docs/DESIGN.md section 8
  // ("Pattern: Outside-click close for dropdowns"). The toggle button is
  // excluded from the "outside" check so clicking it doesn't immediately
  // reopen the menu it just closed.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: globalThis.MouseEvent) => {
      const target = e.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        !mobileMenuButtonRef.current?.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    closeMobileMenu();
    await signOut();
    navigate('/login');
  }

  return (
    <header
      className="sticky top-0 z-50 h-14"
      style={{ backgroundColor: 'var(--sg-teal)' }}
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <CrossIcon />
          <span className="font-display font-800 text-base text-white">Solid Ground</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))}
          <button
            type="button"
            onClick={handleSignOut}
            className="font-display font-600 text-sm transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.72)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.72)')}
          >
            Sign out
          </button>
        </nav>

        <button
          type="button"
          ref={mobileMenuButtonRef}
          className="flex flex-col justify-center gap-1.5 sm:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span
            className={`block h-0.5 w-5 rounded bg-white transition-all duration-200 ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
          />
          <span
            className={`block h-0.5 w-5 rounded bg-white transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`block h-0.5 w-5 rounded bg-white transition-all duration-200 ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
          />
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="sm:hidden"
          style={{
            backgroundColor: 'var(--sg-teal-dark)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-1 px-4 py-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={closeMobileMenu}
                className="py-2 font-display font-600 text-sm"
                style={{ color: location.pathname === item.to ? 'white' : 'rgba(255,255,255,0.72)' }}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleSignOut}
              className="py-2 text-left font-display font-600 text-sm"
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
