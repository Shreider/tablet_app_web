import pg from 'pg';
import { env } from '../config/env.js';
import { ensureSchema } from '../db/schema.js';
import { getDateAndMinutesInTimezone } from '../db/time.js';
import { seedDatabaseForDate } from '../seed/seedDatabase.js';

const { Pool } = pg;

const seedDatabase = async () => {
  const adminPool = new Pool({
    connectionString: env.databaseAdminUrl
  });
  const client = await adminPool.connect();

  try {
    const { dateIso } = getDateAndMinutesInTimezone(env.timezone);

    await client.query('BEGIN');
    await ensureSchema(client);

    const result = await seedDatabaseForDate(client, dateIso);

    await client.query('COMMIT');

    console.log(
      `Seed completed. Date=${result.dateIso}, rooms=${result.insertedRooms}, schedule_entries=${result.insertedEntries}.`
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await adminPool.end();
  }
};

seedDatabase().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
