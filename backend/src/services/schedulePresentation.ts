import type { ScheduleEntryRow } from '../types/domain.js';

export const toTimeString = (timeValue: string | Date): string => String(timeValue).slice(0, 5);

const toMinutes = (timeValue: string | Date): number => {
  const [hours, minutes] = toTimeString(timeValue).split(':').map(Number);
  return hours * 60 + minutes;
};

export const resolveStatus = (
  startTime: string | Date,
  endTime: string | Date,
  nowMinutes: number
): 'current' | 'upcoming' | 'finished' => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
    return 'current';
  }

  if (nowMinutes < startMinutes) {
    return 'upcoming';
  }

  return 'finished';
};

interface RoomMetadataSource {
  room_code: string;
  display_name: string;
  building: string;
  wing: string;
  floor_label: string;
}

export const mapRoomMetadata = (roomRow: RoomMetadataSource) => ({
  roomId: roomRow.room_code,
  name: roomRow.display_name,
  building: roomRow.building,
  wing: roomRow.wing,
  floor: roomRow.floor_label
});

export const mapEntryToLectureEvent = (
  entry: ScheduleEntryRow,
  roomCode: string,
  nowMinutes: number
) => {
  const startTime = toTimeString(entry.start_time);
  const endTime = toTimeString(entry.end_time);
  const status = resolveStatus(startTime, endTime, nowMinutes);

  return {
    id: `lec-${entry.id}`,
    title: entry.title,
    room: roomCode,
    lecturer: entry.lecturer,
    group: entry.group_name,
    type: entry.class_type,
    startTime,
    endTime,
    description: entry.description,
    note: entry.note ?? undefined,
    status,
    isCurrent: status === 'current',
    fieldOfStudy: entry.field_of_study ?? undefined,
    subjectCode: entry.subject_code ?? undefined
  };
};
