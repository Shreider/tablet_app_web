export type LectureStatus = 'current' | 'upcoming' | 'finished';

export interface LectureEvent {
  id: string;
  title: string;
  room: string;
  lecturer: string;
  group: string;
  type: string;
  startTime: string;
  endTime: string;
  description: string;
  note?: string;
  status: LectureStatus;
  isCurrent: boolean;
}
