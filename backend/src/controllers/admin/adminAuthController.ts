import type { RequestHandler } from 'express';
import { resolveAdminToken, verifyAdminToken } from '../../middleware/adminAuth.js';
import { asNonEmptyString } from '../../utils/adminValidation.js';
import { handleAdminError } from './adminControllerUtils.js';

export const loginAdmin: RequestHandler = async (req, res, next) => {
  try {
    const token = asNonEmptyString(req.body?.token, 'token', 256);

    if (!verifyAdminToken(token)) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid admin token.'
      });
    }

    return res.status(200).json({
      token,
      authenticated: true,
      role: 'admin'
    });
  } catch (error) {
    return handleAdminError(error, res, next);
  }
};

export const validateAdminSession: RequestHandler = async (req, res) => {
  const token = resolveAdminToken(req);

  if (!verifyAdminToken(token)) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Admin authorization token is invalid or missing.'
    });
  }

  return res.status(200).json({
    authenticated: true,
    role: 'admin'
  });
};
