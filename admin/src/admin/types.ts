export interface AdminRoom {
  id: number;
  roomCode: string;
  displayName: string;
  building: string;
  wing: string;
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
  lecturer: string;
  groupName: string;
  classType: string;
  startTime: string;
  endTime: string;
  description: string;
  note: string | null;
  fieldOfStudy: string | null;
  subjectCode: string | null;
  createdAt: string;
}

export interface AdminRoomOption {
  id: number;
  roomCode: string;
  displayName: string;
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
  buildings: string[];
  floorLabels: string[];
}

export interface AdminScheduleOptionsResponse {
  rooms: AdminRoomOption[];
  classTypes: string[];
}
