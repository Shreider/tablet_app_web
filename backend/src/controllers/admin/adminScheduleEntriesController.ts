import type { RequestHandler } from 'express';
import {
  createAdminScheduleEntry,
  deleteAdminScheduleEntry,
  findAdminScheduleEntryById,
  listAdminScheduleEntries,
  listDistinctClassTypes,
  updateAdminScheduleEntry
} from '../../repositories/admin/adminScheduleEntriesRepository.js';
import { findAdminRoomById, listRoomOptions } from '../../repositories/admin/adminRoomsRepository.js';
import type { ScheduleEntryPayload } from '../../types/domain.js';
import { createError } from '../../types/errors.js';
import { mapRoomOption, mapScheduleEntryRecord } from '../../utils/adminMappers.js';
import {
  asIsoDate,
  asNonEmptyString,
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
  'title',
  'lecturer',
  'classType',
  'createdAt',
  'roomCode'
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
  const title = asNonEmptyString(data.title, 'title', 200);
  const lecturer = asNonEmptyString(data.lecturer, 'lecturer', 160);
  const groupName = asNonEmptyString(data.groupName, 'groupName', 160);
  const classType = asNonEmptyString(data.classType, 'classType', 120);
  const startTime = asTime(data.startTime, 'startTime');
  const endTime = asTime(data.endTime, 'endTime');
  const description = asNonEmptyString(data.description, 'description', 500);
  const note = asOptionalString(data.note, 'note', 500);
  const fieldOfStudy = asOptionalString(data.fieldOfStudy, 'fieldOfStudy', 180);
  const subjectCode = asOptionalString(data.subjectCode, 'subjectCode', 64);

  ensureStartBeforeEnd(startTime, endTime);

  return {
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
  };
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
    const classType = typeof req.query.classType === 'string' ? req.query.classType.trim() : '';
    const lecturer = typeof req.query.lecturer === 'string' ? req.query.lecturer.trim() : '';
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
      classType,
      dateFrom,
      dateTo,
      lecturer,
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

    const room = await findAdminRoomById(payload.roomId);
    if (!room) {
      return res.status(400).json({
        error: 'INVALID_ROOM',
        message: `Room with id ${payload.roomId} does not exist.`
      });
    }

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

    const room = await findAdminRoomById(payload.roomId);
    if (!room) {
      return res.status(400).json({
        error: 'INVALID_ROOM',
        message: `Room with id ${payload.roomId} does not exist.`
      });
    }

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
    const [rooms, classTypes] = await Promise.all([listRoomOptions(), listDistinctClassTypes()]);

    return res.status(200).json({
      rooms: rooms.map(mapRoomOption),
      classTypes
    });
  } catch (error) {
    return next(error);
  }
};
