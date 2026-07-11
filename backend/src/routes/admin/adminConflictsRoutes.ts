import { Router } from 'express';
import { getAdminConflicts } from '../../controllers/admin/adminConflictsController.js';

export const adminConflictsRoutes = Router();
adminConflictsRoutes.get('/', getAdminConflicts);
