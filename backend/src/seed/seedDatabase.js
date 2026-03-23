import { roomSeeds } from './seedRooms.js';

export const seedDatabaseForDate = async (dbClient, dateIso) => {
  await dbClient.query('TRUNCATE TABLE schedule_entries RESTART IDENTITY CASCADE');
  await dbClient.query('TRUNCATE TABLE rooms RESTART IDENTITY CASCADE');

  let insertedRooms = 0;
  let insertedEntries = 0;

  for (const room of roomSeeds) {
    const roomInsert = await dbClient.query(
      `
        INSERT INTO rooms (room_code, display_name, building, wing, floor_label)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [room.roomCode, room.displayName, room.building, room.wing, room.floorLabel]
    );

    insertedRooms += 1;
    const roomId = roomInsert.rows[0].id;

    for (const entry of room.entries) {
      await dbClient.query(
        `
          INSERT INTO schedule_entries (
            room_id,
            event_date,
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
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [
          roomId,
          dateIso,
          entry.title,
          entry.lecturer,
          entry.groupName,
          entry.classType,
          entry.startTime,
          entry.endTime,
          entry.description,
          entry.note ?? null,
          entry.fieldOfStudy ?? null,
          entry.subjectCode ?? null
        ]
      );

      insertedEntries += 1;
    }
  }

  return {
    insertedRooms,
    insertedEntries,
    dateIso
  };
};
