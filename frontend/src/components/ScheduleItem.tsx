import type { LectureEvent } from '../types/schedule';

interface ScheduleItemProps {
  lecture: LectureEvent;
  onClick: (lecture: LectureEvent) => void;
}

export function ScheduleItem({ lecture, onClick }: ScheduleItemProps): JSX.Element {
  return (
    <button
      type="button"
      className={`schedule-item ${lecture.isCurrent ? 'is-current' : ''}`}
      onClick={() => onClick(lecture)}
      aria-label={`Pokaż szczegóły: ${lecture.title}`}
    >
      <div className="schedule-item-topline">
        <span className="schedule-item-time">
          {lecture.startTime}-{lecture.endTime}
        </span>
        {lecture.isCurrent ? <span className="schedule-item-badge">Teraz</span> : null}
      </div>
      <h3 className="schedule-item-title">{lecture.title}</h3>
      <p className="schedule-item-subtitle">{lecture.lecturer}</p>
      <p className="schedule-item-group">{lecture.group}</p>
    </button>
  );
}
