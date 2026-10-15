import type { LectureEvent } from '../types/schedule';

export const timeZone = 'Europe/Warsaw';

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function durationOf(lecture: LectureEvent): number {
  const duration = toMinutes(lecture.endTime) - toMinutes(lecture.startTime);
  return duration < 0 ? duration + 24 * 60 : duration;
}

export function formatDay(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone });
}

export function lessonCount(count: number): string {
  if (count === 1) return '1 zajęcie';
  return `${count} ${count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'zajęcia' : 'zajęć'}`;
}
