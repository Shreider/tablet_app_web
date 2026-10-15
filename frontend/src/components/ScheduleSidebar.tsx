import type { LectureEvent } from '../types/schedule';
import { formatDay, lessonCount } from '../lib/schedule';
import { Dialog } from './Dialog';
import { ScheduleItem } from './ScheduleItem';

interface ScheduleSidebarProps {
  schedule: LectureEvent[];
  date: string;
  activeId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lecture: LectureEvent) => void;
}

export function ScheduleSidebar({
  schedule,
  date,
  activeId,
  isOpen,
  onClose,
  onSelect
}: ScheduleSidebarProps): JSX.Element {
  return (
    <Dialog
      id="schedule-panel"
      drawer
      open={isOpen}
      onClose={onClose}
      title="Plan dnia"
      subtitle={`${formatDay(date)} · ${lessonCount(schedule.length)}`}
    >
      {schedule.length ? (
        <ol className="schedule-list">
          {schedule.map((lecture) => (
            <li key={lecture.id}>
              <ScheduleItem lecture={lecture} active={lecture.id === activeId} onClick={onSelect} />
            </li>
          ))}
        </ol>
      ) : (
        <div className="inline-empty">Na dziś nie ma zaplanowanych zajęć.</div>
      )}
      {schedule.length > 0 && (
        <p className="dialog-hint">Dotknij zajęć, aby pokazać je na głównym ekranie.</p>
      )}
    </Dialog>
  );
}
