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
