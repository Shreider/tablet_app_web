import type { RequestHandler } from 'express';
import { getRoomSchedule } from '../services/roomService.js';

export const getRoomById: RequestHandler = async (req, res, next) => {
  try {
    const requestedRoomId =
      typeof req.params.roomId === 'string' ? req.params.roomId.trim() : '';
    if (!requestedRoomId) {
      return res.status(400).json({
        error: 'INVALID_ROOM_ID',
        message: 'Room id is required.'
      });
    }

    const roomSchedule = await getRoomSchedule(requestedRoomId);

    if (!roomSchedule) {
      return res.status(404).json({
        error: 'ROOM_NOT_FOUND',
        message: `Room ${requestedRoomId} does not exist.`
      });
    }

    return res.status(200).json(roomSchedule);
  } catch (error) {
    return next(error);
  }
};
