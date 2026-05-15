import type { RequestHandler } from 'express';
import { getRooms } from '../services/roomsService.js';

export const getRoomsList: RequestHandler = async (_req, res, next) => {
  try {
    const payload = await getRooms();
    return res.status(200).json(payload);
  } catch (error) {
    return next(error);
  }
};
