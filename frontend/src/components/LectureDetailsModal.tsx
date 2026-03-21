import { useEffect } from 'react';
import type { LectureEvent } from '../types/schedule';

interface LectureDetailsModalProps {
  lecture: LectureEvent | null;
  onClose: () => void;
}

export function LectureDetailsModal({ lecture, onClose }: LectureDetailsModalProps): JSX.Element | null {
  useEffect(() => {
    if (!lecture) {
      return;
    }

    const onEsc = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [lecture, onClose]);

  if (!lecture) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 grid place-items-center bg-background/80 p-4 backdrop-blur-[1px] animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <article
        className="relative w-full max-w-[700px] rounded-[18px] border border-border bg-surface p-5 shadow-panel animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lecture-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border bg-surface/60 text-2xl leading-none text-muted transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          onClick={onClose}
          aria-label="Zamknij okno"
        >
          ×
        </button>

        <span className="mb-2 inline-block text-[0.72rem] font-bold uppercase tracking-[0.12em] text-muted">
          Szczegóły zajęć
        </span>
        <h2 id="lecture-details-title" className="m-0 text-[clamp(1.45rem,2.6vw,2rem)] font-bold text-foreground">
          {lecture.title}
        </h2>
        <p className="mb-4 mt-2 text-[1.05rem] font-bold text-primary">
          {lecture.startTime} - {lecture.endTime}
        </p>

        <dl className="grid grid-cols-2 gap-3 max-[1160px]:grid-cols-1">
          <div className="rounded-xl border border-border bg-surface/70 p-3">
            <dt className="text-[0.72rem] uppercase tracking-[0.08em] text-muted">Prowadzący</dt>
            <dd className="m-0 mt-1 font-semibold text-foreground">{lecture.lecturer}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface/70 p-3">
            <dt className="text-[0.72rem] uppercase tracking-[0.08em] text-muted">Sala</dt>
            <dd className="m-0 mt-1 font-semibold text-foreground">{lecture.room}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface/70 p-3">
            <dt className="text-[0.72rem] uppercase tracking-[0.08em] text-muted">Grupa</dt>
            <dd className="m-0 mt-1 font-semibold text-foreground">{lecture.group}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface/70 p-3">
            <dt className="text-[0.72rem] uppercase tracking-[0.08em] text-muted">Typ zajęć</dt>
            <dd className="m-0 mt-1 font-semibold text-foreground">{lecture.type}</dd>
          </div>
        </dl>

        <section>
          <h3 className="mb-1 mt-4 text-[0.9rem] font-semibold uppercase tracking-[0.08em] text-muted">Opis</h3>
          <p className="m-0 leading-relaxed text-muted">{lecture.description}</p>
          {lecture.note ? <p className="mt-2 font-semibold text-foreground">Notatka: {lecture.note}</p> : null}
        </section>
      </article>
    </div>
  );
}
