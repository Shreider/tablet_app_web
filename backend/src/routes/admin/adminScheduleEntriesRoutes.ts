import { Router } from 'express';
import {
  createAdminScheduleEntryRecord,
  deleteAdminScheduleEntryRecord,
  getAdminEntryFormOptions,
  getAdminScheduleEntriesList,
  getAdminScheduleEntryDetails,
  updateAdminScheduleEntryRecord
} from '../../controllers/admin/adminScheduleEntriesController.js';

export const adminScheduleEntriesRoutes = Router();

adminScheduleEntriesRoutes.get('/options', getAdminEntryFormOptions);
adminScheduleEntriesRoutes.get('/', getAdminScheduleEntriesList);
adminScheduleEntriesRoutes.post('/', createAdminScheduleEntryRecord);
adminScheduleEntriesRoutes.get('/:id', getAdminScheduleEntryDetails);
adminScheduleEntriesRoutes.put('/:id', updateAdminScheduleEntryRecord);
adminScheduleEntriesRoutes.delete('/:id', deleteAdminScheduleEntryRecord);
