import type {
  BuildingRow,
  ClassTypeRow,
  FieldOfStudyRow,
  FloorRow,
  LecturerRow,
  ReferenceOptionRow,
  RoomOptionRow,
  RoomWithEntriesCountRow,
  ScheduleEntryWithRoomRow,
  StudentGroupRow,
  SubjectRow,
  WingRow
} from '../types/domain.js';

const toTimeString = (value: string | Date): string => String(value).slice(0, 5);

export const mapRoomRecord = (row: RoomWithEntriesCountRow) => ({
  id: row.id,
  roomCode: row.room_code,
  displayName: row.display_name,
  buildingId: row.building_id,
  buildingName: row.building_name,
  wingId: row.wing_id,
  wingName: row.wing_name,
  floorId: row.floor_id,
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
  lecturerId: row.lecturer_id,
  lecturerName: row.lecturer_name,
  studentGroupId: row.group_id,
  studentGroupName: row.group_name,
  classTypeId: row.class_type_id,
  classTypeName: row.class_type_name,
  subjectId: row.subject_id,
  subjectCode: row.subject_code,
  subjectName: row.subject_name,
  fieldOfStudyId: row.field_of_study_id,
  fieldOfStudyName: row.field_of_study_name,
  startTime: toTimeString(row.start_time),
  endTime: toTimeString(row.end_time),
  description: row.description,
  note: row.note,
  createdAt: row.created_at
});

export const mapRoomOption = (row: RoomOptionRow) => ({
  id: row.id,
  roomCode: row.room_code,
  displayName: row.display_name
});

export const mapReferenceOption = (row: ReferenceOptionRow) => ({
  id: row.id,
  name: row.name
});

export const mapBuildingRecord = (row: BuildingRow) => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapWingRecord = (row: WingRow) => ({
  id: row.id,
  buildingId: row.building_id,
  buildingName: row.building_name,
  name: row.name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapFloorRecord = (row: FloorRow) => ({
  id: row.id,
  label: row.label,
  sortOrder: row.sort_order,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapLecturerRecord = (row: LecturerRow) => ({
  id: row.id,
  fullName: row.full_name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapStudentGroupRecord = (row: StudentGroupRow) => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapClassTypeRecord = (row: ClassTypeRow) => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapFieldOfStudyRecord = (row: FieldOfStudyRow) => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapSubjectRecord = (row: SubjectRow) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  fieldOfStudyId: row.field_of_study_id,
  fieldOfStudyName: row.field_of_study_name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});
