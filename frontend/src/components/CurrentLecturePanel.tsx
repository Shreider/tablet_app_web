import type { LectureEvent } from '../types/schedule';

interface CurrentLecturePanelProps {
  lecture: LectureEvent;
}

export function CurrentLecturePanel({ lecture }: CurrentLecturePanelProps): JSX.Element {
  return (
    <section
      className="flex h-full flex-col rounded-panel border border-border bg-gradient-to-br from-surface to-[#31415f] p-4 shadow-panel sm:p-6"
      aria-label="Aktualnie trwające zajęcia"
    >
      <span className="inline-flex w-fit items-center rounded-full border border-primary/60 bg-primary/25 px-3 py-1 text-sm font-semibold text-foreground">
        Trwa teraz
      </span>
      <h2 className="mb-2 mt-4 text-[clamp(2rem,4.1vw,3.45rem)] font-bold leading-[1.1] text-foreground">{lecture.title}</h2>
      <p className="m-0 text-[clamp(1.2rem,2.3vw,1.85rem)] font-bold text-primary">
        {lecture.startTime} - {lecture.endTime}
      </p>

      <dl className="mb-4 mt-5 grid grid-cols-2 gap-4 max-[1160px]:grid-cols-1">
        <div className="rounded-card border border-border bg-surface/60 p-4">
          <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Prowadzący</dt>
          <dd className="m-0 text-base font-semibold text-foreground">{lecture.lecturer}</dd>
        </div>
        <div className="rounded-card border border-border bg-surface/60 p-4">
          <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Sala</dt>
          <dd className="m-0 text-base font-semibold text-foreground">{lecture.room}</dd>
        </div>
        <div className="rounded-card border border-border bg-surface/60 p-4">
          <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Grupa</dt>
          <dd className="m-0 text-base font-semibold text-foreground">{lecture.group}</dd>
        </div>
        <div className="rounded-card border border-border bg-surface/60 p-4">
          <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Typ zajęć</dt>
          <dd className="m-0 text-base font-semibold text-foreground">{lecture.type}</dd>
        </div>
      </dl>

      <div>
        <h3 className="m-0 text-[0.92rem] font-semibold uppercase tracking-[0.08em] text-muted">Opis</h3>
        <p className="mt-2 text-base leading-relaxed text-muted">{lecture.description}</p>
        {lecture.note ? <p className="mt-2 text-base font-semibold text-foreground">Notatka: {lecture.note}</p> : null}
      </div>
    </section>
  );
}
