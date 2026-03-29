export type SortOrder = 'asc' | 'desc';

export interface RoomRow {
  id: number;
  room_code: string;
  display_name: string;
  building: string;
  wing: string;
  floor_label: string;
  created_at: Date;
  updated_at: Date;
}

export interface RoomWithEntriesCountRow extends RoomRow {
  entries_count: number;
}

export interface RoomOptionRow {
  id: number;
  room_code: string;
  display_name: string;
}

export interface ScheduleEntryRow {
  id: number;
  room_id: number;
  event_date: string;
  title: string;
  lecturer: string;
  group_name: string;
  class_type: string;
  start_time: string;
  end_time: string;
  description: string;
  note: string | null;
  field_of_study: string | null;
  subject_code: string | null;
  created_at: Date;
}

export interface ScheduleEntryWithRoomRow extends ScheduleEntryRow {
  room_code: string;
  display_name: string;
}

export interface ScheduleEntryWithRoomMetadataRow extends ScheduleEntryWithRoomRow {
  building: string;
  wing: string;
  floor_label: string;
}

export interface DashboardStats {
  rooms: number;
  scheduleEntries: number;
  todayEntries: number;
  roomsWithoutEntries: number;
  overlappingEntries: number;
}

export interface DashboardWarning {
  code: string;
  level: 'warning' | 'critical';
  message: string;
}

export interface RoomPayload {
  roomCode: string;
  displayName: string;
  building: string;
  wing: string;
  floorLabel: string;
}

export interface ScheduleEntryPayload {
  roomId: number;
  eventDate: string;
  title: string;
  lecturer: string;
  groupName: string;
  classType: string;
  startTime: string;
  endTime: string;
  description: string;
  note: string | null;
  fieldOfStudy: string | null;
  subjectCode: string | null;
}

export interface PaginationResult<T> {
  total: number;
  page: number;
  limit: number;
  rows: T[];
}
