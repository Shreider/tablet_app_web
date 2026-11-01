import { useState } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { LectureNavigator } from './components/LectureNavigator';
import { ScheduleSidebar } from './components/ScheduleSidebar';
import { Icon } from './components/Icon';
import { formatDay, formatTime } from './lib/schedule';
import type { RoomScheduleResponse } from './types/schedule';

interface AppProps {
  data: RoomScheduleResponse;
  error: string | null;
  onRefresh: () => void;
}

export default function App({ data, error, onRefresh }: AppProps): JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { room, schedule, currentLecture, nextLecture } = data;
  const defaultLecture = currentLecture ?? nextLecture ?? schedule[schedule.length - 1] ?? null;
  const selectedLecture = schedule.find((lecture) => lecture.id === selectedId) ?? defaultLecture;
  const cached = Boolean(data.cache?.stale || data.cache?.outdated);
  const notice = data.cache?.outdated
    ? `Brak aktualnego planu. Wyświetlam zapisany plan na ${formatDay(data.date)}.`
    : error ? `${error} Wyświetlam ostatnio pobrany plan.`
    : data.cache?.imported ? 'Wyświetlam zaimportowaną kopię. Czekam na potwierdzenie planu z serwera.'
    : cached ? 'Brak połączenia z serwerem. Wyświetlam lokalną kopię planu.' : null;
  const savedAt = new Date(data.cache?.fetchedAt ?? data.generatedAt);

  return (
    <div className="room-shell">
      <HeaderBar
        room={room}
        scheduleCount={schedule.length}
        scheduleOpen={scheduleOpen}
        onOpenSchedule={() => setScheduleOpen(true)}
      />

      {notice && (
        <div className="connection-notice" role="status">
          <Icon name="info" />
          <span>{notice}</span>
          <button className="text-button" type="button" onClick={onRefresh}>
            Ponów
          </button>
        </div>
      )}

      <main className="room-workspace">
        <LectureNavigator
          schedule={schedule}
          lecture={selectedLecture}
          defaultLecture={defaultLecture}
          disabled={scheduleOpen}
          onSelect={setSelectedId}
          onReset={() => setSelectedId(null)}
        />
      </main>

      <footer className="app-footer">
        <span>
          <span className={`status-dot ${error || cached ? 'status-dot--warning' : ''}`} />
          {error || cached ? 'Zapisana kopia planu' : 'Plan aktualny'}
          <span className="footer-time">
            {' · '}{savedAt.toLocaleDateString('pl-PL', { timeZone: data.cache?.timeZone ?? 'Europe/Warsaw' })}
            {' '}{formatTime(savedAt)}
          </span>
        </span>
        <span>
          Plan sali <span className="footer-divider">/</span> {room.building}
        </span>
      </footer>

      <ScheduleSidebar
        schedule={schedule}
        activeId={selectedLecture?.id}
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSelect={(lecture) => {
          setSelectedId(lecture.id);
          setScheduleOpen(false);
        }}
      />
    </div>
  );
}
