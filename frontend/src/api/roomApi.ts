import type { RoomScheduleResponse } from '../types/schedule';
import { RoomSchedule, validDate } from '../../shared/roomSchedule.mjs';
import { defaultApiEndpoint, resolveApiEndpoint } from '../lib/apiEndpoint';

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

const parseJsonResponse = async (response: Response, roomId: string): Promise<RoomScheduleResponse> => {
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

  try {
    const data = RoomSchedule.fromJSON(payload, { roomId }).toJSON();
    if (isObject(payload) && isObject(payload.cache)) {
      const cache = payload.cache;
      if (typeof cache.fetchedAt !== 'string' || !Number.isFinite(Date.parse(cache.fetchedAt)) ||
        typeof cache.timeZone !== 'string' || !validDate(cache.requestedDate) ||
        !['stale', 'outdated', 'imported'].every((key) => typeof cache[key] === 'boolean')) {
        throw new Error('Nieprawidłowe metadane kopii.');
      }
      new Intl.DateTimeFormat('pl-PL', { timeZone: cache.timeZone });
      data.cache = cache as unknown as NonNullable<RoomScheduleResponse['cache']>;
    }
    return data;
  } catch {
    throw new ApiError('Serwer API zwrócił nieprawidłowe dane planu sali.', 502);
  }
};

export const fetchRoomSchedule = async (
  roomId: string,
  signal?: AbortSignal,
  endpoint = defaultApiEndpoint,
  forceRefresh = false
): Promise<RoomScheduleResponse> => {
  const url = new URL(resolveApiEndpoint(endpoint, roomId), window.location.origin);
  if (forceRefresh && endpoint === defaultApiEndpoint) url.searchParams.set('refresh', '1');
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal
  });
  return parseJsonResponse(response, roomId);
};
