-- Denormalize Room.wing into a plain text column and remove the wings catalog entity.

ALTER TABLE "rooms" ADD COLUMN "wing" VARCHAR(120);

UPDATE "rooms" r
SET "wing" = w."name"
FROM "wings" w
WHERE w."id" = r."wing_id";

ALTER TABLE "rooms" ALTER COLUMN "wing" SET NOT NULL;

ALTER TABLE "rooms" DROP CONSTRAINT "rooms_wing_id_fkey";

DROP INDEX "idx_rooms_wing";

ALTER TABLE "rooms" DROP COLUMN "wing_id";

DROP TABLE "wings";
