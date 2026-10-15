import type { LectureEvent } from '../types/schedule';

interface ScheduleItemProps {
  lecture: LectureEvent;
  onClick: (lecture: LectureEvent) => void;
}

export function ScheduleItem({ lecture, onClick }: ScheduleItemProps): JSX.Element {
  const baseClassName =
    'min-h-12 w-full touch-manipulation rounded-card border px-3 py-2.5 text-left transition-colors duration-150 ease-out active:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70';

  const stateClassName = lecture.isCurrent
    ? 'border-primary/70 bg-primary/20'
    : 'border-border bg-surface/70 hover:border-primary/55 hover:bg-surface';

  return (
    <button
      type="button"
      className={`${baseClassName} ${stateClassName} min-w-0`}
      onClick={() => onClick(lecture)}
      aria-label={`Pokaż szczegóły: ${lecture.title}`}
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-sm font-bold tabular-nums text-muted">
          {lecture.startTime}-{lecture.endTime}
        </span>
        {lecture.isCurrent ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-[0.05em] text-foreground">
            Teraz
          </span>
        ) : null}
      </div>
      <h3 className="mb-0.5 mt-1 break-words text-base font-semibold leading-snug text-foreground">{lecture.title}</h3>
      <p className="m-0 break-words text-sm leading-snug text-muted">{lecture.lecturer}</p>
      <p className="m-0 break-words text-sm leading-snug text-muted">{lecture.group}</p>
    </button>
  );
}
