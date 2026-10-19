import type { LectureEvent } from '../types/schedule';
import { Dialog } from './Dialog';
import { ScheduleItem } from './ScheduleItem';

interface ScheduleSidebarProps {
  schedule: LectureEvent[];
  activeId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lecture: LectureEvent) => void;
}

export function ScheduleSidebar({
  schedule,
  activeId,
  isOpen,
  onClose,
  onSelect
}: ScheduleSidebarProps): JSX.Element {
  return (
    <Dialog id="schedule-panel" drawer open={isOpen} onClose={onClose} title="Plan dnia">
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
    </Dialog>
  );
}
