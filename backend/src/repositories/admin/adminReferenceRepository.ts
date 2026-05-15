import { prismaAdmin } from '../../db/prisma.js';
import type {
  BuildingRow,
  ClassTypeRow,
  FieldOfStudyRow,
  FloorRow,
  LecturerRow,
  StudentGroupRow,
  SubjectRow,
  WingRow
} from '../../types/domain.js';

export type AdminReferenceEntity =
  | 'buildings'
  | 'wings'
  | 'floors'
  | 'lecturers'
  | 'student-groups'
  | 'class-types'
  | 'fields-of-study'
  | 'subjects';

export interface ReferenceDependency {
  key: string;
  count: number;
  message: string;
}

export interface BuildingPayload {
  name: string;
  isActive: boolean;
}

export interface WingPayload {
  buildingId: number;
  name: string;
  isActive: boolean;
}

export interface FloorPayload {
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface LecturerPayload {
  fullName: string;
  isActive: boolean;
}

export interface StudentGroupPayload {
  name: string;
  isActive: boolean;
}

export interface ClassTypePayload {
  name: string;
  isActive: boolean;
}

export interface FieldOfStudyPayload {
  name: string;
  isActive: boolean;
}

export interface SubjectPayload {
  code: string;
  name: string;
  fieldOfStudyId: number;
  isActive: boolean;
}

export type ReferencePayload =
  | BuildingPayload
  | WingPayload
  | FloorPayload
  | LecturerPayload
  | StudentGroupPayload
  | ClassTypePayload
  | FieldOfStudyPayload
  | SubjectPayload;

export interface ReferenceDataset {
  buildings: BuildingRow[];
  wings: WingRow[];
  floors: FloorRow[];
  lecturers: LecturerRow[];
  studentGroups: StudentGroupRow[];
  classTypes: ClassTypeRow[];
  fieldsOfStudy: FieldOfStudyRow[];
  subjects: SubjectRow[];
}

const toBuildingRow = (row: {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): BuildingRow => ({
  id: row.id,
  name: row.name,
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt
});

const toWingRow = (row: {
  id: number;
  buildingId: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  building: { name: string };
}): WingRow => ({
  id: row.id,
  building_id: row.buildingId,
  building_name: row.building.name,
  name: row.name,
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt
});

const toFloorRow = (row: {
  id: number;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): FloorRow => ({
  id: row.id,
  label: row.label,
  sort_order: row.sortOrder,
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt
});

const toLecturerRow = (row: {
  id: number;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): LecturerRow => ({
  id: row.id,
  full_name: row.fullName,
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt
});

const toStudentGroupRow = (row: {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): StudentGroupRow => ({
  id: row.id,
  name: row.name,
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt
});

const toClassTypeRow = (row: {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ClassTypeRow => ({
  id: row.id,
  name: row.name,
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt
});

const toFieldOfStudyRow = (row: {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): FieldOfStudyRow => ({
  id: row.id,
  name: row.name,
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt
});

const toSubjectRow = (row: {
  id: number;
  code: string;
  name: string;
  fieldOfStudyId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  fieldOfStudy: { name: string };
}): SubjectRow => ({
  id: row.id,
  code: row.code,
  name: row.name,
  field_of_study_id: row.fieldOfStudyId,
  field_of_study_name: row.fieldOfStudy.name,
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt
});

export const listReferenceDataset = async (): Promise<ReferenceDataset> => {
  const [buildings, wings, floors, lecturers, studentGroups, classTypes, fieldsOfStudy, subjects] =
    await Promise.all([
      prismaAdmin.building.findMany({ orderBy: { name: 'asc' } }),
      prismaAdmin.wing.findMany({
        include: {
          building: {
            select: {
              name: true
            }
          }
        },
        orderBy: [{ building: { name: 'asc' } }, { name: 'asc' }]
      }),
      prismaAdmin.floor.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] }),
      prismaAdmin.lecturer.findMany({ orderBy: { fullName: 'asc' } }),
      prismaAdmin.studentGroup.findMany({ orderBy: { name: 'asc' } }),
      prismaAdmin.classType.findMany({ orderBy: { name: 'asc' } }),
      prismaAdmin.fieldOfStudy.findMany({ orderBy: { name: 'asc' } }),
      prismaAdmin.subject.findMany({
        include: {
          fieldOfStudy: {
            select: {
              name: true
            }
          }
        },
        orderBy: [{ code: 'asc' }]
      })
    ]);

  return {
    buildings: buildings.map(toBuildingRow),
    wings: wings.map(toWingRow),
    floors: floors.map(toFloorRow),
    lecturers: lecturers.map(toLecturerRow),
    studentGroups: studentGroups.map(toStudentGroupRow),
    classTypes: classTypes.map(toClassTypeRow),
    fieldsOfStudy: fieldsOfStudy.map(toFieldOfStudyRow),
    subjects: subjects.map(toSubjectRow)
  };
};

export const createReferenceRecord = async (
  entity: AdminReferenceEntity,
  payload: ReferencePayload
): Promise<number> => {
  switch (entity) {
    case 'buildings': {
      const data = payload as BuildingPayload;
      const row = await prismaAdmin.building.create({
        data: {
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'wings': {
      const data = payload as WingPayload;
      const row = await prismaAdmin.wing.create({
        data: {
          buildingId: data.buildingId,
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'floors': {
      const data = payload as FloorPayload;
      const row = await prismaAdmin.floor.create({
        data: {
          label: data.label,
          sortOrder: data.sortOrder,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'lecturers': {
      const data = payload as LecturerPayload;
      const row = await prismaAdmin.lecturer.create({
        data: {
          fullName: data.fullName,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'student-groups': {
      const data = payload as StudentGroupPayload;
      const row = await prismaAdmin.studentGroup.create({
        data: {
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'class-types': {
      const data = payload as ClassTypePayload;
      const row = await prismaAdmin.classType.create({
        data: {
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'fields-of-study': {
      const data = payload as FieldOfStudyPayload;
      const row = await prismaAdmin.fieldOfStudy.create({
        data: {
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'subjects': {
      const data = payload as SubjectPayload;
      const row = await prismaAdmin.subject.create({
        data: {
          code: data.code,
          name: data.name,
          fieldOfStudyId: data.fieldOfStudyId,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    default:
      return 0;
  }
};

export const updateReferenceRecord = async (
  entity: AdminReferenceEntity,
  recordId: number,
  payload: ReferencePayload
): Promise<number> => {
  switch (entity) {
    case 'buildings': {
      const data = payload as BuildingPayload;
      const row = await prismaAdmin.building.update({
        where: { id: recordId },
        data: {
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'wings': {
      const data = payload as WingPayload;
      const row = await prismaAdmin.wing.update({
        where: { id: recordId },
        data: {
          buildingId: data.buildingId,
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'floors': {
      const data = payload as FloorPayload;
      const row = await prismaAdmin.floor.update({
        where: { id: recordId },
        data: {
          label: data.label,
          sortOrder: data.sortOrder,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'lecturers': {
      const data = payload as LecturerPayload;
      const row = await prismaAdmin.lecturer.update({
        where: { id: recordId },
        data: {
          fullName: data.fullName,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'student-groups': {
      const data = payload as StudentGroupPayload;
      const row = await prismaAdmin.studentGroup.update({
        where: { id: recordId },
        data: {
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'class-types': {
      const data = payload as ClassTypePayload;
      const row = await prismaAdmin.classType.update({
        where: { id: recordId },
        data: {
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'fields-of-study': {
      const data = payload as FieldOfStudyPayload;
      const row = await prismaAdmin.fieldOfStudy.update({
        where: { id: recordId },
        data: {
          name: data.name,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    case 'subjects': {
      const data = payload as SubjectPayload;
      const row = await prismaAdmin.subject.update({
        where: { id: recordId },
        data: {
          code: data.code,
          name: data.name,
          fieldOfStudyId: data.fieldOfStudyId,
          isActive: data.isActive
        },
        select: { id: true }
      });
      return row.id;
    }
    default:
      return 0;
  }
};

export const deleteReferenceRecord = async (
  entity: AdminReferenceEntity,
  recordId: number
): Promise<number> => {
  switch (entity) {
    case 'buildings': {
      const row = await prismaAdmin.building.delete({ where: { id: recordId }, select: { id: true } });
      return row.id;
    }
    case 'wings': {
      const row = await prismaAdmin.wing.delete({ where: { id: recordId }, select: { id: true } });
      return row.id;
    }
    case 'floors': {
      const row = await prismaAdmin.floor.delete({ where: { id: recordId }, select: { id: true } });
      return row.id;
    }
    case 'lecturers': {
      const row = await prismaAdmin.lecturer.delete({ where: { id: recordId }, select: { id: true } });
      return row.id;
    }
    case 'student-groups': {
      const row = await prismaAdmin.studentGroup.delete({ where: { id: recordId }, select: { id: true } });
      return row.id;
    }
    case 'class-types': {
      const row = await prismaAdmin.classType.delete({ where: { id: recordId }, select: { id: true } });
      return row.id;
    }
    case 'fields-of-study': {
      const row = await prismaAdmin.fieldOfStudy.delete({ where: { id: recordId }, select: { id: true } });
      return row.id;
    }
    case 'subjects': {
      const row = await prismaAdmin.subject.delete({ where: { id: recordId }, select: { id: true } });
      return row.id;
    }
    default:
      return 0;
  }
};

export const listReferenceDependencies = async (
  entity: AdminReferenceEntity,
  recordId: number
): Promise<ReferenceDependency[]> => {
  switch (entity) {
    case 'buildings': {
      const [roomsCount, wingsCount] = await Promise.all([
        prismaAdmin.room.count({ where: { buildingId: recordId } }),
        prismaAdmin.wing.count({ where: { buildingId: recordId } })
      ]);

      return [
        {
          key: 'rooms',
          count: roomsCount,
          message: 'Powiazane sale'
        },
        {
          key: 'wings',
          count: wingsCount,
          message: 'Powiazane skrzydla'
        }
      ].filter((item) => item.count > 0);
    }
    case 'wings': {
      const roomsCount = await prismaAdmin.room.count({ where: { wingId: recordId } });
      return roomsCount > 0 ? [{ key: 'rooms', count: roomsCount, message: 'Powiazane sale' }] : [];
    }
    case 'floors': {
      const roomsCount = await prismaAdmin.room.count({ where: { floorId: recordId } });
      return roomsCount > 0 ? [{ key: 'rooms', count: roomsCount, message: 'Powiazane sale' }] : [];
    }
    case 'lecturers': {
      const count = await prismaAdmin.scheduleEntry.count({ where: { lecturerId: recordId } });
      return count > 0 ? [{ key: 'scheduleEntries', count, message: 'Powiazane wpisy harmonogramu' }] : [];
    }
    case 'student-groups': {
      const count = await prismaAdmin.scheduleEntry.count({ where: { studentGroupId: recordId } });
      return count > 0 ? [{ key: 'scheduleEntries', count, message: 'Powiazane wpisy harmonogramu' }] : [];
    }
    case 'class-types': {
      const count = await prismaAdmin.scheduleEntry.count({ where: { classTypeId: recordId } });
      return count > 0 ? [{ key: 'scheduleEntries', count, message: 'Powiazane wpisy harmonogramu' }] : [];
    }
    case 'fields-of-study': {
      const count = await prismaAdmin.subject.count({ where: { fieldOfStudyId: recordId } });
      return count > 0 ? [{ key: 'subjects', count, message: 'Powiazane przedmioty' }] : [];
    }
    case 'subjects': {
      const count = await prismaAdmin.scheduleEntry.count({ where: { subjectId: recordId } });
      return count > 0 ? [{ key: 'scheduleEntries', count, message: 'Powiazane wpisy harmonogramu' }] : [];
    }
    default:
      return [];
  }
};

export const existsReferenceRecord = async (
  entity: AdminReferenceEntity,
  recordId: number
): Promise<boolean> => {
  switch (entity) {
    case 'buildings':
      return Boolean(await prismaAdmin.building.findUnique({ where: { id: recordId }, select: { id: true } }));
    case 'wings':
      return Boolean(await prismaAdmin.wing.findUnique({ where: { id: recordId }, select: { id: true } }));
    case 'floors':
      return Boolean(await prismaAdmin.floor.findUnique({ where: { id: recordId }, select: { id: true } }));
    case 'lecturers':
      return Boolean(await prismaAdmin.lecturer.findUnique({ where: { id: recordId }, select: { id: true } }));
    case 'student-groups':
      return Boolean(
        await prismaAdmin.studentGroup.findUnique({ where: { id: recordId }, select: { id: true } })
      );
    case 'class-types':
      return Boolean(await prismaAdmin.classType.findUnique({ where: { id: recordId }, select: { id: true } }));
    case 'fields-of-study':
      return Boolean(
        await prismaAdmin.fieldOfStudy.findUnique({ where: { id: recordId }, select: { id: true } })
      );
    case 'subjects':
      return Boolean(await prismaAdmin.subject.findUnique({ where: { id: recordId }, select: { id: true } }));
    default:
      return false;
  }
};
