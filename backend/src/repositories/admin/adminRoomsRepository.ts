import type { Prisma } from '@prisma/client';
import { prismaAdmin } from '../../db/prisma.js';
import type {
  PaginationResult,
  RoomOptionRow,
  RoomPayload,
  RoomWithEntriesCountRow,
  ScheduleEntryWithRoomRow,
  SortOrder
} from '../../types/domain.js';
import { formatDateOnly, formatTimeValue } from '../../utils/prismaDate.js';

type RoomSortBy =
  | 'id'
  | 'roomCode'
  | 'displayName'
  | 'building'
  | 'wing'
  | 'floorLabel'
  | 'createdAt'
  | 'updatedAt'
  | 'entriesCount';

interface ListAdminRoomsParams {
  page: number;
  limit: number;
  offset: number;
  search: string;
  building: string;
  floorLabel: string;
  sortBy: string;
  sortOrder: SortOrder;
}

const mapRoom = (room: {
  id: number;
  roomCode: string;
  displayName: string;
  building: string;
  wing: string;
  floorLabel: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { scheduleEntries: number };
}): RoomWithEntriesCountRow => ({
  id: room.id,
  room_code: room.roomCode,
  display_name: room.displayName,
  building: room.building,
  wing: room.wing,
  floor_label: room.floorLabel,
  created_at: room.createdAt,
  updated_at: room.updatedAt,
  entries_count: room._count?.scheduleEntries ?? 0
});

const mapEntrySummary = (
  entry: {
    id: number;
    roomId: number;
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
    room: { roomCode: string; displayName: string };
  }
): ScheduleEntryWithRoomRow => ({
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

const buildRoomWhere = ({
  search,
  building,
  floorLabel
}: Pick<ListAdminRoomsParams, 'search' | 'building' | 'floorLabel'>): Prisma.RoomWhereInput => {
  const where: Prisma.RoomWhereInput = {};

  if (search) {
    where.OR = [
      { roomCode: { contains: search, mode: 'insensitive' } },
      { displayName: { contains: search, mode: 'insensitive' } },
      { building: { contains: search, mode: 'insensitive' } },
      { wing: { contains: search, mode: 'insensitive' } },
      { floorLabel: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (building) {
    where.building = building;
  }

  if (floorLabel) {
    where.floorLabel = floorLabel;
  }

  return where;
};

const resolveOrderBy = (sortBy: string, sortOrder: SortOrder): Prisma.RoomOrderByWithRelationInput[] => {
  const safeSortBy = sortBy as RoomSortBy;

  switch (safeSortBy) {
    case 'id':
      return [{ id: sortOrder }, { roomCode: 'asc' }];
    case 'roomCode':
      return [{ roomCode: sortOrder }, { id: 'asc' }];
    case 'displayName':
      return [{ displayName: sortOrder }, { roomCode: 'asc' }];
    case 'building':
      return [{ building: sortOrder }, { roomCode: 'asc' }];
    case 'wing':
      return [{ wing: sortOrder }, { roomCode: 'asc' }];
    case 'floorLabel':
      return [{ floorLabel: sortOrder }, { roomCode: 'asc' }];
    case 'createdAt':
      return [{ createdAt: sortOrder }, { id: 'asc' }];
    case 'updatedAt':
      return [{ updatedAt: sortOrder }, { id: 'asc' }];
    case 'entriesCount':
      return [{ scheduleEntries: { _count: sortOrder } }, { roomCode: 'asc' }];
    default:
      return [{ roomCode: 'asc' }, { id: 'asc' }];
  }
};

export const listAdminRooms = async ({
  page,
  limit,
  offset,
  search,
  building,
  floorLabel,
  sortBy,
  sortOrder
}: ListAdminRoomsParams): Promise<PaginationResult<RoomWithEntriesCountRow>> => {
  const where = buildRoomWhere({ search, building, floorLabel });

  const [total, rows] = await Promise.all([
    prismaAdmin.room.count({ where }),
    prismaAdmin.room.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: {
            scheduleEntries: true
          }
        }
      },
      orderBy: resolveOrderBy(sortBy, sortOrder)
    })
  ]);

  return {
    total,
    page,
    limit,
    rows: rows.map(mapRoom)
  };
};

export const findAdminRoomById = async (roomId: number): Promise<RoomWithEntriesCountRow | null> => {
  const room = await prismaAdmin.room.findUnique({
    where: { id: roomId },
    include: {
      _count: {
        select: {
          scheduleEntries: true
        }
      }
    }
  });

  return room ? mapRoom(room) : null;
};

export const findAdminRoomByCode = async (
  roomCode: string
): Promise<{ id: number; room_code: string } | null> => {
  const room = await prismaAdmin.room.findFirst({
    where: {
      roomCode: {
        equals: roomCode,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      roomCode: true
    }
  });

  return room
    ? {
        id: room.id,
        room_code: room.roomCode
      }
    : null;
};

export const createAdminRoom = async ({
  roomCode,
  displayName,
  building,
  wing,
  floorLabel
}: RoomPayload): Promise<number> => {
  const room = await prismaAdmin.room.create({
    data: {
      roomCode,
      displayName,
      building,
      wing,
      floorLabel
    },
    select: {
      id: true
    }
  });

  return room.id;
};

export const updateAdminRoom = async (
  roomId: number,
  { roomCode, displayName, building, wing, floorLabel }: RoomPayload
): Promise<number> => {
  const room = await prismaAdmin.room.update({
    where: {
      id: roomId
    },
    data: {
      roomCode,
      displayName,
      building,
      wing,
      floorLabel
    },
    select: {
      id: true
    }
  });

  return room.id;
};

export const countRoomScheduleEntries = async (roomId: number): Promise<number> => {
  return prismaAdmin.scheduleEntry.count({
    where: {
      roomId
    }
  });
};

export const deleteAdminRoom = async (roomId: number): Promise<number> => {
  const room = await prismaAdmin.room.delete({
    where: {
      id: roomId
    },
    select: {
      id: true
    }
  });

  return room.id;
};

export const listRoomOptions = async (): Promise<RoomOptionRow[]> => {
  const rooms = await prismaAdmin.room.findMany({
    orderBy: {
      roomCode: 'asc'
    },
    select: {
      id: true,
      roomCode: true,
      displayName: true
    }
  });

  return rooms.map((room) => ({
    id: room.id,
    room_code: room.roomCode,
    display_name: room.displayName
  }));
};

export const listRoomFilterOptions = async (): Promise<{ buildings: string[]; floorLabels: string[] }> => {
  const [buildings, floors] = await Promise.all([
    prismaAdmin.room.findMany({
      distinct: ['building'],
      orderBy: {
        building: 'asc'
      },
      select: {
        building: true
      }
    }),
    prismaAdmin.room.findMany({
      distinct: ['floorLabel'],
      orderBy: {
        floorLabel: 'asc'
      },
      select: {
        floorLabel: true
      }
    })
  ]);

  return {
    buildings: buildings.map((row) => row.building),
    floorLabels: floors.map((row) => row.floorLabel)
  };
};

export const listRecentScheduleEntriesForRoom = async (
  roomId: number,
  limit = 8
): Promise<ScheduleEntryWithRoomRow[]> => {
  const entries = await prismaAdmin.scheduleEntry.findMany({
    where: {
      roomId
    },
    orderBy: [{ eventDate: 'desc' }, { startTime: 'desc' }],
    take: limit,
    include: {
      room: {
        select: {
          roomCode: true,
          displayName: true
        }
      }
    }
  });

  return entries.map(mapEntrySummary);
};
