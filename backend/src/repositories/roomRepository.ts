import { prisma } from '../db/prisma.js';
import type {
  RoomRow,
  ScheduleEntryRow,
  ScheduleEntryWithRoomMetadataRow
} from '../types/domain.js';
import { formatDateOnly, formatTimeValue, toDateOnly } from '../utils/prismaDate.js';

const mapRoomRow = (room: {
  id: number;
  roomCode: string;
  displayName: string;
  building: string;
  wing: string;
  floorLabel: string;
  createdAt: Date;
  updatedAt: Date;
}): RoomRow => ({
  id: room.id,
  room_code: room.roomCode,
  display_name: room.displayName,
  building: room.building,
  wing: room.wing,
  floor_label: room.floorLabel,
  created_at: room.createdAt,
  updated_at: room.updatedAt
});

const mapEntryRow = (entry: {
  id: number;
  title: string;
  lecturer: string;
  groupName: string;
  classType: string;
  startTime: Date;
  endTime: Date;
  description: string;
  note: string | null;
  fieldOfStudy: string | null;
  subjectCode: string | null;
  eventDate: Date;
  createdAt: Date;
  roomId: number;
}): ScheduleEntryRow => ({
  id: entry.id,
  title: entry.title,
  lecturer: entry.lecturer,
  group_name: entry.groupName,
  class_type: entry.classType,
  start_time: formatTimeValue(entry.startTime),
  end_time: formatTimeValue(entry.endTime),
  description: entry.description,
  note: entry.note,
  field_of_study: entry.fieldOfStudy,
  subject_code: entry.subjectCode,
  event_date: formatDateOnly(entry.eventDate),
  created_at: entry.createdAt,
  room_id: entry.roomId
});

export const findAllRooms = async (): Promise<RoomRow[]> => {
  const rooms = await prisma.room.findMany({
    orderBy: {
      roomCode: 'asc'
    }
  });

  return rooms.map(mapRoomRow);
};

export const findRoomByCode = async (roomCode: string): Promise<RoomRow | null> => {
  const room = await prisma.room.findFirst({
    where: {
      roomCode: {
        equals: roomCode.trim(),
        mode: 'insensitive'
      }
    }
  });

  return room ? mapRoomRow(room) : null;
};

export const findRoomScheduleForDate = async (
  roomId: number,
  eventDate: string
): Promise<ScheduleEntryRow[]> => {
  const entries = await prisma.scheduleEntry.findMany({
    where: {
      roomId,
      eventDate: toDateOnly(eventDate)
    },
    orderBy: {
      startTime: 'asc'
    }
  });

  return entries.map(mapEntryRow);
};

export const findScheduleForDate = async (
  eventDate: string
): Promise<ScheduleEntryWithRoomMetadataRow[]> => {
  const entries = await prisma.scheduleEntry.findMany({
    where: {
      eventDate: toDateOnly(eventDate)
    },
    include: {
      room: true
    },
    orderBy: [{ room: { roomCode: 'asc' } }, { startTime: 'asc' }]
  });

  return entries.map((entry) => ({
    ...mapEntryRow(entry),
    room_db_id: entry.room.id,
    room_code: entry.room.roomCode,
    display_name: entry.room.displayName,
    building: entry.room.building,
    wing: entry.room.wing,
    floor_label: entry.room.floorLabel
  }));
};
