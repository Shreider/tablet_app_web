import type { LectureEvent, RoomScheduleResponse } from '../types/schedule';

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

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isLectureEvent = (value: unknown): value is LectureEvent => {
  if (!isObject(value)) return false;

  return (
    ['id', 'title', 'room', 'date', 'lecturer', 'group', 'type', 'startTime', 'endTime', 'description']
      .every((key) => typeof value[key] === 'string') &&
    ['note', 'fieldOfStudy', 'subjectCode', 'subject']
      .every((key) => value[key] === undefined || typeof value[key] === 'string') &&
    ['current', 'upcoming', 'finished'].includes(value.status as string) &&
    typeof value.isCurrent === 'boolean'
  );
};

const isRoomScheduleResponse = (value: unknown): value is RoomScheduleResponse => {
  if (!isObject(value) || !isObject(value.room)) return false;
  const room = value.room;

  return (
    ['roomId', 'name', 'building', 'floor'].every((key) => typeof room[key] === 'string') &&
    typeof value.date === 'string' &&
    typeof value.generatedAt === 'string' &&
    Array.isArray(value.schedule) && value.schedule.every(isLectureEvent) &&
    (value.currentLecture === null || isLectureEvent(value.currentLecture)) &&
    (value.nextLecture === null || isLectureEvent(value.nextLecture))
  );
};

const parseJsonResponse = async (response: Response): Promise<RoomScheduleResponse> => {
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

  if (!isRoomScheduleResponse(payload)) {
    throw new ApiError('Serwer API zwrócił nieprawidłowe dane planu sali.', 502);
  }

  return payload;
};

export const fetchRoomSchedule = async (
  roomId: string,
  signal?: AbortSignal
): Promise<RoomScheduleResponse> => {
  const response = await fetch(`${API_BASE_URL}/room/${encodeURIComponent(roomId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal
  });
  return parseJsonResponse(response);
};
