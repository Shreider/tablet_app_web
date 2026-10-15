import { useCallback } from 'react';
import type { LectureEvent, RoomDetails } from '../types/schedule';
import { useLectureGestures } from '../hooks/useLectureGestures';
import { CurrentLecturePanel } from './CurrentLecturePanel';
import { Icon } from './Icon';

interface LectureNavigatorProps {
  schedule: LectureEvent[];
  lecture: LectureEvent | null;
  defaultLecture: LectureEvent | null;
  room: RoomDetails;
  disabled: boolean;
  onSelect: (id: string) => void;
  onReset: () => void;
}

export function LectureNavigator({
  schedule,
  lecture,
  defaultLecture,
  room,
  disabled,
  onSelect,
  onReset
}: LectureNavigatorProps): JSX.Element {
  const index = schedule.findIndex((item) => item.id === lecture?.id);
  const previous = schedule[index - 1];
  const next = schedule[index + 1];
  const onNavigate = useCallback(
    (direction: number) => {
      const target = schedule[index + direction];
      if (target) onSelect(target.id);
    },
    [index, onSelect, schedule]
  );
  const { viewportRef, navigate } = useLectureGestures({
    activeId: lecture?.id,
    disabled,
    hasPrevious: Boolean(previous),
    hasNext: Boolean(next),
    onNavigate
  });
  const browsing = lecture?.id !== defaultLecture?.id;
  const returnLabel =
    defaultLecture?.status === 'current'
      ? 'Wróć do teraz'
      : defaultLecture?.status === 'upcoming'
        ? 'Najbliższe zajęcia'
        : 'Ostatnie zajęcia';

  return (
    <div className="lecture-browser">
      <div
        ref={viewportRef}
        className="lecture-viewport"
        role="region"
        aria-label="Przegląd zajęć"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.target !== event.currentTarget ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          )
            return;
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            navigate(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
      >
        <CurrentLecturePanel key={lecture?.id ?? 'empty'} lecture={lecture} room={room} />
      </div>
      {schedule.length > 1 && (
        <nav className="lecture-navigation" aria-label="Nawigacja po zajęciach">
          <button
            type="button"
            className="navigation-card"
            disabled={!previous || disabled}
            onClick={() => navigate(-1)}
          >
            <Icon name="left" />
            <span>
              <span className="navigation-label">
                Poprzednie {previous && <time>{previous.startTime}</time>}
              </span>
              <strong>{previous?.title ?? 'To pierwsze zajęcia'}</strong>
            </span>
          </button>
          <div className="navigation-position">
            <span aria-label={`Zajęcia ${index + 1} z ${schedule.length}`}>
              {index + 1} / {schedule.length}
            </span>
            {browsing && (
              <button type="button" className="text-button" onClick={onReset}>
                {returnLabel}
              </button>
            )}
          </div>
          <button
            type="button"
            className="navigation-card navigation-card--next"
            disabled={!next || disabled}
            onClick={() => navigate(1)}
          >
            <span>
              <span className="navigation-label">
                Następne {next && <time>{next.startTime}</time>}
              </span>
              <strong>{next?.title ?? 'To ostatnie zajęcia'}</strong>
            </span>
            <Icon name="right" />
          </button>
          <span className="sr-only" role="status">
            Zajęcia {index + 1} z {schedule.length}: {lecture?.title}
          </span>
        </nav>
      )}
    </div>
  );
}
