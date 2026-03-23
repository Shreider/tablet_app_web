import { pool } from '../db/pool.js';

export const getApiHealth = async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');

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
