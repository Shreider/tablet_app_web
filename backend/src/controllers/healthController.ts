import type { RequestHandler } from 'express';
import { prisma } from '../db/prisma.js';

export const getApiHealth: RequestHandler = async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'ok',
      service: 'room-tablet-backend',
      database: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
};
