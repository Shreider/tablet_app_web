import { Router } from 'express';
import { getApiHealth } from '../controllers/healthController.js';

export const healthRoutes = Router();

healthRoutes.get('/', getApiHealth);
