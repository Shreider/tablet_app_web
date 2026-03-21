import type { LectureEvent } from '../types/schedule';
import { ScheduleItem } from './ScheduleItem';

interface ScheduleSidebarProps {
  schedule: LectureEvent[];
  onSelect: (lecture: LectureEvent) => void;
}

export function ScheduleSidebar({ schedule, onSelect }: ScheduleSidebarProps): JSX.Element {
  return (
    <aside className="schedule-sidebar" aria-label="Najbliższy harmonogram zajęć">
      <div className="schedule-sidebar-heading">
        <p>Harmonogram</p>
        <h2>Co dalej</h2>
      </div>

      <div className="schedule-list">
        {schedule.map((lecture, index) => (
          <div key={lecture.id} className="schedule-list-row">
            <ScheduleItem lecture={lecture} onClick={onSelect} />
            {index < schedule.length - 1 ? <span className="schedule-divider">↓</span> : null}
          </div>
        ))}
      </div>
    </aside>
  );
}
