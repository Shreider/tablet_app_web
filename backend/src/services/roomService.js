import { env } from '../config/env.js';
import { getDateAndMinutesInTimezone } from '../db/time.js';
import { findRoomByCode, findRoomScheduleForDate } from '../repositories/roomRepository.js';
import { mapEntryToLectureEvent, mapRoomMetadata } from './schedulePresentation.js';

export const getRoomSchedule = async (roomId, explicitDate = null) => {
  const normalizedRoomId = roomId.trim();
  if (!normalizedRoomId) {
    return null;
  }

  const room = await findRoomByCode(normalizedRoomId);

  if (!room) {
    return null;
  }

  const { dateIso: todayInTimezone, minutes } = getDateAndMinutesInTimezone(env.timezone);
  const dateIso = explicitDate ?? todayInTimezone;
  const entries = await findRoomScheduleForDate(room.id, dateIso);
  const schedule = entries.map((entry) => mapEntryToLectureEvent(entry, room.room_code, minutes));

  const currentLecture = schedule.find((lecture) => lecture.status === 'current') ?? null;
  const nextLecture = schedule.find((lecture) => lecture.status === 'upcoming') ?? null;

  return {
    room: mapRoomMetadata(room),
    date: dateIso,
    generatedAt: new Date().toISOString(),
    currentLecture,
    nextLecture,
    schedule
  };
};
