import { Router } from 'express';
import { getAdminDashboard } from '../../controllers/admin/adminDashboardController.js';

export const adminDashboardRoutes = Router();

adminDashboardRoutes.get('/', getAdminDashboard);
