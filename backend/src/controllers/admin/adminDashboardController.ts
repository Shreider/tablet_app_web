import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { getDateAndMinutesInTimezone } from '../../db/time.js';
import {
  fetchAdminDashboardStats,
  fetchRecentRooms,
  fetchRecentScheduleEntries
} from '../../repositories/admin/adminDashboardRepository.js';
import type { DashboardWarning } from '../../types/domain.js';
import { mapScheduleEntryRecord } from '../../utils/adminMappers.js';

export const getAdminDashboard: RequestHandler = async (_req, res, next) => {
  try {
    const { dateIso } = getDateAndMinutesInTimezone(env.timezone);

    const [stats, recentRooms, recentEntries] = await Promise.all([
      fetchAdminDashboardStats(dateIso),
      fetchRecentRooms(6),
      fetchRecentScheduleEntries(10)
    ]);

    const warnings: DashboardWarning[] = [
      stats.roomsWithoutEntries > 0
        ? {
            code: 'ROOMS_WITHOUT_SCHEDULE',
            level: 'warning',
            message: `Rooms without schedule entries: ${stats.roomsWithoutEntries}.`
          }
        : null,
      stats.overlappingEntries > 0
        ? {
            code: 'OVERLAPPING_SCHEDULE',
            level: 'critical',
            message: `Detected overlapping schedule pairs: ${stats.overlappingEntries}.`
          }
        : null
    ].filter((warning): warning is DashboardWarning => warning !== null);

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      date: dateIso,
      stats,
      recentRooms,
      recentEntries: recentEntries.map(mapScheduleEntryRecord),
      warnings
    });
  } catch (error) {
    return next(error);
  }
};
