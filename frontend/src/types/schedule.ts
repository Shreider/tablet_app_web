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
  fieldOfStudy?: string;
  subjectCode?: string;
}

export interface RoomDetails {
  roomId: string;
  name: string;
  building: string;
  wing: string;
  floor: string;
}

export interface RoomScheduleResponse {
  room: RoomDetails;
  date: string;
  generatedAt: string;
  currentLecture: LectureEvent | null;
  nextLecture: LectureEvent | null;
  schedule: LectureEvent[];
}

export interface RoomsResponse {
  generatedAt: string;
  total: number;
  rooms: RoomDetails[];
}

export interface ScheduleEventRow {
  room: RoomDetails;
  lecture: LectureEvent;
}

export interface ScheduleResponse {
  date: string;
  generatedAt: string;
  total: number;
  events: ScheduleEventRow[];
}
