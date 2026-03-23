import { Router } from 'express';
import { getRoomById } from '../controllers/roomController.js';

export const roomRoutes = Router();

roomRoutes.get('/:roomId', getRoomById);
