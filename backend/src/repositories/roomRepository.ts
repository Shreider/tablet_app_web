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
  buildingId: number;
  wingId: number;
  floorId: number;
  building: { name: string };
  wing: { name: string };
  floor: { label: string };
  createdAt: Date;
  updatedAt: Date;
}): RoomRow => ({
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
  updated_at: room.updatedAt
});

const mapEntryRow = (entry: {
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
  subject: { code: string; name: string; fieldOfStudyId: number; fieldOfStudy: { name: string } };
  startTime: Date;
  endTime: Date;
  description: string;
  note: string | null;
  createdAt: Date;
}): ScheduleEntryRow => ({
  id: entry.id,
  room_id: entry.roomId,
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

export const findAllRooms = async (): Promise<RoomRow[]> => {
  const rooms = await prisma.room.findMany({
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
      }
    },
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
    },
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
    include: {
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
      room: {
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
          }
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
    },
    orderBy: [{ room: { roomCode: 'asc' } }, { startTime: 'asc' }]
  });

  return entries.map((entry) => ({
    ...mapEntryRow(entry),
    room_code: entry.room.roomCode,
    display_name: entry.room.displayName,
    building_name: entry.room.building.name,
    wing_name: entry.room.wing.name,
    floor_label: entry.room.floor.label
  }));
};
