import type { RoomScheduleResponse } from '../types/schedule';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

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
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'Nie udało się pobrać planu zajęć.';

    throw new ApiError(errorMessage, response.status);
  }

  return payload as T;
};

export const fetchRoomSchedule = async (
  roomId: string,
  signal?: AbortSignal
): Promise<RoomScheduleResponse> => {
  const response = await fetch(`${API_BASE_URL}/room/${encodeURIComponent(roomId)}`, { signal });
  return parseJsonResponse<RoomScheduleResponse>(response);
};
