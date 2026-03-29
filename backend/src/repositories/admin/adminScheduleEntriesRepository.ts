import type { Prisma } from '@prisma/client';
import { prismaAdmin } from '../../db/prisma.js';
import type {
  PaginationResult,
  ScheduleEntryPayload,
  ScheduleEntryWithRoomRow,
  SortOrder
} from '../../types/domain.js';
import { formatDateOnly, formatTimeValue, toDateOnly, toTimeValue } from '../../utils/prismaDate.js';

type EntrySortBy =
  | 'id'
  | 'eventDate'
  | 'startTime'
  | 'endTime'
  | 'title'
  | 'lecturer'
  | 'classType'
  | 'createdAt'
  | 'roomCode';

interface ListScheduleEntriesParams {
  page: number;
  limit: number;
  offset: number;
  search: string;
  roomId: number | null;
  classType: string;
  dateFrom: string | null;
  dateTo: string | null;
  lecturer: string;
  sortBy: string;
  sortOrder: SortOrder;
}

const toRow = (entry: {
  id: number;
  roomId: number;
  room: { roomCode: string; displayName: string };
  eventDate: Date;
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
  createdAt: Date;
}): ScheduleEntryWithRoomRow => ({
  id: entry.id,
  room_id: entry.roomId,
  room_code: entry.room.roomCode,
  display_name: entry.room.displayName,
  event_date: formatDateOnly(entry.eventDate),
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
  created_at: entry.createdAt
});

const buildWhere = ({
  search,
  roomId,
  classType,
  dateFrom,
  dateTo,
  lecturer
}: Pick<
  ListScheduleEntriesParams,
  'search' | 'roomId' | 'classType' | 'dateFrom' | 'dateTo' | 'lecturer'
>): Prisma.ScheduleEntryWhereInput => {
  const where: Prisma.ScheduleEntryWhereInput = {};
  const andFilters: Prisma.ScheduleEntryWhereInput[] = [];

  if (search) {
    andFilters.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { lecturer: { contains: search, mode: 'insensitive' } },
        { groupName: { contains: search, mode: 'insensitive' } },
        { classType: { contains: search, mode: 'insensitive' } },
        { subjectCode: { contains: search, mode: 'insensitive' } },
        { room: { roomCode: { contains: search, mode: 'insensitive' } } }
      ]
    });
  }

  if (roomId) {
    andFilters.push({ roomId });
  }

  if (classType) {
    andFilters.push({ classType });
  }

  if (lecturer) {
    andFilters.push({
      lecturer: {
        contains: lecturer,
        mode: 'insensitive'
      }
    });
  }

  if (dateFrom || dateTo) {
    andFilters.push({
      eventDate: {
        ...(dateFrom ? { gte: toDateOnly(dateFrom) } : {}),
        ...(dateTo ? { lte: toDateOnly(dateTo) } : {})
      }
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return where;
};

const resolveOrderBy = (
  sortBy: string,
  sortOrder: SortOrder
): Prisma.ScheduleEntryOrderByWithRelationInput[] => {
  const safeSortBy = sortBy as EntrySortBy;

  switch (safeSortBy) {
    case 'id':
      return [{ id: sortOrder }];
    case 'eventDate':
      return [{ eventDate: sortOrder }, { startTime: sortOrder }];
    case 'startTime':
      return [{ startTime: sortOrder }, { id: sortOrder }];
    case 'endTime':
      return [{ endTime: sortOrder }, { id: sortOrder }];
    case 'title':
      return [{ title: sortOrder }, { id: sortOrder }];
    case 'lecturer':
      return [{ lecturer: sortOrder }, { id: sortOrder }];
    case 'classType':
      return [{ classType: sortOrder }, { id: sortOrder }];
    case 'createdAt':
      return [{ createdAt: sortOrder }, { id: sortOrder }];
    case 'roomCode':
      return [{ room: { roomCode: sortOrder } }, { eventDate: sortOrder }, { startTime: sortOrder }];
    default:
      return [{ eventDate: sortOrder }, { startTime: sortOrder }, { id: sortOrder }];
  }
};

export const listAdminScheduleEntries = async ({
  page,
  limit,
  offset,
  search,
  roomId,
  classType,
  dateFrom,
  dateTo,
  lecturer,
  sortBy,
  sortOrder
}: ListScheduleEntriesParams): Promise<PaginationResult<ScheduleEntryWithRoomRow>> => {
  const where = buildWhere({
    search,
    roomId,
    classType,
    dateFrom,
    dateTo,
    lecturer
  });

  const [total, rows] = await Promise.all([
    prismaAdmin.scheduleEntry.count({ where }),
    prismaAdmin.scheduleEntry.findMany({
      where,
      include: {
        room: {
          select: {
            roomCode: true,
            displayName: true
          }
        }
      },
      orderBy: resolveOrderBy(sortBy, sortOrder),
      skip: offset,
      take: limit
    })
  ]);

  return {
    total,
    page,
    limit,
    rows: rows.map(toRow)
  };
};

export const findAdminScheduleEntryById = async (
  entryId: number
): Promise<ScheduleEntryWithRoomRow | null> => {
  const entry = await prismaAdmin.scheduleEntry.findUnique({
    where: {
      id: entryId
    },
    include: {
      room: {
        select: {
          roomCode: true,
          displayName: true
        }
      }
    }
  });

  return entry ? toRow(entry) : null;
};

export const createAdminScheduleEntry = async ({
  roomId,
  eventDate,
  title,
  lecturer,
  groupName,
  classType,
  startTime,
  endTime,
  description,
  note,
  fieldOfStudy,
  subjectCode
}: ScheduleEntryPayload): Promise<number> => {
  const entry = await prismaAdmin.scheduleEntry.create({
    data: {
      roomId,
      eventDate: toDateOnly(eventDate),
      title,
      lecturer,
      groupName,
      classType,
      startTime: toTimeValue(startTime),
      endTime: toTimeValue(endTime),
      description,
      note,
      fieldOfStudy,
      subjectCode
    },
    select: {
      id: true
    }
  });

  return entry.id;
};

export const updateAdminScheduleEntry = async (
  entryId: number,
  {
    roomId,
    eventDate,
    title,
    lecturer,
    groupName,
    classType,
    startTime,
    endTime,
    description,
    note,
    fieldOfStudy,
    subjectCode
  }: ScheduleEntryPayload
): Promise<number> => {
  const entry = await prismaAdmin.scheduleEntry.update({
    where: {
      id: entryId
    },
    data: {
      roomId,
      eventDate: toDateOnly(eventDate),
      title,
      lecturer,
      groupName,
      classType,
      startTime: toTimeValue(startTime),
      endTime: toTimeValue(endTime),
      description,
      note,
      fieldOfStudy,
      subjectCode
    },
    select: {
      id: true
    }
  });

  return entry.id;
};

export const deleteAdminScheduleEntry = async (entryId: number): Promise<number> => {
  const entry = await prismaAdmin.scheduleEntry.delete({
    where: {
      id: entryId
    },
    select: {
      id: true
    }
  });

  return entry.id;
};

export const listDistinctClassTypes = async (): Promise<string[]> => {
  const rows = await prismaAdmin.scheduleEntry.findMany({
    distinct: ['classType'],
    select: {
      classType: true
    },
    orderBy: {
      classType: 'asc'
    }
  });

  return rows.map((row) => row.classType);
};

export const listDistinctBuildings = async (): Promise<string[]> => {
  const rows = await prismaAdmin.room.findMany({
    distinct: ['building'],
    select: {
      building: true
    },
    orderBy: {
      building: 'asc'
    }
  });

  return rows.map((row) => row.building);
};
