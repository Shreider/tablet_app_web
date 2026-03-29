-- Dictionary/reference tables
CREATE TABLE "buildings" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "buildings_name_key" ON "buildings"("name");

CREATE TABLE "wings" (
  "id" SERIAL NOT NULL,
  "building_id" INTEGER NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wings_building_name_key" ON "wings"("building_id", "name");
CREATE INDEX "idx_wings_building" ON "wings"("building_id");

CREATE TABLE "floors" (
  "id" SERIAL NOT NULL,
  "label" VARCHAR(80) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "floors_label_key" ON "floors"("label");

CREATE TABLE "lecturers" (
  "id" SERIAL NOT NULL,
  "full_name" VARCHAR(160) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecturers_full_name_key" ON "lecturers"("full_name");

CREATE TABLE "student_groups" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_groups_name_key" ON "student_groups"("name");

CREATE TABLE "class_types" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "class_types_name_key" ON "class_types"("name");

CREATE TABLE "fields_of_study" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fields_of_study_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fields_of_study_name_key" ON "fields_of_study"("name");

CREATE TABLE "subjects" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "field_of_study_id" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");
CREATE UNIQUE INDEX "subjects_name_field_key" ON "subjects"("name", "field_of_study_id");
CREATE INDEX "idx_subjects_field" ON "subjects"("field_of_study_id");

-- Populate reference tables from existing textual columns
INSERT INTO "buildings" ("name")
SELECT DISTINCT TRIM("building")
FROM "rooms"
WHERE TRIM("building") <> ''
ORDER BY 1;

INSERT INTO "wings" ("building_id", "name")
SELECT DISTINCT b."id", TRIM(r."wing")
FROM "rooms" r
JOIN "buildings" b ON b."name" = TRIM(r."building")
WHERE TRIM(r."wing") <> ''
ORDER BY b."id", TRIM(r."wing");

INSERT INTO "floors" ("label")
SELECT DISTINCT TRIM("floor_label")
FROM "rooms"
WHERE TRIM("floor_label") <> ''
ORDER BY 1;

INSERT INTO "lecturers" ("full_name")
SELECT DISTINCT TRIM("lecturer")
FROM "schedule_entries"
WHERE TRIM("lecturer") <> ''
ORDER BY 1;

INSERT INTO "student_groups" ("name")
SELECT DISTINCT TRIM("group_name")
FROM "schedule_entries"
WHERE TRIM("group_name") <> ''
ORDER BY 1;

INSERT INTO "class_types" ("name")
SELECT DISTINCT TRIM("class_type")
FROM "schedule_entries"
WHERE TRIM("class_type") <> ''
ORDER BY 1;

INSERT INTO "fields_of_study" ("name")
SELECT DISTINCT COALESCE(NULLIF(TRIM("field_of_study"), ''), 'Nieprzypisany kierunek')
FROM "schedule_entries"
ORDER BY 1;

INSERT INTO "subjects" ("code", "name", "field_of_study_id")
SELECT DISTINCT
  COALESCE(
    NULLIF(TRIM(se."subject_code"), ''),
    'AUTO-' || SUBSTRING(
      md5(
        LOWER(TRIM(se."title")) || '|' ||
        COALESCE(LOWER(NULLIF(TRIM(se."field_of_study"), '')), 'nieprzypisany kierunek')
      ),
      1,
      12
    )
  ) AS "code",
  TRIM(se."title") AS "name",
  fos."id" AS "field_of_study_id"
FROM "schedule_entries" se
JOIN "fields_of_study" fos
  ON fos."name" = COALESCE(NULLIF(TRIM(se."field_of_study"), ''), 'Nieprzypisany kierunek')
ON CONFLICT ("code") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "field_of_study_id" = EXCLUDED."field_of_study_id",
  "updated_at" = CURRENT_TIMESTAMP;

-- Add FK columns to existing tables and migrate values
ALTER TABLE "rooms"
  ADD COLUMN "building_id" INTEGER,
  ADD COLUMN "wing_id" INTEGER,
  ADD COLUMN "floor_id" INTEGER;

UPDATE "rooms" r
SET
  "building_id" = b."id",
  "wing_id" = w."id",
  "floor_id" = f."id"
FROM "buildings" b, "wings" w, "floors" f
WHERE b."name" = TRIM(r."building")
  AND w."building_id" = b."id"
  AND w."name" = TRIM(r."wing")
  AND f."label" = TRIM(r."floor_label");

ALTER TABLE "rooms"
  ALTER COLUMN "building_id" SET NOT NULL,
  ALTER COLUMN "wing_id" SET NOT NULL,
  ALTER COLUMN "floor_id" SET NOT NULL;

ALTER TABLE "schedule_entries"
  ADD COLUMN "lecturer_id" INTEGER,
  ADD COLUMN "student_group_id" INTEGER,
  ADD COLUMN "class_type_id" INTEGER,
  ADD COLUMN "subject_id" INTEGER;

UPDATE "schedule_entries" se
SET
  "lecturer_id" = l."id",
  "student_group_id" = sg."id",
  "class_type_id" = ct."id",
  "subject_id" = s."id"
FROM "lecturers" l, "student_groups" sg, "class_types" ct, "fields_of_study" fos, "subjects" s
WHERE l."full_name" = TRIM(se."lecturer")
  AND sg."name" = TRIM(se."group_name")
  AND ct."name" = TRIM(se."class_type")
  AND fos."name" = COALESCE(NULLIF(TRIM(se."field_of_study"), ''), 'Nieprzypisany kierunek')
  AND s."code" = COALESCE(
    NULLIF(TRIM(se."subject_code"), ''),
    'AUTO-' || SUBSTRING(
      md5(
        LOWER(TRIM(se."title")) || '|' ||
        COALESCE(LOWER(NULLIF(TRIM(se."field_of_study"), '')), 'nieprzypisany kierunek')
      ),
      1,
      12
    )
  )
  AND s."field_of_study_id" = fos."id";

ALTER TABLE "schedule_entries"
  ALTER COLUMN "lecturer_id" SET NOT NULL,
  ALTER COLUMN "student_group_id" SET NOT NULL,
  ALTER COLUMN "class_type_id" SET NOT NULL,
  ALTER COLUMN "subject_id" SET NOT NULL;

-- Replace old FK behavior and add new relation constraints
ALTER TABLE "schedule_entries" DROP CONSTRAINT "schedule_entries_room_id_fkey";

ALTER TABLE "wings"
  ADD CONSTRAINT "wings_building_id_fkey"
  FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subjects"
  ADD CONSTRAINT "subjects_field_of_study_id_fkey"
  FOREIGN KEY ("field_of_study_id") REFERENCES "fields_of_study"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_building_id_fkey"
  FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "rooms_wing_id_fkey"
  FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "rooms_floor_id_fkey"
  FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedule_entries"
  ADD CONSTRAINT "schedule_entries_room_id_fkey"
  FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "schedule_entries_lecturer_id_fkey"
  FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "schedule_entries_student_group_id_fkey"
  FOREIGN KEY ("student_group_id") REFERENCES "student_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "schedule_entries_class_type_id_fkey"
  FOREIGN KEY ("class_type_id") REFERENCES "class_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "schedule_entries_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_rooms_building" ON "rooms"("building_id");
CREATE INDEX "idx_rooms_wing" ON "rooms"("wing_id");
CREATE INDEX "idx_rooms_floor" ON "rooms"("floor_id");
CREATE INDEX "idx_schedule_entries_lecturer" ON "schedule_entries"("lecturer_id");
CREATE INDEX "idx_schedule_entries_group" ON "schedule_entries"("student_group_id");
CREATE INDEX "idx_schedule_entries_class_type" ON "schedule_entries"("class_type_id");
CREATE INDEX "idx_schedule_entries_subject" ON "schedule_entries"("subject_id");

-- Remove textual columns replaced by FK relations
ALTER TABLE "rooms"
  DROP COLUMN "building",
  DROP COLUMN "wing",
  DROP COLUMN "floor_label";

ALTER TABLE "schedule_entries"
  DROP COLUMN "lecturer",
  DROP COLUMN "group_name",
  DROP COLUMN "class_type",
  DROP COLUMN "field_of_study",
  DROP COLUMN "subject_code";

-- Runtime read-only grants for the public API role (if it exists).
DO
$$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_app') THEN
    GRANT SELECT ON TABLE buildings TO web_app;
    GRANT SELECT ON TABLE wings TO web_app;
    GRANT SELECT ON TABLE floors TO web_app;
    GRANT SELECT ON TABLE lecturers TO web_app;
    GRANT SELECT ON TABLE student_groups TO web_app;
    GRANT SELECT ON TABLE class_types TO web_app;
    GRANT SELECT ON TABLE fields_of_study TO web_app;
    GRANT SELECT ON TABLE subjects TO web_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO web_app;
  END IF;
END
$$;
