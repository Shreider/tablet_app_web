import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/rooms', label: 'Sale' },
  { to: '/schedule-entries', label: 'Harmonogram' }
];

const resolvePageTitle = (pathname: string): string => {
  if (pathname.startsWith('/rooms')) {
    return 'Zarzadzanie salami';
  }

  if (pathname.startsWith('/schedule-entries')) {
    return 'Zarzadzanie harmonogramem';
  }

  return 'Dashboard administracyjny';
};

export function AdminLayout(): JSX.Element {
  const location = useLocation();
  const { logout } = useAdminAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const publicAppBaseUrl = import.meta.env.VITE_PUBLIC_APP_BASE_URL || 'http://localhost:5173';

  const pageTitle = useMemo(() => resolvePageTitle(location.pathname), [location.pathname]);

  return (
    <div className="admin-shell min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-[1700px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`admin-sidebar ${mobileNavOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} lg:translate-x-0 lg:opacity-100`}
          aria-label="Nawigacja panelu admin"
        >
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="admin-logo">
              <span className="admin-logo-dot" aria-hidden="true" />
              Room Tablet Admin
            </Link>
            <button
              type="button"
              className="admin-icon-btn lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Zamknij menu"
            >
              ×
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  isActive ? 'admin-nav-link admin-nav-link-active' : 'admin-nav-link'
                }
                onClick={() => setMobileNavOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-[#2d3f5b] bg-[#101a2a] p-4">
            <p className="m-0 text-xs uppercase tracking-[0.12em] text-[#8ca0c4]">Bezpieczenstwo</p>
            <p className="mt-2 text-sm text-[#bfd0ec]">
              Endpointy admina wymagaja tokenu i dzialaja na realnej bazie projektu.
            </p>
            <button
              type="button"
              className="admin-btn admin-btn-secondary mt-3 w-full"
              onClick={logout}
            >
              Wyloguj
            </button>
          </div>
        </aside>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-[#050810]/70 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Zamknij menu"
          />
        ) : null}

        <div className="relative z-10 flex min-h-screen flex-col px-4 pb-6 pt-4 md:px-6 lg:px-8 lg:py-6">
          <header className="admin-topbar">
            <div>
              <p className="admin-kicker">Panel administratora</p>
              <h1 className="admin-page-title">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`${publicAppBaseUrl}/room/30`}
                className="admin-btn admin-btn-secondary"
                target="_blank"
                rel="noreferrer"
              >
                Podglad sali
              </a>
              <button
                type="button"
                className="admin-icon-btn lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Otworz menu"
              >
                ☰
              </button>
            </div>
          </header>

          <main className="mt-5 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
