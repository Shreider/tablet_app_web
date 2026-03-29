import { Router } from 'express';
import {
  loginAdmin,
  validateAdminSession
} from '../../controllers/admin/adminAuthController.js';

export const adminAuthRoutes = Router();

adminAuthRoutes.post('/login', loginAdmin);
adminAuthRoutes.get('/session', validateAdminSession);
