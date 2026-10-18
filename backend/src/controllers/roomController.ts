import type { RequestHandler } from 'express';
import { getScheduleForRoom, isInvalidDateError } from '../services/scheduleService.js';

export const getRoomById: RequestHandler = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const requestedRoomId =
      typeof req.params.roomId === 'string' ? req.params.roomId.trim() : '';
    if (!requestedRoomId) {
      return res.status(400).json({
        error: 'INVALID_ROOM_ID',
        message: 'Room id is required.'
      });
    }

    const dateQuery = req.query.date;
    if (dateQuery !== undefined && (typeof dateQuery !== 'string' || !dateQuery)) {
      return res.status(400).json({
        error: 'INVALID_DATE',
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    const roomSchedule = await getScheduleForRoom(requestedRoomId, dateQuery ?? null);

    if (!roomSchedule) {
      return res.status(404).json({
        error: 'ROOM_NOT_FOUND',
        message: `Room ${requestedRoomId} does not exist.`
      });
    }

    return res.status(200).json(roomSchedule);
  } catch (error) {
    if (isInvalidDateError(error)) {
      return res.status(400).json({
        error: 'INVALID_DATE',
        message: error.message
      });
    }

    return next(error);
  }
};
