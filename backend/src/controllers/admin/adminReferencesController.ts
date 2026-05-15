import type { RequestHandler } from 'express';
import { prismaAdmin } from '../../db/prisma.js';
import {
  createReferenceRecord,
  deleteReferenceRecord,
  existsReferenceRecord,
  listReferenceDataset,
  listReferenceDependencies,
  type AdminReferenceEntity,
  type ReferencePayload,
  updateReferenceRecord
} from '../../repositories/admin/adminReferenceRepository.js';
import { createError } from '../../types/errors.js';
import {
  mapBuildingRecord,
  mapClassTypeRecord,
  mapFieldOfStudyRecord,
  mapFloorRecord,
  mapLecturerRecord,
  mapStudentGroupRecord,
  mapSubjectRecord,
  mapWingRecord
} from '../../utils/adminMappers.js';
import { asNonEmptyString, asPositiveInteger, parseBooleanFlag } from '../../utils/adminValidation.js';
import { handleAdminError } from './adminControllerUtils.js';

const REFERENCE_ENTITIES = new Set<AdminReferenceEntity>([
  'buildings',
  'wings',
  'floors',
  'lecturers',
  'student-groups',
  'class-types',
  'fields-of-study',
  'subjects'
]);

const parseEntity = (value: unknown): AdminReferenceEntity => {
  const normalized = String(value);

  if (!REFERENCE_ENTITIES.has(normalized as AdminReferenceEntity)) {
    throw createError(`Unsupported reference entity: ${normalized}.`, 'VALIDATION_ERROR');
  }

  return normalized as AdminReferenceEntity;
};

const asInteger = (value: unknown, fieldName: string): number => {
  const numeric = Number(value);

  if (!Number.isInteger(numeric)) {
    throw createError(`${fieldName} must be an integer.`, 'VALIDATION_ERROR');
  }

  return numeric;
};

const parseReferencePayload = (
  entity: AdminReferenceEntity,
  payload: unknown
): ReferencePayload => {
  const data = (payload ?? {}) as Record<string, unknown>;
  const isActive = parseBooleanFlag(data.isActive, true);

  switch (entity) {
    case 'buildings':
      return {
        name: asNonEmptyString(data.name, 'name', 120),
        isActive
      };
    case 'wings':
      return {
        buildingId: asPositiveInteger(data.buildingId, 'buildingId'),
        name: asNonEmptyString(data.name, 'name', 120),
        isActive
      };
    case 'floors':
      return {
        label: asNonEmptyString(data.label, 'label', 80),
        sortOrder: asInteger(data.sortOrder, 'sortOrder'),
        isActive
      };
    case 'lecturers':
      return {
        fullName: asNonEmptyString(data.fullName, 'fullName', 160),
        isActive
      };
    case 'student-groups':
      return {
        name: asNonEmptyString(data.name, 'name', 160),
        isActive
      };
    case 'class-types':
      return {
        name: asNonEmptyString(data.name, 'name', 120),
        isActive
      };
    case 'fields-of-study':
      return {
        name: asNonEmptyString(data.name, 'name', 180),
        isActive
      };
    case 'subjects':
      return {
        code: asNonEmptyString(data.code, 'code', 64).toUpperCase(),
        name: asNonEmptyString(data.name, 'name', 200),
        fieldOfStudyId: asPositiveInteger(data.fieldOfStudyId, 'fieldOfStudyId'),
        isActive
      };
    default:
      throw createError('Unsupported reference payload.', 'VALIDATION_ERROR');
  }
};

const validateReferenceRelations = async (
  entity: AdminReferenceEntity,
  payload: ReferencePayload
): Promise<void> => {
  if (entity === 'wings') {
    const buildingId = (payload as { buildingId: number }).buildingId;
    const building = await prismaAdmin.building.findUnique({
      where: {
        id: buildingId
      },
      select: {
        id: true
      }
    });

    if (!building) {
      throw createError('buildingId does not point to an existing building.', 'VALIDATION_ERROR');
    }
  }

  if (entity === 'subjects') {
    const fieldOfStudyId = (payload as { fieldOfStudyId: number }).fieldOfStudyId;
    const field = await prismaAdmin.fieldOfStudy.findUnique({
      where: {
        id: fieldOfStudyId
      },
      select: {
        id: true
      }
    });

    if (!field) {
      throw createError(
        'fieldOfStudyId does not point to an existing field of study.',
        'VALIDATION_ERROR'
      );
    }
  }
};

export const getAdminReferencesDataset: RequestHandler = async (_req, res, next) => {
  try {
    const dataset = await listReferenceDataset();

    return res.status(200).json({
      buildings: dataset.buildings.map(mapBuildingRecord),
      wings: dataset.wings.map(mapWingRecord),
      floors: dataset.floors.map(mapFloorRecord),
      lecturers: dataset.lecturers.map(mapLecturerRecord),
      studentGroups: dataset.studentGroups.map(mapStudentGroupRecord),
      classTypes: dataset.classTypes.map(mapClassTypeRecord),
      fieldsOfStudy: dataset.fieldsOfStudy.map(mapFieldOfStudyRecord),
      subjects: dataset.subjects.map(mapSubjectRecord)
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminReferenceDependencies: RequestHandler = async (req, res, next) => {
  try {
    const entity = parseEntity(req.params.entity);
    const recordId = asPositiveInteger(req.params.id, 'id');

    const exists = await existsReferenceRecord(entity, recordId);
    if (!exists) {
      return res.status(404).json({
        error: 'REFERENCE_NOT_FOUND',
        message: `Record with id ${recordId} does not exist in ${entity}.`
      });
    }

    const dependencies = await listReferenceDependencies(entity, recordId);

    return res.status(200).json({
      entity,
      id: recordId,
      dependencies
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const createAdminReferenceRecord: RequestHandler = async (req, res, next) => {
  try {
    const entity = parseEntity(req.params.entity);
    const payload = parseReferencePayload(entity, req.body);
    await validateReferenceRelations(entity, payload);

    const id = await createReferenceRecord(entity, payload);

    return res.status(201).json({
      entity,
      id
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const updateAdminReferenceRecord: RequestHandler = async (req, res, next) => {
  try {
    const entity = parseEntity(req.params.entity);
    const recordId = asPositiveInteger(req.params.id, 'id');

    const exists = await existsReferenceRecord(entity, recordId);
    if (!exists) {
      return res.status(404).json({
        error: 'REFERENCE_NOT_FOUND',
        message: `Record with id ${recordId} does not exist in ${entity}.`
      });
    }

    const payload = parseReferencePayload(entity, req.body);
    await validateReferenceRelations(entity, payload);

    const id = await updateReferenceRecord(entity, recordId, payload);

    return res.status(200).json({
      entity,
      id
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const deleteAdminReferenceRecord: RequestHandler = async (req, res, next) => {
  try {
    const entity = parseEntity(req.params.entity);
    const recordId = asPositiveInteger(req.params.id, 'id');

    const exists = await existsReferenceRecord(entity, recordId);
    if (!exists) {
      return res.status(404).json({
        error: 'REFERENCE_NOT_FOUND',
        message: `Record with id ${recordId} does not exist in ${entity}.`
      });
    }

    const dependencies = await listReferenceDependencies(entity, recordId);
    if (dependencies.length > 0) {
      return res.status(409).json({
        error: 'REFERENCE_IN_USE',
        message: 'Cannot delete this record because it is used by other records.',
        dependencies
      });
    }

    const deletedId = await deleteReferenceRecord(entity, recordId);

    return res.status(200).json({
      entity,
      deleted: true,
      id: deletedId
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};
