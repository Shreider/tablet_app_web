import { useEffect, useRef } from 'react';
import type { LectureEvent } from '../types/schedule';
import { ScheduleItem } from './ScheduleItem';

interface ScheduleSidebarProps {
  schedule: LectureEvent[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lecture: LectureEvent) => void;
}

export function ScheduleSidebar({ schedule, isOpen, onClose, onSelect }: ScheduleSidebarProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();

    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      id="schedule-panel"
      aria-labelledby="schedule-title"
      className="fixed inset-y-3 left-auto right-3 m-0 h-[calc(100dvh-1.5rem)] max-h-none w-[min(24rem,calc(100vw-1.5rem))] max-w-none overflow-hidden rounded-panel border border-border bg-surface p-0 text-foreground shadow-panel backdrop:bg-background/70 backdrop:backdrop-blur-sm"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-muted">Harmonogram</p>
            <h2 id="schedule-title" className="m-0 mt-0.5 text-xl font-bold">Następne zajęcia</h2>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Zamknij harmonogram"
            className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-card border border-border text-muted transition hover:bg-primary/20 active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="schedule-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-3">
          {schedule.length > 0 ? (
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {schedule.map((lecture) => (
                <li key={lecture.id} className="min-w-0">
                  <ScheduleItem lecture={lecture} onClick={onSelect} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="m-0 rounded-card border border-dashed border-border p-4 text-sm text-muted">
              Brak zaplanowanych zajęć.
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
