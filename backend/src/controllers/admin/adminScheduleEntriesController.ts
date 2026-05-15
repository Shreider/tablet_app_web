import type { RequestHandler } from 'express';
import { prismaAdmin } from '../../db/prisma.js';
import {
  createAdminScheduleEntry,
  deleteAdminScheduleEntry,
  findAdminScheduleEntryById,
  listAdminScheduleEntries,
  listClassTypeOptions,
  listLecturerOptions,
  listStudentGroupOptions,
  listSubjectOptions,
  updateAdminScheduleEntry
} from '../../repositories/admin/adminScheduleEntriesRepository.js';
import { findAdminRoomById, listRoomOptions } from '../../repositories/admin/adminRoomsRepository.js';
import type { ScheduleEntryPayload } from '../../types/domain.js';
import { createError } from '../../types/errors.js';
import {
  mapReferenceOption,
  mapRoomOption,
  mapScheduleEntryRecord,
  mapSubjectRecord
} from '../../utils/adminMappers.js';
import {
  asIsoDate,
  asOptionalString,
  asPositiveInteger,
  asTime,
  ensureStartBeforeEnd,
  parsePagination,
  parseSortOrder
} from '../../utils/adminValidation.js';
import { handleAdminError } from './adminControllerUtils.js';

const ENTRY_SORT_FIELDS = new Set([
  'id',
  'eventDate',
  'startTime',
  'endTime',
  'roomCode',
  'lecturerName',
  'classTypeName',
  'subjectCode',
  'createdAt'
]);

const parseEntrySortBy = (value: unknown): string => {
  if (!value) {
    return 'eventDate';
  }

  const normalized = String(value);

  if (!ENTRY_SORT_FIELDS.has(normalized)) {
    throw createError(`sortBy has unsupported value: ${normalized}.`, 'VALIDATION_ERROR');
  }

  return normalized;
};

const parseEntryPayload = (payload: unknown): ScheduleEntryPayload => {
  const data = (payload ?? {}) as Record<string, unknown>;

  const roomId = asPositiveInteger(data.roomId, 'roomId');
  const eventDate = asIsoDate(data.eventDate, 'eventDate');
  const lecturerId = asPositiveInteger(data.lecturerId, 'lecturerId');
  const studentGroupId = asPositiveInteger(data.studentGroupId, 'studentGroupId');
  const classTypeId = asPositiveInteger(data.classTypeId, 'classTypeId');
  const subjectId = asPositiveInteger(data.subjectId, 'subjectId');
  const startTime = asTime(data.startTime, 'startTime');
  const endTime = asTime(data.endTime, 'endTime');
  const description = asOptionalString(data.description, 'description', 500) ?? '';
  const note = asOptionalString(data.note, 'note', 500);

  if (!description) {
    throw createError('description cannot be empty.', 'VALIDATION_ERROR');
  }

  ensureStartBeforeEnd(startTime, endTime);

  return {
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
  };
};

const validateEntryRelations = async (payload: ScheduleEntryPayload): Promise<void> => {
  const [room, lecturer, group, classType, subject] = await Promise.all([
    findAdminRoomById(payload.roomId),
    prismaAdmin.lecturer.findUnique({ where: { id: payload.lecturerId }, select: { id: true, isActive: true } }),
    prismaAdmin.studentGroup.findUnique({
      where: { id: payload.studentGroupId },
      select: { id: true, isActive: true }
    }),
    prismaAdmin.classType.findUnique({ where: { id: payload.classTypeId }, select: { id: true, isActive: true } }),
    prismaAdmin.subject.findUnique({
      where: { id: payload.subjectId },
      select: {
        id: true,
        isActive: true,
        fieldOfStudy: {
          select: {
            isActive: true
          }
        }
      }
    })
  ]);

  if (!room) {
    throw createError(`Room with id ${payload.roomId} does not exist.`, 'VALIDATION_ERROR');
  }

  if (!lecturer || !lecturer.isActive) {
    throw createError('lecturerId does not point to an active lecturer.', 'VALIDATION_ERROR');
  }

  if (!group || !group.isActive) {
    throw createError('studentGroupId does not point to an active student group.', 'VALIDATION_ERROR');
  }

  if (!classType || !classType.isActive) {
    throw createError('classTypeId does not point to an active class type.', 'VALIDATION_ERROR');
  }

  if (!subject || !subject.isActive || !subject.fieldOfStudy.isActive) {
    throw createError('subjectId does not point to an active subject.', 'VALIDATION_ERROR');
  }
};

export const getAdminScheduleEntriesList: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, {
      page: 1,
      limit: 12,
      maxLimit: 100
    });

    const sortOrder = parseSortOrder(req.query.sortOrder);
    const sortBy = parseEntrySortBy(req.query.sortBy);

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const roomId = req.query.roomId ? asPositiveInteger(req.query.roomId, 'roomId') : null;
    const classTypeId = req.query.classTypeId
      ? asPositiveInteger(req.query.classTypeId, 'classTypeId')
      : null;
    const lecturerId = req.query.lecturerId
      ? asPositiveInteger(req.query.lecturerId, 'lecturerId')
      : null;
    const studentGroupId = req.query.studentGroupId
      ? asPositiveInteger(req.query.studentGroupId, 'studentGroupId')
      : null;
    const subjectId = req.query.subjectId ? asPositiveInteger(req.query.subjectId, 'subjectId') : null;
    const dateFrom = req.query.dateFrom ? asIsoDate(req.query.dateFrom, 'dateFrom') : null;
    const dateTo = req.query.dateTo ? asIsoDate(req.query.dateTo, 'dateTo') : null;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw createError('dateFrom must be earlier than or equal to dateTo.', 'VALIDATION_ERROR');
    }

    const result = await listAdminScheduleEntries({
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
    });

    return res.status(200).json({
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      rows: result.rows.map(mapScheduleEntryRecord)
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const getAdminScheduleEntryDetails: RequestHandler = async (req, res, next) => {
  try {
    const entryId = asPositiveInteger(req.params.id, 'id');
    const entry = await findAdminScheduleEntryById(entryId);

    if (!entry) {
      return res.status(404).json({
        error: 'SCHEDULE_ENTRY_NOT_FOUND',
        message: `Schedule entry with id ${entryId} does not exist.`
      });
    }

    return res.status(200).json({
      entry: mapScheduleEntryRecord(entry)
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const createAdminScheduleEntryRecord: RequestHandler = async (req, res, next) => {
  try {
    const payload = parseEntryPayload(req.body);
    await validateEntryRelations(payload);

    const entryId = await createAdminScheduleEntry(payload);
    const createdEntry = await findAdminScheduleEntryById(entryId);

    return res.status(201).json({
      entry: createdEntry ? mapScheduleEntryRecord(createdEntry) : null
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const updateAdminScheduleEntryRecord: RequestHandler = async (req, res, next) => {
  try {
    const entryId = asPositiveInteger(req.params.id, 'id');

    const existing = await findAdminScheduleEntryById(entryId);
    if (!existing) {
      return res.status(404).json({
        error: 'SCHEDULE_ENTRY_NOT_FOUND',
        message: `Schedule entry with id ${entryId} does not exist.`
      });
    }

    const payload = parseEntryPayload(req.body);
    await validateEntryRelations(payload);

    await updateAdminScheduleEntry(entryId, payload);
    const updatedEntry = await findAdminScheduleEntryById(entryId);

    return res.status(200).json({
      entry: updatedEntry ? mapScheduleEntryRecord(updatedEntry) : null
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const deleteAdminScheduleEntryRecord: RequestHandler = async (req, res, next) => {
  try {
    const entryId = asPositiveInteger(req.params.id, 'id');

    const existing = await findAdminScheduleEntryById(entryId);
    if (!existing) {
      return res.status(404).json({
        error: 'SCHEDULE_ENTRY_NOT_FOUND',
        message: `Schedule entry with id ${entryId} does not exist.`
      });
    }

    await deleteAdminScheduleEntry(entryId);

    return res.status(200).json({
      deleted: true,
      id: entryId
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const getAdminEntryFormOptions: RequestHandler = async (_req, res, next) => {
  try {
    const [rooms, lecturers, studentGroups, classTypes, subjects] = await Promise.all([
      listRoomOptions(),
      listLecturerOptions(),
      listStudentGroupOptions(),
      listClassTypeOptions(),
      listSubjectOptions()
    ]);

    return res.status(200).json({
      rooms: rooms.map(mapRoomOption),
      lecturers: lecturers.map(mapReferenceOption),
      studentGroups: studentGroups.map(mapReferenceOption),
      classTypes: classTypes.map(mapReferenceOption),
      subjects: subjects.map(mapSubjectRecord)
    });
  } catch (error) {
    return next(error);
  }
};
