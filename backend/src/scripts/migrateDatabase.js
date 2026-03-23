import pg from 'pg';
import { env } from '../config/env.js';
import { ensureSchema } from '../db/schema.js';

const { Pool } = pg;

const migrateDatabase = async () => {
  const adminPool = new Pool({
    connectionString: env.databaseAdminUrl
  });
  const client = await adminPool.connect();

  try {
    await client.query('BEGIN');
    await ensureSchema(client);
    await client.query('COMMIT');
    console.log('Database migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await adminPool.end();
  }
};

migrateDatabase().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
