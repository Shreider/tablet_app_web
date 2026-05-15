import { Router } from 'express';
import { getRoomsList } from '../controllers/roomsController.js';

export const roomsRoutes = Router();

roomsRoutes.get('/', getRoomsList);
