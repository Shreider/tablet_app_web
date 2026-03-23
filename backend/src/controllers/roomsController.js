import { getRooms } from '../services/roomsService.js';

export const getRoomsList = async (_req, res, next) => {
  try {
    const payload = await getRooms();
    return res.status(200).json(payload);
  } catch (error) {
    return next(error);
  }
};
