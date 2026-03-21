import type { LectureEvent } from '../types/schedule';
import { ScheduleItem } from './ScheduleItem';

interface ScheduleSidebarProps {
  schedule: LectureEvent[];
  onSelect: (lecture: LectureEvent) => void;
}

export function ScheduleSidebar({ schedule, onSelect }: ScheduleSidebarProps): JSX.Element {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-panel border border-border bg-surface/90 p-4 shadow-panel max-[900px]:max-h-[42vh] lg:max-h-full"
      aria-label="Najbliższy harmonogram zajęć"
    >
      <div>
        <p className="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.11em] text-muted">Harmonogram</p>
        <h2 className="mb-1 mt-1.5 text-xl font-semibold text-foreground">Co dalej</h2>
      </div>

      <div className="pointer-events-none mt-2 h-4 bg-gradient-to-b from-surface/95 to-transparent" />

      <div className="schedule-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        {schedule.length > 0 ? (
          schedule.map((lecture, index) => (
            <div key={lecture.id} className="flex flex-col items-center">
              <ScheduleItem lecture={lecture} onClick={onSelect} />
              {index < schedule.length - 1 ? <span className="my-1 text-lg text-muted/80">↓</span> : null}
            </div>
          ))
        ) : (
          <div className="rounded-card border border-dashed border-border bg-surface/60 p-4 text-sm text-muted">
            Brak zaplanowanych zajęć.
          </div>
        )}
      </div>

      <div className="pointer-events-none mt-2 h-4 bg-gradient-to-t from-surface/95 to-transparent" />
    </aside>
  );
}
