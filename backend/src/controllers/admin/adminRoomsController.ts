import type { RequestHandler } from 'express';
import { prismaAdmin } from '../../db/prisma.js';
import {
  countRoomScheduleEntries,
  createAdminRoom,
  deleteAdminRoom,
  deleteRoomScheduleEntries,
  findAdminRoomById,
  listAdminRooms,
  listRoomFilterOptions,
  listRoomOptions,
  listRecentScheduleEntriesForRoom,
  updateAdminRoom
} from '../../repositories/admin/adminRoomsRepository.js';
import type { RoomPayload } from '../../types/domain.js';
import { createError } from '../../types/errors.js';
import { mapRoomOption, mapRoomRecord, mapScheduleEntryRecord } from '../../utils/adminMappers.js';
import {
  asNonEmptyString,
  asPositiveInteger,
  parseBooleanFlag,
  parsePagination,
  parseSortOrder
} from '../../utils/adminValidation.js';
import { handleAdminError } from './adminControllerUtils.js';

const ROOM_SORT_FIELDS = new Set([
  'id',
  'roomCode',
  'displayName',
  'buildingName',
  'wingName',
  'floorLabel',
  'createdAt',
  'updatedAt',
  'entriesCount'
]);

const parseRoomPayload = (payload: unknown): RoomPayload => {
  const data = (payload ?? {}) as Record<string, unknown>;

  return {
    roomCode: asNonEmptyString(data.roomCode, 'roomCode', 32),
    displayName: asNonEmptyString(data.displayName, 'displayName', 120),
    buildingId: asPositiveInteger(data.buildingId, 'buildingId'),
    wingId: asPositiveInteger(data.wingId, 'wingId'),
    floorId: asPositiveInteger(data.floorId, 'floorId')
  };
};

const validateRoomRelations = async (payload: RoomPayload): Promise<void> => {
  const [building, wing, floor] = await Promise.all([
    prismaAdmin.building.findUnique({ where: { id: payload.buildingId }, select: { id: true, isActive: true } }),
    prismaAdmin.wing.findUnique({ where: { id: payload.wingId }, select: { id: true, buildingId: true, isActive: true } }),
    prismaAdmin.floor.findUnique({ where: { id: payload.floorId }, select: { id: true, isActive: true } })
  ]);

  if (!building || !building.isActive) {
    throw createError('buildingId does not point to an active building.', 'VALIDATION_ERROR');
  }

  if (!wing || !wing.isActive) {
    throw createError('wingId does not point to an active wing.', 'VALIDATION_ERROR');
  }

  if (wing.buildingId !== payload.buildingId) {
    throw createError('Selected wing does not belong to the selected building.', 'VALIDATION_ERROR');
  }

  if (!floor || !floor.isActive) {
    throw createError('floorId does not point to an active floor.', 'VALIDATION_ERROR');
  }
};

const parseRoomSortBy = (value: unknown): string => {
  if (!value) {
    return 'roomCode';
  }

  const normalized = String(value);

  if (!ROOM_SORT_FIELDS.has(normalized)) {
    throw createError(`sortBy has unsupported value: ${normalized}.`, 'VALIDATION_ERROR');
  }

  return normalized;
};

export const getAdminRoomsList: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const sortOrder = parseSortOrder(req.query.sortOrder);
    const sortBy = parseRoomSortBy(req.query.sortBy);

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const buildingId = req.query.buildingId ? asPositiveInteger(req.query.buildingId, 'buildingId') : null;
    const wingId = req.query.wingId ? asPositiveInteger(req.query.wingId, 'wingId') : null;
    const floorId = req.query.floorId ? asPositiveInteger(req.query.floorId, 'floorId') : null;

    const result = await listAdminRooms({
      page,
      limit,
      offset,
      search,
      buildingId,
      wingId,
      floorId,
      sortBy,
      sortOrder
    });

    return res.status(200).json({
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      rows: result.rows.map(mapRoomRecord)
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const getAdminRoomsOptions: RequestHandler = async (_req, res, next) => {
  try {
    const [roomOptions, facets] = await Promise.all([listRoomOptions(), listRoomFilterOptions()]);

    return res.status(200).json({
      rooms: roomOptions.map(mapRoomOption),
      buildings: facets.buildings,
      wings: facets.wings,
      floors: facets.floors
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminRoomDetails: RequestHandler = async (req, res, next) => {
  try {
    const roomId = asPositiveInteger(req.params.id, 'id');

    const room = await findAdminRoomById(roomId);

    if (!room) {
      return res.status(404).json({
        error: 'ROOM_NOT_FOUND',
        message: `Room with id ${roomId} does not exist.`
      });
    }

    const recentEntries = await listRecentScheduleEntriesForRoom(roomId, 12);

    return res.status(200).json({
      room: mapRoomRecord(room),
      relatedScheduleEntries: recentEntries.map(mapScheduleEntryRecord)
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const createAdminRoomRecord: RequestHandler = async (req, res, next) => {
  try {
    const payload = parseRoomPayload(req.body);
    await validateRoomRelations(payload);

    const roomId = await createAdminRoom(payload);
    const createdRoom = await findAdminRoomById(roomId);

    return res.status(201).json({
      room: createdRoom ? mapRoomRecord(createdRoom) : null
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const updateAdminRoomRecord: RequestHandler = async (req, res, next) => {
  try {
    const roomId = asPositiveInteger(req.params.id, 'id');

    const existing = await findAdminRoomById(roomId);
    if (!existing) {
      return res.status(404).json({
        error: 'ROOM_NOT_FOUND',
        message: `Room with id ${roomId} does not exist.`
      });
    }

    const payload = parseRoomPayload(req.body);
    await validateRoomRelations(payload);

    await updateAdminRoom(roomId, payload);

    const updatedRoom = await findAdminRoomById(roomId);

    return res.status(200).json({
      room: updatedRoom ? mapRoomRecord(updatedRoom) : null
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const deleteAdminRoomRecord: RequestHandler = async (req, res, next) => {
  try {
    const roomId = asPositiveInteger(req.params.id, 'id');

    const existing = await findAdminRoomById(roomId);
    if (!existing) {
      return res.status(404).json({
        error: 'ROOM_NOT_FOUND',
        message: `Room with id ${roomId} does not exist.`
      });
    }

    const cascadeFromQuery = parseBooleanFlag(req.query.cascade, false);
    const requestBody =
      typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const cascadeFromBody = parseBooleanFlag(requestBody.cascade, false);
    const allowCascade = cascadeFromQuery || cascadeFromBody;

    const relatedEntries = await countRoomScheduleEntries(roomId);

    if (relatedEntries > 0 && !allowCascade) {
      return res.status(409).json({
        error: 'ROOM_HAS_RELATED_SCHEDULE_ENTRIES',
        message:
          'This room has related schedule entries. Confirm cascade delete to remove the room together with related records.',
        relatedEntries
      });
    }

    let deletedEntries = 0;
    if (allowCascade && relatedEntries > 0) {
      deletedEntries = await deleteRoomScheduleEntries(roomId);
    }

    await deleteAdminRoom(roomId);

    return res.status(200).json({
      deleted: true,
      id: roomId,
      cascade: allowCascade,
      relatedEntriesDeleted: deletedEntries
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};
