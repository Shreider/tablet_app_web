import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminApiError, fetchAdminDashboard } from '../api/adminApi';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { AdminPanel, ErrorBlock, LoadingBlock, StatusBadge, formatDateTime } from '../components/AdminUi';
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
          error instanceof AdminApiError ? error.message : 'Nie udalo sie pobrac danych dashboardu.';

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
    return <LoadingBlock message="Ladowanie dashboardu admina..." />;
  }

  if (state.error || !state.data) {
    return (
      <ErrorBlock
        title="Blad dashboardu"
        message={state.error ?? 'Brak danych dashboardu.'}
        onRetry={() => setReloadNonce((prev) => prev + 1)}
      />
    );
  }

  const { stats, warnings, recentRooms, recentEntries } = state.data;

  return (
    <div className="grid gap-4 lg:gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard label="Sale" value={stats.rooms} tone="info" />
        <DashboardStatCard label="Wpisy harmonogramu" value={stats.scheduleEntries} tone="ok" />
        <DashboardStatCard label="Dzisiaj" value={stats.todayEntries} tone="info" />
        <DashboardStatCard label="Sale bez wpisow" value={stats.roomsWithoutEntries} tone="warn" />
        <DashboardStatCard label="Konflikty czasowe" value={stats.overlappingEntries} tone="critical" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_minmax(0,1fr)]">
        <AdminPanel
          title="Szybkie akcje"
          subtitle="Przejscia do sekcji CRUD"
          actions={<span className="text-xs text-[#8ca0c4]">Live DB</span>}
        >
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <QuickLinkCard
              title="Zarzadzaj salami"
              text="Dodawaj, edytuj i usuwaj sale wraz z kontrola powiazan."
              to="/rooms"
            />
            <QuickLinkCard
              title="Zarzadzaj harmonogramem"
              text="Pelny CRUD wpisow zajec, relacje i filtrowanie po datach."
              to="/schedule-entries"
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Ostrzezenia danych" subtitle="Sygnaly integralnosci bazy">
          <div className="space-y-2 py-1">
            {warnings.length === 0 ? (
              <p className="m-0 rounded-xl border border-[#264435] bg-[#0f251c] px-3 py-2 text-sm text-[#a5e8c4]">
                Brak krytycznych problemow.
              </p>
            ) : (
              warnings.map((warning) => (
                <div
                  key={warning.code}
                  className="rounded-xl border border-[#4b2d3a] bg-[#291a24] px-3 py-2"
                >
                  <div className="mb-1">
                    <StatusBadge tone={warning.level === 'critical' ? 'critical' : 'warn'}>
                      {warning.level === 'critical' ? 'Krytyczne' : 'Uwaga'}
                    </StatusBadge>
                  </div>
                  <p className="m-0 text-sm text-[#ffc5d4]">{warning.message}</p>
                </div>
              ))
            )}
          </div>
        </AdminPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AdminPanel title="Ostatnie modyfikacje sal" subtitle="Najswiezsze rekordy rooms">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Nazwa</th>
                  <th>Ostatnia zmiana</th>
                </tr>
              </thead>
              <tbody>
                {recentRooms.map((room) => (
                  <tr key={room.id}>
                    <td>{room.room_code}</td>
                    <td>{room.display_name}</td>
                    <td>{formatDateTime(room.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel title="Ostatnio dodane wpisy" subtitle="Nowe rekordy harmonogramu">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Sala</th>
                  <th>Tytul</th>
                  <th>Utworzono</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.eventDate}</td>
                    <td>{entry.roomCode}</td>
                    <td>{entry.title}</td>
                    <td>{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}

function DashboardStatCard({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: 'info' | 'ok' | 'warn' | 'critical';
}): JSX.Element {
  const toneClassName =
    tone === 'ok'
      ? 'border-[#275747] bg-[#102b22] text-[#aff0cf]'
      : tone === 'warn'
        ? 'border-[#5f4b29] bg-[#2d2414] text-[#ffd69e]'
        : tone === 'critical'
          ? 'border-[#613049] bg-[#311a28] text-[#ffb4d1]'
          : 'border-[#2f4670] bg-[#101f36] text-[#b9d5ff]';

  return (
    <article className={`rounded-2xl border px-4 py-4 ${toneClassName}`}>
      <p className="m-0 text-xs uppercase tracking-[0.1em] opacity-90">{label}</p>
      <p className="mt-2 text-[1.7rem] font-semibold leading-none">{value}</p>
    </article>
  );
}

function QuickLinkCard({ title, text, to }: { title: string; text: string; to: string }): JSX.Element {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-[#2d4568] bg-[#101d32] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#4f7bc2]"
    >
      <h3 className="m-0 text-lg font-semibold text-[#e8f2ff]">{title}</h3>
      <p className="mt-2 text-sm text-[#9eb2d4]">{text}</p>
    </Link>
  );
}
