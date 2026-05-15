import { Router } from 'express';
import {
  createAdminReferenceRecord,
  deleteAdminReferenceRecord,
  getAdminReferenceDependencies,
  getAdminReferencesDataset,
  updateAdminReferenceRecord
} from '../../controllers/admin/adminReferencesController.js';

export const adminReferencesRoutes = Router();

adminReferencesRoutes.get('/', getAdminReferencesDataset);
adminReferencesRoutes.get('/:entity/:id/dependencies', getAdminReferenceDependencies);
adminReferencesRoutes.post('/:entity', createAdminReferenceRecord);
adminReferencesRoutes.put('/:entity/:id', updateAdminReferenceRecord);
adminReferencesRoutes.delete('/:entity/:id', deleteAdminReferenceRecord);
