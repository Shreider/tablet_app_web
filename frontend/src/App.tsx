import { useState } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { LectureNavigator } from './components/LectureNavigator';
import { ScheduleSidebar } from './components/ScheduleSidebar';
import { Icon } from './components/Icon';
import { formatTime } from './lib/schedule';
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

  return (
    <div className="room-shell">
      <HeaderBar
        room={room}
        scheduleCount={schedule.length}
        scheduleOpen={scheduleOpen}
        onOpenSchedule={() => setScheduleOpen(true)}
      />

      {error && (
        <div className="connection-notice" role="status">
          <Icon name="info" />
          <span>{error} Wyświetlam ostatnio pobrany plan.</span>
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
          room={room}
          onSelect={setSelectedId}
          onReset={() => setSelectedId(null)}
        />
      </main>

      <footer className="app-footer">
        <span>
          <span className={`status-dot ${error ? 'status-dot--warning' : ''}`} />
          {error ? 'Ostatnio pobrany plan' : 'Plan aktualny'}
          <span className="footer-time"> · {formatTime(new Date(data.generatedAt))}</span>
        </span>
        <span>
          Plan sali <span className="footer-divider">/</span> {room.building}
        </span>
      </footer>

      <ScheduleSidebar
        schedule={schedule}
        date={data.date}
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
