import { Router } from 'express';
import {
  createAdminRoomRecord,
  deleteAdminRoomRecord,
  getAdminRoomDetails,
  getAdminRoomsList,
  getAdminRoomsOptions,
  updateAdminRoomRecord
} from '../../controllers/admin/adminRoomsController.js';

export const adminRoomsRoutes = Router();

adminRoomsRoutes.get('/', getAdminRoomsList);
adminRoomsRoutes.get('/options', getAdminRoomsOptions);
adminRoomsRoutes.post('/', createAdminRoomRecord);
adminRoomsRoutes.get('/:id', getAdminRoomDetails);
adminRoomsRoutes.put('/:id', updateAdminRoomRecord);
adminRoomsRoutes.delete('/:id', deleteAdminRoomRecord);
