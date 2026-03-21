import type { LectureEvent } from '../types/schedule';

interface ScheduleItemProps {
  lecture: LectureEvent;
  onClick: (lecture: LectureEvent) => void;
}

export function ScheduleItem({ lecture, onClick }: ScheduleItemProps): JSX.Element {
  const baseClassName =
    'w-full rounded-card border px-4 py-3.5 text-left transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70';

  const stateClassName = lecture.isCurrent
    ? 'border-primary/70 bg-primary/20'
    : 'border-border bg-surface/70 hover:-translate-y-0.5 hover:border-primary/55 hover:bg-surface';

  return (
    <button
      type="button"
      className={`${baseClassName} ${stateClassName} min-w-0`}
      onClick={() => onClick(lecture)}
      aria-label={`Pokaż szczegóły: ${lecture.title}`}
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-base font-bold text-muted">
          {lecture.startTime}-{lecture.endTime}
        </span>
        {lecture.isCurrent ? (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[0.8rem] font-bold uppercase tracking-[0.07em] text-foreground">
            Teraz
          </span>
        ) : null}
      </div>
      <h3 className="mb-1.5 mt-2.5 break-words text-lg font-semibold leading-snug text-foreground">{lecture.title}</h3>
      <p className="m-0 break-words text-[0.95rem] leading-snug text-muted">{lecture.lecturer}</p>
      <p className="m-0 break-words text-[0.95rem] leading-snug text-muted">{lecture.group}</p>
    </button>
  );
}
