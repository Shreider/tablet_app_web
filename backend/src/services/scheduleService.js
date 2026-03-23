import { env } from '../config/env.js';
import { getDateAndMinutesInTimezone } from '../db/time.js';
import { findScheduleForDate } from '../repositories/roomRepository.js';
import { mapEntryToLectureEvent, mapRoomMetadata } from './schedulePresentation.js';
import { getRoomSchedule } from './roomService.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidIsoDate = (dateText) => {
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

export const resolveDateFilter = (dateQuery) => {
  if (!dateQuery) {
    return getDateAndMinutesInTimezone(env.timezone).dateIso;
  }

  if (!isValidIsoDate(dateQuery)) {
    const error = new Error('Invalid date format. Use YYYY-MM-DD.');
    error.code = 'INVALID_DATE';
    throw error;
  }

  return dateQuery;
};

export const getSchedule = async (dateQuery = null) => {
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

export const getScheduleForRoom = async (roomId, dateQuery = null) => {
  const dateIso = resolveDateFilter(dateQuery);
  return getRoomSchedule(roomId, dateIso);
};
