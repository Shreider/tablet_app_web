import { ClockDisplay } from './ClockDisplay';

interface HeaderBarProps {
  room: string;
  building: string;
  zone: string;
  scheduleCount: number;
  isScheduleOpen: boolean;
  onOpenSchedule: () => void;
}

export function HeaderBar({ room, building, zone, scheduleCount, isScheduleOpen, onOpenSchedule }: HeaderBarProps): JSX.Element {
  return (
    <header className="flex shrink-0 flex-col gap-3 rounded-panel border border-border bg-surface/90 pl-5 pr-6 py-4 shadow-panel backdrop-blur-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">Panel sali</p>
        <h1 className="m-0 my-1 text-[clamp(1.35rem,2.1vw,1.9rem)] font-bold text-foreground">Sala {room}</h1>
        <p className="m-0 text-sm text-muted">
          {building} • {zone}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end md:gap-5">
        <ClockDisplay />
        <button
          type="button"
          className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2.5 rounded-card border border-border bg-surface px-4 py-2.5 text-base font-semibold text-foreground transition hover:border-primary/70 hover:bg-primary/15 active:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-controls="schedule-panel"
          aria-expanded={isScheduleOpen}
          aria-haspopup="dialog"
          onClick={onOpenSchedule}
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2M8 18h2" />
          </svg>
          Harmonogram
          <span className="rounded-full bg-primary/25 px-2 py-0.5 text-sm tabular-nums">{scheduleCount}</span>
        </button>
      </div>
    </header>
  );
}
