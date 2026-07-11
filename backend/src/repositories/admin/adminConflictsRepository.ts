import { prismaAdmin } from '../../db/prisma.js';
import { formatDateOnly, formatTimeValue } from '../../utils/prismaDate.js';

export interface ConflictEntry {
  id: number;
  roomId: number;
  roomCode: string;
  roomDisplayName: string;
  eventDate: string;
  title: string;
  lecturerId: number;
  lecturerName: string;
  studentGroupId: number;
  studentGroupName: string;
  classTypeId: number;
  classTypeName: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  description: string;
  note: string | null;
}

export interface ConflictPair {
  entryA: ConflictEntry;
  entryB: ConflictEntry;
}

export const fetchConflictPairs = async (): Promise<ConflictPair[]> => {
  const entries = await prismaAdmin.scheduleEntry.findMany({
    include: {
      room: { select: { roomCode: true, displayName: true } },
      lecturer: { select: { fullName: true } },
      studentGroup: { select: { name: true } },
      classType: { select: { name: true } },
      subject: { select: { code: true, name: true } }
    },
    orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }]
  });

  const groupMap = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = `${entry.roomId}|${entry.eventDate.getTime()}`;
    const group = groupMap.get(key) ?? [];
    group.push(entry);
    groupMap.set(key, group);
  }

  const mapEntry = (e: (typeof entries)[number]): ConflictEntry => ({
    id: e.id,
    roomId: e.roomId,
    roomCode: e.room.roomCode,
    roomDisplayName: e.room.displayName,
    eventDate: formatDateOnly(e.eventDate),
    title: e.title,
    lecturerId: e.lecturerId,
    lecturerName: e.lecturer.fullName,
    studentGroupId: e.studentGroupId,
    studentGroupName: e.studentGroup.name,
    classTypeId: e.classTypeId,
    classTypeName: e.classType.name,
    subjectId: e.subjectId,
    subjectCode: e.subject.code,
    subjectName: e.subject.name,
    startTime: formatTimeValue(e.startTime),
    endTime: formatTimeValue(e.endTime),
    description: e.description,
    note: e.note
  });

  const conflicts: ConflictPair[] = [];

  for (const group of groupMap.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (a.startTime < b.endTime && b.startTime < a.endTime) {
          conflicts.push({ entryA: mapEntry(a), entryB: mapEntry(b) });
        }
      }
    }
  }

  return conflicts;
};
