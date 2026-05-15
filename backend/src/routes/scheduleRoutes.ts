import { Router } from 'express';
import { getScheduleList } from '../controllers/scheduleController.js';

export const scheduleRoutes = Router();

scheduleRoutes.get('/', getScheduleList);
