import { useEffect, useState } from 'react';

const formatDate = (date: Date): string =>
  date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

export function ClockDisplay(): JSX.Element {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  return (
    <div className="clock-display" aria-label="Aktualny czas i data">
      <span className="clock-time">{formatTime(now)}</span>
      <span className="clock-date">{formatDate(now)}</span>
    </div>
  );
}
