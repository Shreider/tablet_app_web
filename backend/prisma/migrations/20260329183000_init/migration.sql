-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "room_code" VARCHAR(32) NOT NULL,
    "display_name" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "wing" TEXT NOT NULL,
    "floor_label" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_entries" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "event_date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "lecturer" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "class_type" TEXT NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "description" TEXT NOT NULL,
    "note" TEXT,
    "field_of_study" TEXT,
    "subject_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_room_code_key" ON "rooms"("room_code");

-- CreateIndex
CREATE INDEX "idx_schedule_entries_room_day" ON "schedule_entries"("room_id", "event_date", "start_time");

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep the original logical time order rule from the previous schema.
ALTER TABLE "schedule_entries"
  ADD CONSTRAINT "schedule_entries_time_order" CHECK ("start_time" < "end_time");

-- Runtime read-only grants for the public API role (if it exists).
DO
$$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_app') THEN
    GRANT SELECT ON TABLE rooms TO web_app;
    GRANT SELECT ON TABLE schedule_entries TO web_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO web_app;
  END IF;
END
$$;
