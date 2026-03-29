import type {
  RoomOptionRow,
  RoomWithEntriesCountRow,
  ScheduleEntryWithRoomRow
} from '../types/domain.js';

const toTimeString = (value: string | Date): string => String(value).slice(0, 5);

export const mapRoomRecord = (row: RoomWithEntriesCountRow) => ({
  id: row.id,
  roomCode: row.room_code,
  displayName: row.display_name,
  building: row.building,
  wing: row.wing,
  floorLabel: row.floor_label,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  entriesCount: row.entries_count ?? 0
});

export const mapScheduleEntryRecord = (row: ScheduleEntryWithRoomRow) => ({
  id: row.id,
  roomId: row.room_id,
  roomCode: row.room_code,
  roomDisplayName: row.display_name,
  eventDate: row.event_date,
  title: row.title,
  lecturer: row.lecturer,
  groupName: row.group_name,
  classType: row.class_type,
  startTime: toTimeString(row.start_time),
  endTime: toTimeString(row.end_time),
  description: row.description,
  note: row.note,
  fieldOfStudy: row.field_of_study,
  subjectCode: row.subject_code,
  createdAt: row.created_at
});

export const mapRoomOption = (row: RoomOptionRow) => ({
  id: row.id,
  roomCode: row.room_code,
  displayName: row.display_name
});
