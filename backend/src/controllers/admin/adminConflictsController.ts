import type { RequestHandler } from 'express';
import { fetchConflictPairs } from '../../repositories/admin/adminConflictsRepository.js';

export const getAdminConflicts: RequestHandler = async (_req, res, next) => {
  try {
    const conflicts = await fetchConflictPairs();
    return res.status(200).json({ conflicts, total: conflicts.length });
  } catch (error) {
    return next(error);
  }
};
