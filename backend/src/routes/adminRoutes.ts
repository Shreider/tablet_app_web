import { Router } from 'express';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import { adminAuthRoutes } from './admin/adminAuthRoutes.js';
import { adminDashboardRoutes } from './admin/adminDashboardRoutes.js';
import { adminRoomsRoutes } from './admin/adminRoomsRoutes.js';
import { adminScheduleEntriesRoutes } from './admin/adminScheduleEntriesRoutes.js';

export const adminRoutes = Router();

adminRoutes.use('/auth', adminAuthRoutes);
adminRoutes.use(requireAdminAuth);
adminRoutes.use('/dashboard', adminDashboardRoutes);
adminRoutes.use('/rooms', adminRoomsRoutes);
adminRoutes.use('/schedule-entries', adminScheduleEntriesRoutes);
