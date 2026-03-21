import type { LectureEvent } from '../types/schedule';
import { ScheduleItem } from './ScheduleItem';

interface ScheduleSidebarProps {
  schedule: LectureEvent[];
  onSelect: (lecture: LectureEvent) => void;
}

export function ScheduleSidebar({ schedule, onSelect }: ScheduleSidebarProps): JSX.Element {
  return (
    <aside
      className="flex h-full flex-col overflow-hidden rounded-panel border border-border bg-surface/90 p-4 shadow-panel max-[900px]:max-h-[42vh]"
      aria-label="Najbliższy harmonogram zajęć"
    >
      <div>
        <p className="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.11em] text-muted">Harmonogram</p>
        <h2 className="mb-1 mt-1.5 text-xl font-semibold text-foreground">Co dalej</h2>
      </div>

      <div className="schedule-scrollbar mt-3 overflow-y-auto pr-1">
        {schedule.map((lecture, index) => (
          <div key={lecture.id} className="flex flex-col items-center">
            <ScheduleItem lecture={lecture} onClick={onSelect} />
            {index < schedule.length - 1 ? <span className="my-1 text-lg text-muted/80">↓</span> : null}
          </div>
        ))}
      </div>
    </aside>
  );
}
