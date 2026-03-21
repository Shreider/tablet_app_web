import type { LectureEvent } from '../types/schedule';

interface CurrentLecturePanelProps {
  lecture: LectureEvent;
}

export function CurrentLecturePanel({ lecture }: CurrentLecturePanelProps): JSX.Element {
  return (
    <section className="current-lecture-panel" aria-label="Aktualnie trwające zajęcia">
      <span className="status-pill">Trwa teraz</span>
      <h2 className="current-title">{lecture.title}</h2>
      <p className="current-time">
        {lecture.startTime} - {lecture.endTime}
      </p>

      <dl className="current-details-grid">
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

      <div className="current-description">
        <h3>Opis</h3>
        <p>{lecture.description}</p>
        {lecture.note ? <p className="current-note">Notatka: {lecture.note}</p> : null}
      </div>
    </section>
  );
}
