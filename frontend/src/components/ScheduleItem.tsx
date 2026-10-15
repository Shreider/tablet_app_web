import type { LectureEvent } from '../types/schedule';

interface ScheduleItemProps {
  lecture: LectureEvent;
  active: boolean;
  onClick: (lecture: LectureEvent) => void;
}

export function ScheduleItem({ lecture, active, onClick }: ScheduleItemProps): JSX.Element {
  return (
    <button
      type="button"
      className={`schedule-item ${active ? 'schedule-item--selected' : ''}`}
      onClick={() => onClick(lecture)}
      aria-current={active ? 'true' : undefined}
    >
      <span className="schedule-item__top">
        <span className="schedule-item__time">
          <time>{lecture.startTime}</time>–<time>{lecture.endTime}</time>
        </span>
        {lecture.isCurrent && <span className="live-label">Teraz</span>}
      </span>
      <strong>{lecture.title}</strong>
      <span className="schedule-item__details">{lecture.lecturer}</span>
      <span className="schedule-item__details">{lecture.group}</span>
    </button>
  );
}
