import { prismaAdmin } from '../../db/prisma.js';
import type { DashboardStats, RoomOptionRow, ScheduleEntryWithRoomRow } from '../../types/domain.js';
import { formatDateOnly, formatTimeValue, toDateOnly } from '../../utils/prismaDate.js';

export const fetchAdminDashboardStats = async (todayIso: string): Promise<DashboardStats> => {
  const date = toDateOnly(todayIso);

  const [rooms, scheduleEntries, todayEntries, roomsWithoutEntries, overlappingRows] =
    await Promise.all([
      prismaAdmin.room.count(),
      prismaAdmin.scheduleEntry.count(),
      prismaAdmin.scheduleEntry.count({
        where: {
          eventDate: date
        }
      }),
      prismaAdmin.room.count({
        where: {
          scheduleEntries: {
            none: {}
          }
        }
      }),
      prismaAdmin.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM schedule_entries a
        JOIN schedule_entries b
          ON a.room_id = b.room_id
         AND a.event_date = b.event_date
         AND a.id < b.id
         AND a.start_time < b.end_time
         AND b.start_time < a.end_time
      `
    ]);

  return {
    rooms,
    scheduleEntries,
    todayEntries,
    roomsWithoutEntries,
    overlappingEntries: Number(overlappingRows[0]?.count ?? 0)
  };
};

export const fetchRecentRooms = async (limit = 5) => {
  const rooms = await prismaAdmin.room.findMany({
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: {
      id: true,
      roomCode: true,
      displayName: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return rooms.map<RoomOptionRow & { created_at: Date; updated_at: Date }>((room) => ({
    id: room.id,
    room_code: room.roomCode,
    display_name: room.displayName,
    created_at: room.createdAt,
    updated_at: room.updatedAt
  }));
};

export const fetchRecentScheduleEntries = async (
  limit = 8
): Promise<ScheduleEntryWithRoomRow[]> => {
  const rows = await prismaAdmin.scheduleEntry.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    include: {
      room: {
        select: {
          id: true,
          roomCode: true,
          displayName: true
        }
      },
      lecturer: {
        select: {
          id: true,
          fullName: true
        }
      },
      studentGroup: {
        select: {
          id: true,
          name: true
        }
      },
      classType: {
        select: {
          id: true,
          name: true
        }
      },
      subject: {
        select: {
          id: true,
          code: true,
          name: true,
          fieldOfStudy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  return rows.map<ScheduleEntryWithRoomRow>((entry) => ({
    id: entry.id,
    room_id: entry.roomId,
    room_code: entry.room.roomCode,
    display_name: entry.room.displayName,
    event_date: formatDateOnly(entry.eventDate),
    title: entry.title,
    lecturer_id: entry.lecturerId,
    lecturer_name: entry.lecturer.fullName,
    group_id: entry.studentGroupId,
    group_name: entry.studentGroup.name,
    class_type_id: entry.classTypeId,
    class_type_name: entry.classType.name,
    subject_id: entry.subjectId,
    subject_code: entry.subject.code,
    subject_name: entry.subject.name,
    field_of_study_id: entry.subject.fieldOfStudy.id,
    field_of_study_name: entry.subject.fieldOfStudy.name,
    start_time: formatTimeValue(entry.startTime),
    end_time: formatTimeValue(entry.endTime),
    description: entry.description,
    note: entry.note,
    created_at: entry.createdAt
  }));
};
