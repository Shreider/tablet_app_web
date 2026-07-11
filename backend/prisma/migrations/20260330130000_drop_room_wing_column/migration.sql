-- Drop the now-unused plain text wing column from rooms.

ALTER TABLE "rooms" DROP COLUMN "wing";
