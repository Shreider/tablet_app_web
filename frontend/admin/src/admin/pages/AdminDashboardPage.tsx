import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminApiError, fetchAdminDashboard } from '../api/adminApi';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  AdminPanel,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  formatDateTime
} from '../components/AdminUi';
import { AdminIcon, type AdminIconName } from '../components/AdminIcon';
import type { AdminDashboardResponse } from '../types';

interface DashboardState {
  loading: boolean;
  error: string | null;
  data: AdminDashboardResponse | null;
}

const initialState: DashboardState = {
  loading: true,
  error: null,
  data: null
};

export function AdminDashboardPage(): JSX.Element {
  const { token } = useAdminAuth();
  const [state, setState] = useState<DashboardState>(initialState);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!token) {
      return;
    }

    const abortController = new AbortController();

    const loadDashboard = async () => {
      setState(initialState);

      try {
        const payload = await fetchAdminDashboard(token);

        if (!abortController.signal.aborted) {
          setState({
            loading: false,
            error: null,
            data: payload
          });
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof AdminApiError ? error.message : 'Nie udało się pobrać podsumowania.';

        setState({
          loading: false,
          error: message,
          data: null
        });
      }
    };

    void loadDashboard();

    return () => {
      abortController.abort();
    };
  }, [token, reloadNonce]);

  if (state.loading) {
    return <LoadingBlock message="Ładowanie panelu głównego…" />;
  }

  if (state.error || !state.data) {
    return (
      <ErrorBlock
        title="Nie udało się załadować podsumowania"
        message={state.error ?? 'Brak danych podsumowania.'}
        onRetry={() => setReloadNonce((prev) => prev + 1)}
      />
    );
  }

  const { stats, conflicts, warnings, recentEntries } = state.data;
  const attention = warnings.filter((warning) => warning.level === 'warning');

  return (
    <div className="admin-dashboard">
      <section className="admin-stat-grid" aria-label="Podsumowanie">
        <DashboardStatCard label="Sale" value={stats.rooms} to="/rooms" />
        <DashboardStatCard
          label="Wpisy w planie"
          value={stats.scheduleEntries}
          to="/schedule-entries"
        />
        <DashboardStatCard label="Zajęcia dzisiaj" value={stats.todayEntries} />
        <DashboardStatCard
          label="Sale bez zajęć"
          value={stats.roomsWithoutEntries}
          tone={stats.roomsWithoutEntries ? 'warning' : undefined}
        />
        <DashboardStatCard
          label="Konflikty czasowe"
          value={stats.overlappingEntries}
          tone={stats.overlappingEntries ? 'critical' : undefined}
          to="/conflicts"
        />
      </section>

      <div className="admin-dashboard-columns">
        <AdminPanel title="Zarządzanie" subtitle="Wybierz obszar, nad którym chcesz pracować.">
          <div className="admin-quick-links">
            <QuickLinkCard
              title="Harmonogram"
              text="Terminy i przebieg zajęć"
              to="/schedule-entries"
              icon="calendar"
            />
            <QuickLinkCard
              title="Sale"
              text="Pomieszczenia i lokalizacja"
              to="/rooms"
              icon="rooms"
            />
            <QuickLinkCard
              title="Kadra"
              text="Prowadzący, grupy i przedmioty"
              to="/teaching/lecturers"
              icon="users"
            />
            <QuickLinkCard
              title="Lokalizacje"
              text="Piętra i przypisanie sal"
              to="/locations/floors"
              icon="layers"
            />
          </div>
        </AdminPanel>
        <AdminPanel title="Do sprawdzenia" subtitle="Konflikty terminów i brakujące dane.">
          <div className="grid gap-3">
            {attention.length === 0 && conflicts.length === 0 ? (
              <div className="admin-notice admin-notice--ok">
                Plan bez wykrytych konfliktów. Nie ma ostrzeżeń wymagających uwagi.
              </div>
            ) : (
              <>
                {attention.map((warning) => (
                  <p key={warning.code} className="admin-notice admin-notice--warning">
                    {warning.message}
                  </p>
                ))}
                {conflicts.length > 0 && (
                  <div className="admin-notice admin-notice--error">
                    <p className="mb-3">
                      Nakładające się terminy zajęć: <strong>{conflicts.length}</strong>. Sprawdź
                      wpisy i popraw godziny lub przypisanie sali.
                    </p>
                    <Link to="/conflicts" className="admin-btn admin-btn-secondary">
                      Sprawdź konflikty <AdminIcon name="right" size={17} />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel
        title="Ostatnio dodane zajęcia"
        subtitle="Najnowsze wpisy w harmonogramie."
        actions={
          <Link to="/schedule-entries" className="admin-btn admin-btn-secondary">
            Cały harmonogram <AdminIcon name="right" size={17} />
          </Link>
        }
      >
        {recentEntries.length === 0 ? (
          <EmptyBlock message="Nie ma jeszcze wpisów. Przejdź do harmonogramu, aby dodać pierwsze zajęcia." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table" aria-label="Ostatnio dodane zajęcia">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Sala</th>
                  <th scope="col">Tytuł</th>
                  <th scope="col">Utworzono</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="Data">{entry.eventDate}</td>
                    <td data-label="Sala">{entry.roomCode}</td>
                    <td data-label="Tytuł">{entry.title}</td>
                    <td data-label="Utworzono">{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function DashboardStatCard({
  label,
  value,
  tone,
  to
}: {
  label: string;
  value: number;
  tone?: 'warning' | 'critical';
  to?: string;
}): JSX.Element {
  const className = `admin-stat${tone ? ` admin-stat--${tone}` : ''}`;
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
    </>
  );
  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}

function QuickLinkCard({
  title,
  text,
  to,
  icon
}: {
  title: string;
  text: string;
  to: string;
  icon: AdminIconName;
}): JSX.Element {
  return (
    <Link to={to} className="admin-quick-link">
      <AdminIcon name={icon} size={24} />
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </Link>
  );
}
