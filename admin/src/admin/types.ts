export interface AdminRoom {
  id: number;
  roomCode: string;
  displayName: string;
  buildingId: number;
  buildingName: string;
  wingId: number;
  wingName: string;
  floorId: number;
  floorLabel: string;
  createdAt: string;
  updatedAt: string;
  entriesCount: number;
}

export interface AdminScheduleEntry {
  id: number;
  roomId: number;
  roomCode: string;
  roomDisplayName: string;
  eventDate: string;
  title: string;
  lecturerId: number;
  lecturerName: string;
  studentGroupId: number;
  studentGroupName: string;
  classTypeId: number;
  classTypeName: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  fieldOfStudyId: number;
  fieldOfStudyName: string;
  startTime: string;
  endTime: string;
  description: string;
  note: string | null;
  createdAt: string;
}

export interface AdminRoomOption {
  id: number;
  roomCode: string;
  displayName: string;
}

export interface AdminReferenceOption {
  id: number;
  name: string;
}

export interface AdminWingOption {
  id: number;
  name: string;
  buildingId: number;
  buildingName: string;
}

export interface AdminFloorOption {
  id: number;
  label: string;
}

export interface AdminSubject {
  id: number;
  code: string;
  name: string;
  fieldOfStudyId: number;
  fieldOfStudyName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  rows: T[];
}

export interface AdminDashboardStats {
  rooms: number;
  scheduleEntries: number;
  todayEntries: number;
  roomsWithoutEntries: number;
  overlappingEntries: number;
}

export interface AdminDashboardWarning {
  code: string;
  level: 'warning' | 'critical';
  message: string;
}

export interface AdminDashboardResponse {
  generatedAt: string;
  date: string;
  stats: AdminDashboardStats;
  recentRooms: Array<{
    id: number;
    room_code: string;
    display_name: string;
    created_at: string;
    updated_at: string;
  }>;
  recentEntries: AdminScheduleEntry[];
  warnings: AdminDashboardWarning[];
}

export interface AdminRoomsOptionsResponse {
  rooms: AdminRoomOption[];
  buildings: AdminReferenceOption[];
  wings: AdminWingOption[];
  floors: AdminFloorOption[];
}

export interface AdminScheduleOptionsResponse {
  rooms: AdminRoomOption[];
  lecturers: AdminReferenceOption[];
  studentGroups: AdminReferenceOption[];
  classTypes: AdminReferenceOption[];
  subjects: AdminSubject[];
}

export interface AdminBuilding {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWing {
  id: number;
  buildingId: number;
  buildingName: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFloor {
  id: number;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLecturer {
  id: number;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStudentGroup {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminClassType {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFieldOfStudy {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReferencesDatasetResponse {
  buildings: AdminBuilding[];
  wings: AdminWing[];
  floors: AdminFloor[];
  lecturers: AdminLecturer[];
  studentGroups: AdminStudentGroup[];
  classTypes: AdminClassType[];
  fieldsOfStudy: AdminFieldOfStudy[];
  subjects: AdminSubject[];
}

export type AdminReferenceEntity =
  | 'buildings'
  | 'wings'
  | 'floors'
  | 'lecturers'
  | 'student-groups'
  | 'class-types'
  | 'fields-of-study'
  | 'subjects';

export interface AdminReferenceDependency {
  key: string;
  count: number;
  message: string;
}
