import type { NextFunction, Response } from 'express';
import type { AppError } from '../../types/errors.js';

export const handleAdminError = (
  error: unknown,
  res: Response,
  next: NextFunction
): Response | void => {
  const appError = error as AppError;

  if (appError.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: appError.message
    });
  }

  if (appError.code === 'P2002' || appError.code === '23505') {
    return res.status(409).json({
      error: 'DUPLICATE_VALUE',
      message: 'Record already exists with the same unique value.'
    });
  }

  if (appError.code === 'P2003' || appError.code === '23503') {
    return res.status(400).json({
      error: 'RELATION_VIOLATION',
      message: 'Referenced related record does not exist.'
    });
  }

  if (appError.code === 'P2004' || appError.code === '23514') {
    return res.status(400).json({
      error: 'CONSTRAINT_VIOLATION',
      message: 'Database constraint rejected provided data.'
    });
  }

  if (appError.code === 'P2025') {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Requested record does not exist.'
    });
  }

  return next(appError);
};
