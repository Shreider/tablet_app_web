import crypto from 'crypto';
import type { Request, RequestHandler } from 'express';
import { env } from '../config/env.js';

const safeEquals = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const resolveAdminToken = (req: Request): string => {
  const authorizationHeader = req.headers.authorization;

  if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.slice('Bearer '.length).trim();
  }

  const headerToken = req.headers['x-admin-token'];
  if (typeof headerToken === 'string') {
    return headerToken.trim();
  }

  return '';
};

export const verifyAdminToken = (candidateToken: string): boolean => {
  const normalizedCandidate = candidateToken.trim();
  const expectedToken = (env.adminToken ?? '').trim();

  if (!expectedToken || !normalizedCandidate) {
    return false;
  }

  return safeEquals(normalizedCandidate, expectedToken);
};

export const requireAdminAuth: RequestHandler = (req, res, next) => {
  const candidateToken = resolveAdminToken(req);

  if (!verifyAdminToken(candidateToken)) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Admin authorization token is invalid or missing.'
    });
  }

  req.adminAuth = {
    token: candidateToken,
    authenticated: true
  };

  return next();
};
