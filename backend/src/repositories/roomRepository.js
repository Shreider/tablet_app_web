import { pool } from '../db/pool.js';

export const findAllRooms = async () => {
  const result = await pool.query(
    `
      SELECT id, room_code, display_name, building, wing, floor_label
      FROM rooms
      ORDER BY room_code ASC
    `
  );

  return result.rows;
};

export const findRoomByCode = async (roomCode) => {
  const result = await pool.query(
    `
      SELECT id, room_code, display_name, building, wing, floor_label
      FROM rooms
      WHERE LOWER(room_code) = LOWER($1)
      LIMIT 1
    `,
    [roomCode.trim()]
  );

  return result.rows[0] ?? null;
};

export const findRoomScheduleForDate = async (roomId, eventDate) => {
  const result = await pool.query(
    `
      SELECT
        id,
        title,
        lecturer,
        group_name,
        class_type,
        start_time,
        end_time,
        description,
        note,
        field_of_study,
        subject_code
      FROM schedule_entries
      WHERE room_id = $1
        AND event_date = $2
      ORDER BY start_time ASC
    `,
    [roomId, eventDate]
  );

  return result.rows;
};

export const findScheduleForDate = async (eventDate) => {
  const result = await pool.query(
    `
      SELECT
        se.id,
        se.title,
        se.lecturer,
        se.group_name,
        se.class_type,
        se.start_time,
        se.end_time,
        se.description,
        se.note,
        se.field_of_study,
        se.subject_code,
        r.id AS room_db_id,
        r.room_code,
        r.display_name,
        r.building,
        r.wing,
        r.floor_label
      FROM schedule_entries se
      JOIN rooms r ON r.id = se.room_id
      WHERE se.event_date = $1
      ORDER BY r.room_code ASC, se.start_time ASC
    `,
    [eventDate]
  );

  return result.rows;
};
