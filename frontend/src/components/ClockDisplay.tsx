import { useNow } from '../hooks/useNow';
import { formatTime, timeZone } from '../lib/schedule';

export function ClockDisplay(): JSX.Element {
  const now = useNow();
  return (
    <div className="clock" aria-label="Aktualny czas i data">
      <time dateTime={now.toISOString()}>{formatTime(now)}</time>
      <span>
        {now.toLocaleDateString('pl-PL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone
        })}
      </span>
    </div>
  );
}
