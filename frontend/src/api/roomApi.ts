import type { RoomScheduleResponse, RoomsResponse, ScheduleResponse } from '../types/schedule';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Nie udalo sie pobrac danych z API.';

    throw new ApiError(errorMessage, response.status);
  }

  return payload as T;
};

export const fetchRoomSchedule = async (roomId: string, signal?: AbortSignal): Promise<RoomScheduleResponse> => {
  const response = await fetch(`${API_BASE_URL}/room/${encodeURIComponent(roomId)}`, { signal });
  return parseJsonResponse<RoomScheduleResponse>(response);
};

export const fetchRooms = async (signal?: AbortSignal): Promise<RoomsResponse> => {
  const response = await fetch(`${API_BASE_URL}/rooms`, { signal });
  return parseJsonResponse<RoomsResponse>(response);
};

export const fetchSchedule = async (date?: string, signal?: AbortSignal): Promise<ScheduleResponse> => {
  const search = date ? `?date=${encodeURIComponent(date)}` : '';
  const response = await fetch(`${API_BASE_URL}/schedule${search}`, { signal });
  return parseJsonResponse<ScheduleResponse>(response);
};
