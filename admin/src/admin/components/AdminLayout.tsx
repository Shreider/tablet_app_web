import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { adminNavGroups, resolveNavContext, resolvePageTitle } from '../config/adminNavigation';
import { AdminDialog } from './AdminDialog';
import { AdminIcon, type AdminIconName } from './AdminIcon';

const navIcon = (path: string): AdminIconName => {
  if (path === '/dashboard') return 'grid';
  if (path === '/rooms') return 'rooms';
  if (path === '/schedule-entries') return 'calendar';
  if (path === '/conflicts') return 'alert';
  if (path.startsWith('/locations')) return 'layers';
  if (/lecturers|student-groups/.test(path)) return 'users';
  return 'book';
};

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }): JSX.Element {
  const { logout } = useAdminAuth();
  return (
    <div className="admin-navigation-content">
      <nav aria-label="Nawigacja administratora" className="admin-nav">
        {adminNavGroups.map((group) => (
          <section key={group.label} className="admin-nav-group">
            <h2 className="admin-nav-group-title">{group.label}</h2>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `admin-nav-link${isActive ? ' admin-nav-link-active' : ''}`
                }
                onClick={onNavigate}
              >
                <AdminIcon name={navIcon(item.to)} size={19} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </section>
        ))}
      </nav>
      <button type="button" className="admin-btn admin-btn-secondary admin-logout" onClick={logout}>
        <AdminIcon name="logout" /> Wyloguj się
      </button>
    </div>
  );
}

function AdminClock(): JSX.Element {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="admin-clock">
      <time dateTime={now.toISOString()}>
        {now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
      </time>
      <span>
        {now.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </span>
    </div>
  );
}

export function AdminLayout(): JSX.Element {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = resolvePageTitle(location.pathname);
  const context = resolveNavContext(location.pathname);
  const publicAppBaseUrl = (
    import.meta.env.VITE_PUBLIC_APP_BASE_URL || 'http://localhost:5173'
  ).replace(/\/$/, '');

  useEffect(() => {
    document.title = `${pageTitle} · Panel administratora`;
    setMenuOpen(false);
  }, [location.pathname, pageTitle]);

  useEffect(() => {
    const wideScreen = window.matchMedia('(min-width: 1180px)');
    const closeOnDesktop = () => {
      if (wideScreen.matches) setMenuOpen(false);
    };
    wideScreen.addEventListener('change', closeOnDesktop);
    return () => wideScreen.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <div className="admin-shell">
      <a className="admin-skip-link" href="#admin-main">
        Przejdź do treści
      </a>
      <aside className="admin-sidebar" aria-label="Menu główne">
        <Link to="/dashboard" className="admin-brand">
          <span className="admin-brand-icon">
            <AdminIcon name="rooms" size={23} />
          </span>
          <span>
            Panel administratora<small>Sale i plan zajęć</small>
          </span>
        </Link>
        <AdminNavigation />
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-heading">
            <p className="admin-kicker">
              Panel administratora
              {context && context.groupLabel !== 'Start' ? ` / ${context.groupLabel}` : ''}
            </p>
            <h1 className="admin-page-title">{pageTitle}</h1>
          </div>
          <div className="admin-header-actions">
            <AdminClock />
            <a
              href={publicAppBaseUrl}
              className="admin-btn admin-btn-secondary admin-preview"
              target="_blank"
              rel="noreferrer"
            >
              <AdminIcon name="external" />
              <span>Widok sali</span>
            </a>
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-menu-trigger"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <AdminIcon name="menu" />
              <span>Menu</span>
            </button>
          </div>
        </header>
        <main id="admin-main" className="admin-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="admin-footer">
          <span>Panel administratora</span>
          <span>Sale · Harmonogram · Kadra</span>
        </footer>
      </div>
      <AdminDialog
        open={menuOpen}
        title="Menu administratora"
        drawer
        onClose={() => setMenuOpen(false)}
      >
        <AdminNavigation onNavigate={() => setMenuOpen(false)} />
      </AdminDialog>
    </div>
  );
}
