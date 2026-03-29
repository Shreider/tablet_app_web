import { findAllRooms } from '../repositories/roomRepository.js';
import { mapRoomMetadata } from './schedulePresentation.js';

export const getRooms = async () => {
  const rooms = await findAllRooms();

  return {
    generatedAt: new Date().toISOString(),
    total: rooms.length,
    rooms: rooms.map(mapRoomMetadata)
  };
};
