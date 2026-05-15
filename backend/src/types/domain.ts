export type SortOrder = 'asc' | 'desc';

export interface RoomRow {
  id: number;
  room_code: string;
  display_name: string;
  building_id: number;
  building_name: string;
  wing_id: number;
  wing_name: string;
  floor_id: number;
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

export interface ReferenceOptionRow {
  id: number;
  name: string;
}

export interface BuildingRow {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WingRow {
  id: number;
  building_id: number;
  building_name: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FloorRow {
  id: number;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LecturerRow {
  id: number;
  full_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StudentGroupRow {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ClassTypeRow {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FieldOfStudyRow {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SubjectRow {
  id: number;
  code: string;
  name: string;
  field_of_study_id: number;
  field_of_study_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ScheduleEntryRow {
  id: number;
  room_id: number;
  event_date: string;
  title: string;
  lecturer_id: number;
  lecturer_name: string;
  group_id: number;
  group_name: string;
  class_type_id: number;
  class_type_name: string;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  field_of_study_id: number;
  field_of_study_name: string;
  start_time: string;
  end_time: string;
  description: string;
  note: string | null;
  created_at: Date;
}

export interface ScheduleEntryWithRoomRow extends ScheduleEntryRow {
  room_code: string;
  display_name: string;
}

export interface ScheduleEntryWithRoomMetadataRow extends ScheduleEntryWithRoomRow {
  building_name: string;
  wing_name: string;
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
  buildingId: number;
  wingId: number;
  floorId: number;
}

export interface ScheduleEntryPayload {
  roomId: number;
  eventDate: string;
  lecturerId: number;
  studentGroupId: number;
  classTypeId: number;
  subjectId: number;
  startTime: string;
  endTime: string;
  description: string;
  note: string | null;
}

export interface PaginationResult<T> {
  total: number;
  page: number;
  limit: number;
  rows: T[];
}
