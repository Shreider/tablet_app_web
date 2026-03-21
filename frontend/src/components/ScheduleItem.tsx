import type { LectureEvent } from '../types/schedule';

interface ScheduleItemProps {
  lecture: LectureEvent;
  onClick: (lecture: LectureEvent) => void;
}

export function ScheduleItem({ lecture, onClick }: ScheduleItemProps): JSX.Element {
  const baseClassName =
    'w-full rounded-card border px-3 py-3 text-left transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70';

  const stateClassName = lecture.isCurrent
    ? 'border-primary/70 bg-primary/20'
    : 'border-border bg-surface/70 hover:-translate-y-0.5 hover:border-primary/55 hover:bg-surface';

  return (
    <button
      type="button"
      className={`${baseClassName} ${stateClassName}`}
      onClick={() => onClick(lecture)}
      aria-label={`Pokaż szczegóły: ${lecture.title}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-muted">
          {lecture.startTime}-{lecture.endTime}
        </span>
        {lecture.isCurrent ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.07em] text-foreground">
            Teraz
          </span>
        ) : null}
      </div>
      <h3 className="mb-1 mt-2 text-base font-semibold leading-snug text-foreground">{lecture.title}</h3>
      <p className="m-0 text-[0.82rem] leading-snug text-muted">{lecture.lecturer}</p>
      <p className="m-0 text-[0.82rem] leading-snug text-muted">{lecture.group}</p>
    </button>
  );
}
