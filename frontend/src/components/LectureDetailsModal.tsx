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
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <article
        className="details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lecture-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close-button" onClick={onClose} aria-label="Zamknij okno">
          ×
        </button>

        <span className="modal-tag">Szczegóły zajęć</span>
        <h2 id="lecture-details-title">{lecture.title}</h2>
        <p className="modal-time">
          {lecture.startTime} - {lecture.endTime}
        </p>

        <dl className="modal-grid">
          <div>
            <dt>Prowadzący</dt>
            <dd>{lecture.lecturer}</dd>
          </div>
          <div>
            <dt>Sala</dt>
            <dd>{lecture.room}</dd>
          </div>
          <div>
            <dt>Grupa</dt>
            <dd>{lecture.group}</dd>
          </div>
          <div>
            <dt>Typ zajęć</dt>
            <dd>{lecture.type}</dd>
          </div>
        </dl>

        <section>
          <h3>Opis</h3>
          <p>{lecture.description}</p>
          {lecture.note ? <p className="modal-note">Notatka: {lecture.note}</p> : null}
        </section>
      </article>
    </div>
  );
}
