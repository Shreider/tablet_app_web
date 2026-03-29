import { env } from '../config/env.js';
import { getDateAndMinutesInTimezone } from '../db/time.js';
import { findScheduleForDate } from '../repositories/roomRepository.js';
import type { AppError } from '../types/errors.js';
import { createError } from '../types/errors.js';
import { mapEntryToLectureEvent, mapRoomMetadata } from './schedulePresentation.js';
import { getRoomSchedule } from './roomService.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidIsoDate = (dateText: string): boolean => {
  if (!DATE_PATTERN.test(dateText)) {
    return false;
  }

  const [year, month, day] = dateText.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
};

export const resolveDateFilter = (dateQuery: string | null): string => {
  if (!dateQuery) {
    return getDateAndMinutesInTimezone(env.timezone).dateIso;
  }

  if (!isValidIsoDate(dateQuery)) {
    throw createError('Invalid date format. Use YYYY-MM-DD.', 'INVALID_DATE');
  }

  return dateQuery;
};

export const getSchedule = async (dateQuery: string | null = null) => {
  const dateIso = resolveDateFilter(dateQuery);
  const { minutes } = getDateAndMinutesInTimezone(env.timezone);

  const rows = await findScheduleForDate(dateIso);

  const events = rows.map((row) => ({
    room: mapRoomMetadata(row),
    lecture: mapEntryToLectureEvent(row, row.room_code, minutes)
  }));

  return {
    date: dateIso,
    generatedAt: new Date().toISOString(),
    total: events.length,
    events
  };
};

export const getScheduleForRoom = async (roomId: string, dateQuery: string | null = null) => {
  const dateIso = resolveDateFilter(dateQuery);
  return getRoomSchedule(roomId, dateIso);
};

export const isInvalidDateError = (error: unknown): error is AppError =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as AppError).code === 'INVALID_DATE';
