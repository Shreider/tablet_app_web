import type { Prisma } from '@prisma/client';
import { prismaAdmin } from '../../db/prisma.js';
import type {
  PaginationResult,
  ReferenceOptionRow,
  RoomOptionRow,
  RoomPayload,
  RoomWithEntriesCountRow,
  ScheduleEntryWithRoomRow,
  SortOrder,
  WingRow
} from '../../types/domain.js';
import { formatDateOnly, formatTimeValue } from '../../utils/prismaDate.js';

type RoomSortBy =
  | 'id'
  | 'roomCode'
  | 'displayName'
  | 'buildingName'
  | 'wingName'
  | 'floorLabel'
  | 'createdAt'
  | 'updatedAt'
  | 'entriesCount';

interface ListAdminRoomsParams {
  page: number;
  limit: number;
  offset: number;
  search: string;
  buildingId: number | null;
  wingId: number | null;
  floorId: number | null;
  sortBy: string;
  sortOrder: SortOrder;
}

const mapRoom = (room: {
  id: number;
  roomCode: string;
  displayName: string;
  buildingId: number;
  wingId: number;
  floorId: number;
  building: { name: string };
  wing: { name: string };
  floor: { label: string };
  createdAt: Date;
  updatedAt: Date;
  _count?: { scheduleEntries: number };
}): RoomWithEntriesCountRow => ({
  id: room.id,
  room_code: room.roomCode,
  display_name: room.displayName,
  building_id: room.buildingId,
  building_name: room.building.name,
  wing_id: room.wingId,
  wing_name: room.wing.name,
  floor_id: room.floorId,
  floor_label: room.floor.label,
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
    lecturerId: number;
    lecturer: { fullName: string };
    studentGroupId: number;
    studentGroup: { name: string };
    classTypeId: number;
    classType: { name: string };
    subjectId: number;
    subject: {
      code: string;
      name: string;
      fieldOfStudyId: number;
      fieldOfStudy: { name: string };
    };
    startTime: Date;
    endTime: Date;
    description: string;
    note: string | null;
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
  lecturer_id: entry.lecturerId,
  lecturer_name: entry.lecturer.fullName,
  group_id: entry.studentGroupId,
  group_name: entry.studentGroup.name,
  class_type_id: entry.classTypeId,
  class_type_name: entry.classType.name,
  subject_id: entry.subjectId,
  subject_code: entry.subject.code,
  subject_name: entry.subject.name,
  field_of_study_id: entry.subject.fieldOfStudyId,
  field_of_study_name: entry.subject.fieldOfStudy.name,
  start_time: formatTimeValue(entry.startTime),
  end_time: formatTimeValue(entry.endTime),
  description: entry.description,
  note: entry.note,
  created_at: entry.createdAt
});

const buildRoomWhere = ({
  search,
  buildingId,
  wingId,
  floorId
}: Pick<ListAdminRoomsParams, 'search' | 'buildingId' | 'wingId' | 'floorId'>): Prisma.RoomWhereInput => {
  const where: Prisma.RoomWhereInput = {};

  if (search) {
    where.OR = [
      { roomCode: { contains: search, mode: 'insensitive' } },
      { displayName: { contains: search, mode: 'insensitive' } },
      { building: { name: { contains: search, mode: 'insensitive' } } },
      { wing: { name: { contains: search, mode: 'insensitive' } } },
      { floor: { label: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (buildingId) {
    where.buildingId = buildingId;
  }

  if (wingId) {
    where.wingId = wingId;
  }

  if (floorId) {
    where.floorId = floorId;
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
    case 'buildingName':
      return [{ building: { name: sortOrder } }, { roomCode: 'asc' }];
    case 'wingName':
      return [{ wing: { name: sortOrder } }, { roomCode: 'asc' }];
    case 'floorLabel':
      return [{ floor: { label: sortOrder } }, { roomCode: 'asc' }];
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
  buildingId,
  wingId,
  floorId,
  sortBy,
  sortOrder
}: ListAdminRoomsParams): Promise<PaginationResult<RoomWithEntriesCountRow>> => {
  const where = buildRoomWhere({ search, buildingId, wingId, floorId });

  const [total, rows] = await Promise.all([
    prismaAdmin.room.count({ where }),
    prismaAdmin.room.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        building: {
          select: {
            name: true
          }
        },
        wing: {
          select: {
            name: true
          }
        },
        floor: {
          select: {
            label: true
          }
        },
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
      building: {
        select: {
          name: true
        }
      },
      wing: {
        select: {
          name: true
        }
      },
      floor: {
        select: {
          label: true
        }
      },
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
  buildingId,
  wingId,
  floorId
}: RoomPayload): Promise<number> => {
  const room = await prismaAdmin.room.create({
    data: {
      roomCode,
      displayName,
      buildingId,
      wingId,
      floorId
    },
    select: {
      id: true
    }
  });

  return room.id;
};

export const updateAdminRoom = async (
  roomId: number,
  { roomCode, displayName, buildingId, wingId, floorId }: RoomPayload
): Promise<number> => {
  const room = await prismaAdmin.room.update({
    where: {
      id: roomId
    },
    data: {
      roomCode,
      displayName,
      buildingId,
      wingId,
      floorId
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

export const deleteRoomScheduleEntries = async (roomId: number): Promise<number> => {
  const result = await prismaAdmin.scheduleEntry.deleteMany({
    where: {
      roomId
    }
  });

  return result.count;
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

export const listBuildingOptions = async (): Promise<ReferenceOptionRow[]> => {
  const rows = await prismaAdmin.building.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true
    }
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name
  }));
};

export const listWingOptions = async (): Promise<WingRow[]> => {
  const rows = await prismaAdmin.wing.findMany({
    where: {
      isActive: true,
      building: {
        isActive: true
      }
    },
    orderBy: [{ building: { name: 'asc' } }, { name: 'asc' }],
    include: {
      building: {
        select: {
          name: true
        }
      }
    }
  });

  return rows.map((row) => ({
    id: row.id,
    building_id: row.buildingId,
    building_name: row.building.name,
    name: row.name,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  }));
};

export const listFloorOptions = async (): Promise<Array<{ id: number; label: string }>> => {
  const rows = await prismaAdmin.floor.findMany({
    where: {
      isActive: true
    },
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    select: {
      id: true,
      label: true
    }
  });

  return rows;
};

export const listRoomFilterOptions = async (): Promise<{
  buildings: ReferenceOptionRow[];
  wings: Array<{ id: number; name: string; buildingId: number; buildingName: string }>;
  floors: Array<{ id: number; label: string }>;
}> => {
  const [buildings, wings, floors] = await Promise.all([
    listBuildingOptions(),
    listWingOptions(),
    listFloorOptions()
  ]);

  return {
    buildings,
    wings: wings.map((wing) => ({
      id: wing.id,
      name: wing.name,
      buildingId: wing.building_id,
      buildingName: wing.building_name
    })),
    floors
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
      },
      lecturer: {
        select: {
          fullName: true
        }
      },
      studentGroup: {
        select: {
          name: true
        }
      },
      classType: {
        select: {
          name: true
        }
      },
      subject: {
        select: {
          code: true,
          name: true,
          fieldOfStudyId: true,
          fieldOfStudy: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  return entries.map(mapEntrySummary);
};
