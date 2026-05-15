import type { Prisma } from '@prisma/client';
import { prismaAdmin } from '../../db/prisma.js';
import type {
  PaginationResult,
  ReferenceOptionRow,
  ScheduleEntryPayload,
  ScheduleEntryWithRoomRow,
  SortOrder,
  SubjectRow
} from '../../types/domain.js';
import { formatDateOnly, formatTimeValue, toDateOnly, toTimeValue } from '../../utils/prismaDate.js';

type EntrySortBy =
  | 'id'
  | 'eventDate'
  | 'startTime'
  | 'endTime'
  | 'roomCode'
  | 'lecturerName'
  | 'classTypeName'
  | 'subjectCode'
  | 'createdAt';

interface ListScheduleEntriesParams {
  page: number;
  limit: number;
  offset: number;
  search: string;
  roomId: number | null;
  classTypeId: number | null;
  lecturerId: number | null;
  studentGroupId: number | null;
  subjectId: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  sortBy: string;
  sortOrder: SortOrder;
}

const toRow = (entry: {
  id: number;
  roomId: number;
  room: { roomCode: string; displayName: string };
  eventDate: Date;
  title: string;
  lecturerId: number;
  lecturer: { fullName: string };
  studentGroupId: number;
  studentGroup: { name: string };
  classTypeId: number;
  classType: { name: string };
  subjectId: number;
  subject: { code: string; name: string; fieldOfStudyId: number; fieldOfStudy: { name: string } };
  startTime: Date;
  endTime: Date;
  description: string;
  note: string | null;
  createdAt: Date;
}): ScheduleEntryWithRoomRow => ({
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

const buildWhere = ({
  search,
  roomId,
  classTypeId,
  lecturerId,
  studentGroupId,
  subjectId,
  dateFrom,
  dateTo
}: Pick<
  ListScheduleEntriesParams,
  | 'search'
  | 'roomId'
  | 'classTypeId'
  | 'lecturerId'
  | 'studentGroupId'
  | 'subjectId'
  | 'dateFrom'
  | 'dateTo'
>): Prisma.ScheduleEntryWhereInput => {
  const where: Prisma.ScheduleEntryWhereInput = {};
  const andFilters: Prisma.ScheduleEntryWhereInput[] = [];

  if (search) {
    andFilters.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { lecturer: { fullName: { contains: search, mode: 'insensitive' } } },
        { studentGroup: { name: { contains: search, mode: 'insensitive' } } },
        { classType: { name: { contains: search, mode: 'insensitive' } } },
        { subject: { code: { contains: search, mode: 'insensitive' } } },
        { subject: { name: { contains: search, mode: 'insensitive' } } },
        { room: { roomCode: { contains: search, mode: 'insensitive' } } }
      ]
    });
  }

  if (roomId) {
    andFilters.push({ roomId });
  }

  if (classTypeId) {
    andFilters.push({ classTypeId });
  }

  if (lecturerId) {
    andFilters.push({ lecturerId });
  }

  if (studentGroupId) {
    andFilters.push({ studentGroupId });
  }

  if (subjectId) {
    andFilters.push({ subjectId });
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
    case 'roomCode':
      return [{ room: { roomCode: sortOrder } }, { eventDate: sortOrder }, { startTime: sortOrder }];
    case 'lecturerName':
      return [{ lecturer: { fullName: sortOrder } }, { eventDate: sortOrder }, { startTime: sortOrder }];
    case 'classTypeName':
      return [{ classType: { name: sortOrder } }, { eventDate: sortOrder }, { startTime: sortOrder }];
    case 'subjectCode':
      return [{ subject: { code: sortOrder } }, { eventDate: sortOrder }, { startTime: sortOrder }];
    case 'createdAt':
      return [{ createdAt: sortOrder }, { id: sortOrder }];
    default:
      return [{ eventDate: sortOrder }, { startTime: sortOrder }, { id: sortOrder }];
  }
};

const includeScheduleRelations = {
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
} satisfies Prisma.ScheduleEntryInclude;

export const listAdminScheduleEntries = async ({
  page,
  limit,
  offset,
  search,
  roomId,
  classTypeId,
  lecturerId,
  studentGroupId,
  subjectId,
  dateFrom,
  dateTo,
  sortBy,
  sortOrder
}: ListScheduleEntriesParams): Promise<PaginationResult<ScheduleEntryWithRoomRow>> => {
  const where = buildWhere({
    search,
    roomId,
    classTypeId,
    lecturerId,
    studentGroupId,
    subjectId,
    dateFrom,
    dateTo
  });

  const [total, rows] = await Promise.all([
    prismaAdmin.scheduleEntry.count({ where }),
    prismaAdmin.scheduleEntry.findMany({
      where,
      include: includeScheduleRelations,
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
    include: includeScheduleRelations
  });

  return entry ? toRow(entry) : null;
};

const resolveEntryTitle = async (subjectId: number): Promise<string> => {
  const subject = await prismaAdmin.subject.findUnique({
    where: {
      id: subjectId
    },
    select: {
      name: true
    }
  });

  return subject?.name ?? 'Zajecia';
};

export const createAdminScheduleEntry = async ({
  roomId,
  eventDate,
  lecturerId,
  studentGroupId,
  classTypeId,
  subjectId,
  startTime,
  endTime,
  description,
  note
}: ScheduleEntryPayload): Promise<number> => {
  const title = await resolveEntryTitle(subjectId);

  const entry = await prismaAdmin.scheduleEntry.create({
    data: {
      roomId,
      eventDate: toDateOnly(eventDate),
      lecturerId,
      studentGroupId,
      classTypeId,
      subjectId,
      title,
      startTime: toTimeValue(startTime),
      endTime: toTimeValue(endTime),
      description,
      note
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
    lecturerId,
    studentGroupId,
    classTypeId,
    subjectId,
    startTime,
    endTime,
    description,
    note
  }: ScheduleEntryPayload
): Promise<number> => {
  const title = await resolveEntryTitle(subjectId);

  const entry = await prismaAdmin.scheduleEntry.update({
    where: {
      id: entryId
    },
    data: {
      roomId,
      eventDate: toDateOnly(eventDate),
      lecturerId,
      studentGroupId,
      classTypeId,
      subjectId,
      title,
      startTime: toTimeValue(startTime),
      endTime: toTimeValue(endTime),
      description,
      note
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

export const listLecturerOptions = async (): Promise<ReferenceOptionRow[]> => {
  const rows = await prismaAdmin.lecturer.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      fullName: 'asc'
    },
    select: {
      id: true,
      fullName: true
    }
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.fullName
  }));
};

export const listStudentGroupOptions = async (): Promise<ReferenceOptionRow[]> => {
  const rows = await prismaAdmin.studentGroup.findMany({
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

  return rows;
};

export const listClassTypeOptions = async (): Promise<ReferenceOptionRow[]> => {
  const rows = await prismaAdmin.classType.findMany({
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

  return rows;
};

export const listSubjectOptions = async (): Promise<SubjectRow[]> => {
  const rows = await prismaAdmin.subject.findMany({
    where: {
      isActive: true,
      fieldOfStudy: {
        isActive: true
      }
    },
    orderBy: [{ code: 'asc' }],
    include: {
      fieldOfStudy: {
        select: {
          name: true
        }
      }
    }
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    field_of_study_id: row.fieldOfStudyId,
    field_of_study_name: row.fieldOfStudy.name,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  }));
};
