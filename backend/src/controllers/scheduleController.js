import { getSchedule, getScheduleForRoom } from '../services/scheduleService.js';

export const getScheduleList = async (req, res, next) => {
  try {
    const dateQuery = typeof req.query.date === 'string' ? req.query.date : null;
    const roomId = typeof req.query.roomId === 'string' ? req.query.roomId : null;

    if (roomId) {
      const roomPayload = await getScheduleForRoom(roomId, dateQuery);
      if (!roomPayload) {
        return res.status(404).json({
          error: 'ROOM_NOT_FOUND',
          message: `Room ${roomId} does not exist.`
        });
      }

      return res.status(200).json(roomPayload);
    }

    const payload = await getSchedule(dateQuery);
    return res.status(200).json(payload);
  } catch (error) {
    if (error.code === 'INVALID_DATE') {
      return res.status(400).json({
        error: 'INVALID_DATE',
        message: error.message
      });
    }

    return next(error);
  }
};
