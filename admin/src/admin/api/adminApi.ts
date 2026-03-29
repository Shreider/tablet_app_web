import type {
  AdminDashboardResponse,
  AdminReferenceDependency,
  AdminReferenceEntity,
  AdminReferencesDatasetResponse,
  AdminRoom,
  AdminRoomsOptionsResponse,
  AdminScheduleEntry,
  AdminScheduleOptionsResponse,
  PaginatedResponse
} from '../types';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export class AdminApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.payload = payload;
  }
}

const buildAuthHeaders = (token: string | null | undefined): HeadersInit => {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Admin API request failed.';

    throw new AdminApiError(message, response.status, payload);
  }

  return payload as T;
};

const toQueryString = (params: Record<string, string | number | undefined | null>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const encoded = searchParams.toString();
  return encoded ? `?${encoded}` : '';
};

export const adminLogin = async (token: string): Promise<{ token: string; role: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  return parseJsonResponse<{ token: string; role: string }>(response);
};

export const validateAdminSession = async (token: string): Promise<{ authenticated: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/admin/auth/session`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<{ authenticated: boolean }>(response);
};

export const fetchAdminDashboard = async (token: string): Promise<AdminDashboardResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<AdminDashboardResponse>(response);
};

export interface FetchAdminRoomsParams {
  page?: number;
  limit?: number;
  search?: string;
  buildingId?: number | null;
  wingId?: number | null;
  floorId?: number | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const fetchAdminRooms = async (
  token: string,
  params: FetchAdminRoomsParams
): Promise<PaginatedResponse<AdminRoom>> => {
  const queryString = toQueryString(params as Record<string, string | number | undefined | null>);
  const response = await fetch(`${API_BASE_URL}/admin/rooms${queryString}`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<PaginatedResponse<AdminRoom>>(response);
};

export const fetchAdminRoomsOptions = async (token: string): Promise<AdminRoomsOptionsResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/rooms/options`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<AdminRoomsOptionsResponse>(response);
};

export const fetchAdminRoomDetails = async (
  token: string,
  roomId: number
): Promise<{ room: AdminRoom; relatedScheduleEntries: AdminScheduleEntry[] }> => {
  const response = await fetch(`${API_BASE_URL}/admin/rooms/${roomId}`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<{ room: AdminRoom; relatedScheduleEntries: AdminScheduleEntry[] }>(response);
};

export interface RoomFormPayload {
  roomCode: string;
  displayName: string;
  buildingId: number;
  wingId: number;
  floorId: number;
}

export const createAdminRoom = async (
  token: string,
  payload: RoomFormPayload
): Promise<{ room: AdminRoom }> => {
  const response = await fetch(`${API_BASE_URL}/admin/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<{ room: AdminRoom }>(response);
};

export const updateAdminRoom = async (
  token: string,
  roomId: number,
  payload: RoomFormPayload
): Promise<{ room: AdminRoom }> => {
  const response = await fetch(`${API_BASE_URL}/admin/rooms/${roomId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<{ room: AdminRoom }>(response);
};

export const deleteAdminRoom = async (
  token: string,
  roomId: number,
  cascade = false
): Promise<{ deleted: boolean; relatedEntriesDeleted: number }> => {
  const queryString = cascade ? '?cascade=true' : '';
  const response = await fetch(`${API_BASE_URL}/admin/rooms/${roomId}${queryString}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<{ deleted: boolean; relatedEntriesDeleted: number }>(response);
};

export interface FetchScheduleEntriesParams {
  page?: number;
  limit?: number;
  search?: string;
  roomId?: number | null;
  classTypeId?: number | null;
  lecturerId?: number | null;
  studentGroupId?: number | null;
  subjectId?: number | null;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const fetchAdminScheduleEntries = async (
  token: string,
  params: FetchScheduleEntriesParams
): Promise<PaginatedResponse<AdminScheduleEntry>> => {
  const queryString = toQueryString(params as Record<string, string | number | undefined | null>);
  const response = await fetch(`${API_BASE_URL}/admin/schedule-entries${queryString}`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<PaginatedResponse<AdminScheduleEntry>>(response);
};

export const fetchAdminScheduleOptions = async (
  token: string
): Promise<AdminScheduleOptionsResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/schedule-entries/options`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<AdminScheduleOptionsResponse>(response);
};

export const fetchAdminScheduleEntryDetails = async (
  token: string,
  entryId: number
): Promise<{ entry: AdminScheduleEntry }> => {
  const response = await fetch(`${API_BASE_URL}/admin/schedule-entries/${entryId}`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<{ entry: AdminScheduleEntry }>(response);
};

export interface ScheduleEntryFormPayload {
  roomId: number;
  eventDate: string;
  lecturerId: number;
  studentGroupId: number;
  classTypeId: number;
  subjectId: number;
  startTime: string;
  endTime: string;
  description: string;
  note: string;
}

const normalizeSchedulePayload = (payload: ScheduleEntryFormPayload) => ({
  ...payload,
  note: payload.note.trim() || null
});

export const createAdminScheduleEntry = async (
  token: string,
  payload: ScheduleEntryFormPayload
): Promise<{ entry: AdminScheduleEntry }> => {
  const response = await fetch(`${API_BASE_URL}/admin/schedule-entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(normalizeSchedulePayload(payload))
  });

  return parseJsonResponse<{ entry: AdminScheduleEntry }>(response);
};

export const updateAdminScheduleEntry = async (
  token: string,
  entryId: number,
  payload: ScheduleEntryFormPayload
): Promise<{ entry: AdminScheduleEntry }> => {
  const response = await fetch(`${API_BASE_URL}/admin/schedule-entries/${entryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(normalizeSchedulePayload(payload))
  });

  return parseJsonResponse<{ entry: AdminScheduleEntry }>(response);
};

export const deleteAdminScheduleEntry = async (
  token: string,
  entryId: number
): Promise<{ deleted: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/admin/schedule-entries/${entryId}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<{ deleted: boolean }>(response);
};

export const fetchAdminReferencesDataset = async (
  token: string
): Promise<AdminReferencesDatasetResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/references`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<AdminReferencesDatasetResponse>(response);
};

export const fetchAdminReferenceDependencies = async (
  token: string,
  entity: AdminReferenceEntity,
  id: number
): Promise<{ entity: AdminReferenceEntity; id: number; dependencies: AdminReferenceDependency[] }> => {
  const response = await fetch(`${API_BASE_URL}/admin/references/${entity}/${id}/dependencies`, {
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<{ entity: AdminReferenceEntity; id: number; dependencies: AdminReferenceDependency[] }>(
    response
  );
};

export const createAdminReference = async (
  token: string,
  entity: AdminReferenceEntity,
  payload: Record<string, unknown>
): Promise<{ entity: AdminReferenceEntity; id: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/references/${entity}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<{ entity: AdminReferenceEntity; id: number }>(response);
};

export const updateAdminReference = async (
  token: string,
  entity: AdminReferenceEntity,
  id: number,
  payload: Record<string, unknown>
): Promise<{ entity: AdminReferenceEntity; id: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/references/${entity}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<{ entity: AdminReferenceEntity; id: number }>(response);
};

export const deleteAdminReference = async (
  token: string,
  entity: AdminReferenceEntity,
  id: number
): Promise<{ entity: AdminReferenceEntity; deleted: boolean; id: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/references/${entity}/${id}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(token)
    }
  });

  return parseJsonResponse<{ entity: AdminReferenceEntity; deleted: boolean; id: number }>(response);
};
