import { Router } from 'express';
import { healthRoutes } from './healthRoutes.js';
import { roomRoutes } from './roomRoutes.js';
import { roomsRoutes } from './roomsRoutes.js';
import { scheduleRoutes } from './scheduleRoutes.js';

export const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/room', roomRoutes);
apiRoutes.use('/rooms', roomsRoutes);
apiRoutes.use('/schedule', scheduleRoutes);
