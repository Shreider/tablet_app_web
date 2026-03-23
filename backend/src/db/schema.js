export const schemaSql = `
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(32) NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  building TEXT NOT NULL,
  wing TEXT NOT NULL,
  floor_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  lecturer TEXT NOT NULL,
  group_name TEXT NOT NULL,
  class_type TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT NOT NULL,
  note TEXT,
  field_of_study TEXT,
  subject_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT schedule_entries_time_order CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_schedule_entries_room_day
  ON schedule_entries (room_id, event_date, start_time);
`;

export const ensureSchema = async (dbClient) => {
  await dbClient.query(schemaSql);
};
