import type { LectureEvent } from '../types/schedule';
import { useNow } from '../hooks/useNow';
import { durationOf, formatTime, toMinutes } from '../lib/schedule';
import { Icon } from './Icon';

interface CurrentLecturePanelProps {
  lecture: LectureEvent | null;
}

export function CurrentLecturePanel({ lecture }: CurrentLecturePanelProps): JSX.Element {
  const now = useNow();
  if (!lecture) {
    return (
      <section className="lecture-empty">
        <span className="state-icon">
          <Icon name="calendar" size={30} />
        </span>
        <p className="eyebrow">Brak zajęć</p>
        <h2>Dziś bez zaplanowanych zajęć</h2>
        <p>Sala jest wolna. Nowe zajęcia pojawią się tutaj po zaktualizowaniu planu.</p>
      </section>
    );
  }

  const status =
    lecture.status === 'current'
      ? 'Trwają teraz'
      : lecture.status === 'upcoming'
        ? 'Nadchodzące'
        : 'Zakończone';
  const duration = durationOf(lecture);
  const elapsed = Math.max(
    0,
    Math.min(duration, toMinutes(formatTime(now)) - toMinutes(lecture.startTime))
  );

  return (
    <article className="lecture-card" aria-label="Wybrane zajęcia">
      <div className="lecture-main">
        <div className="lecture-labels">
          <span className={`status-pill status-pill--${lecture.status}`}>
            <span className="status-dot" />
            {status}
          </span>
        </div>
        <h2>{lecture.title}</h2>
        <div className="lecture-time">
          <span>{lecture.startTime}</span>
          <span className="time-separator">—</span>
          <span>{lecture.endTime}</span>
          <span className="duration">{duration} min</span>
        </div>
        {lecture.isCurrent && (
          <div className="lecture-progress">
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Postęp zajęć"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={elapsed}
            >
              <span style={{ width: `${duration ? (elapsed / duration) * 100 : 0}%` }} />
            </div>
            <span>
              {duration - elapsed > 0
                ? `Do końca ${duration - elapsed} min`
                : 'Zajęcia dobiegają końca'}
            </span>
          </div>
        )}
      </div>

      <dl className="lecture-facts">
        <div>
          <dt>Przedmiot</dt>
          <dd>
            {lecture.subject || lecture.title}
            {lecture.subjectCode && <span>{lecture.subjectCode}</span>}
          </dd>
        </div>
        <div>
          <dt>Prowadzący</dt>
          <dd>{lecture.lecturer}</dd>
        </div>
        <div>
          <dt>Grupa</dt>
          <dd>
            {lecture.group}
            {lecture.fieldOfStudy && <span>{lecture.fieldOfStudy}</span>}
          </dd>
        </div>
        <div>
          <dt>Typ zajęć</dt>
          <dd>{lecture.type}</dd>
        </div>
      </dl>

      {lecture.description && (
        <section className="lecture-description">
          <h3>Opis zajęć</h3>
          <p>{lecture.description}</p>
        </section>
      )}
    </article>
  );
}
