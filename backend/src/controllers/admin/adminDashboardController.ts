import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { getDateAndMinutesInTimezone } from '../../db/time.js';
import { fetchConflictPairs } from '../../repositories/admin/adminConflictsRepository.js';
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

    const [stats, recentRooms, recentEntries, conflictPairs] = await Promise.all([
      fetchAdminDashboardStats(dateIso),
      fetchRecentRooms(6),
      fetchRecentScheduleEntries(10),
      fetchConflictPairs()
    ]);

    const warnings: DashboardWarning[] = [];

    if (stats.roomsWithoutEntries > 0) {
      warnings.push({
        code: 'ROOMS_WITHOUT_SCHEDULE',
        level: 'warning',
        message: `Sale bez wpisów harmonogramu: ${stats.roomsWithoutEntries}.`
      });
    }

    for (const pair of conflictPairs) {
      warnings.push({
        code: `OVERLAPPING_${pair.entryA.id}_${pair.entryB.id}`,
        level: 'critical',
        message: `Sala ${pair.entryA.roomCode} (${pair.entryA.eventDate}): wpis #${pair.entryA.id} (${pair.entryA.startTime}–${pair.entryA.endTime}) koliduje z wpisem #${pair.entryB.id} (${pair.entryB.startTime}–${pair.entryB.endTime}).`
      });
    }

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      date: dateIso,
      stats,
      conflicts: conflictPairs,
      recentRooms,
      recentEntries: recentEntries.map(mapScheduleEntryRecord),
      warnings
    });
  } catch (error) {
    return next(error);
  }
};
