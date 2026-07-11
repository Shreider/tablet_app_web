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
          error instanceof AdminApiError ? error.message : 'Nie udało się pobrać danych dashboardu.';

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
    return <LoadingBlock message="Ładowanie dashboardu admina..." />;
  }

  if (state.error || !state.data) {
    return (
      <ErrorBlock
        title="Błąd dashboardu"
        message={state.error ?? 'Brak danych dashboardu.'}
        onRetry={() => setReloadNonce((prev) => prev + 1)}
      />
    );
  }

  const { stats, conflicts, warnings, recentRooms, recentEntries } = state.data;

  return (
    <div className="grid gap-4 lg:gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard label="Sale" value={stats.rooms} tone="info" />
        <DashboardStatCard label="Wpisy harmonogramu" value={stats.scheduleEntries} tone="ok" />
        <DashboardStatCard label="Dzisiaj" value={stats.todayEntries} tone="info" />
        <DashboardStatCard label="Sale bez wpisów" value={stats.roomsWithoutEntries} tone="warn" />
        <Link to="/conflicts" className="no-underline">
          <DashboardStatCard label="Konflikty czasowe" value={stats.overlappingEntries} tone="critical" clickable />
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_minmax(0,1fr)]">
        <AdminPanel
          title="Szybkie akcje"
          subtitle="Najczęściej używane obszary administracyjne"
          actions={null}
        >
          <div className="grid gap-3 py-2 sm:grid-cols-2 xl:grid-cols-4">
            <QuickLinkCard
              title="Sale"
              text="Dodawaj i edytuj sale wraz z lokalizacją."
              to="/rooms"
            />
            <QuickLinkCard
              title="Harmonogram"
              text="Zarządzaj terminem zajęć."
              to="/schedule-entries"
            />
            <QuickLinkCard
              title="Wykładowcy"
              text="Wykładowcy, grupy, typy zajęć, kierunki i przedmioty."
              to="/teaching/lecturers"
            />
            <QuickLinkCard
              title="Lokalizacje"
              text="Piętra i edycja."
              to="/locations/floors"
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Ostrzeżenia danych" subtitle="Sygnały integralności bazy">
          <div className="space-y-2 py-1">
            {warnings.length === 0 ? (
              <p className="m-0 rounded-xl border border-[#264435] bg-[#0f251c] px-3 py-2 text-sm text-[#a5e8c4]">
                Brak krytycznych problemów.
              </p>
            ) : (
              <>
                {warnings
                  .filter((w) => w.level === 'warning')
                  .map((warning) => (
                    <div
                      key={warning.code}
                      className="rounded-xl border border-[#5f4b29] bg-[#2a2210] px-3 py-2"
                    >
                      <div className="mb-1">
                        <StatusBadge tone="warn">Uwaga</StatusBadge>
                      </div>
                      <p className="m-0 text-sm text-[#ffd4a0]">{warning.message}</p>
                    </div>
                  ))}
                {conflicts.length > 0 && (
                  <div className="rounded-xl border border-[#4b2d3a] bg-[#291a24] px-3 py-2">
                    <div className="mb-2">
                      <StatusBadge tone="critical">Krytyczne</StatusBadge>
                    </div>
                    <p className="m-0 mb-2 text-sm font-medium text-[#ffc5d4]">
                      Wykryto {conflicts.length} {conflicts.length === 1 ? 'konflikt' : 'konflikty'} harmonogramu:
                    </p>
                    <div className="space-y-1.5">
                      {conflicts.map((pair) => (
                        <div
                          key={`${pair.entryA.id}-${pair.entryB.id}`}
                          className="rounded-lg border border-[#3a2030] bg-[#1f1018] px-2.5 py-1.5 text-xs text-[#f0b8cc]"
                        >
                          <span className="font-semibold">{pair.entryA.roomCode}</span>{' '}
                          {pair.entryA.eventDate} — wpis #{pair.entryA.id} (
                          {pair.entryA.startTime}–{pair.entryA.endTime}) koliduje z #{pair.entryB.id} (
                          {pair.entryB.startTime}–{pair.entryB.endTime})
                        </div>
                      ))}
                    </div>
                    <Link
                      to="/conflicts"
                      className="mt-2 inline-block text-xs text-[#d080a0] underline hover:text-[#f0b8cc]"
                    >
                      Przejdź do zarządzania konfliktami →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </AdminPanel>
      </section>

      <section className="grid gap-4">
        <AdminPanel title="Ostatnio dodane wpisy" subtitle="Nowe rekordy harmonogramu">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Sala</th>
                  <th>Tytuł</th>
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
  tone,
  clickable = false
}: {
  label: string;
  value: number;
  tone: 'info' | 'ok' | 'warn' | 'critical';
  clickable?: boolean;
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
    <article
      className={`rounded-2xl border px-4 py-4 ${toneClassName}${clickable ? ' cursor-pointer transition hover:-translate-y-0.5 hover:opacity-90' : ''}`}
    >
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
