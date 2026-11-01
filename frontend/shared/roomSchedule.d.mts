import type { RoomScheduleResponse } from '../src/types/schedule';

export function validDate(value: unknown): boolean;
export function validRoomId(value: unknown): boolean;
export function localTime(now?: Date, timeZone?: string): { date: string; minutes: number };
export function liveSchedule(data: RoomScheduleResponse, now?: Date, timeZone?: string): RoomScheduleResponse;
export class RoomSchedule {
  static fromJSON(value: unknown, expected?: { roomId?: string; date?: string }): RoomSchedule;
  toJSON(now?: Date, timeZone?: string): RoomScheduleResponse;
}
