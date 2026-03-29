import { PrismaClient } from '@prisma/client';
import { env } from '../src/config/env.ts';
import { getDateAndMinutesInTimezone } from '../src/db/time.ts';
import { roomSeeds } from '../src/seed/seedRooms.ts';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.databaseAdminUrl
    }
  }
});

const toDate = (dateIso: string): Date => new Date(`${dateIso}T00:00:00.000Z`);
const toTime = (timeValue: string): Date => new Date(`1970-01-01T${timeValue}:00.000Z`);

const main = async () => {
  const { dateIso } = getDateAndMinutesInTimezone(env.timezone);

  await prisma.$transaction(async (trx) => {
    await trx.scheduleEntry.deleteMany();
    await trx.room.deleteMany();

    for (const room of roomSeeds) {
      const createdRoom = await trx.room.create({
        data: {
          roomCode: room.roomCode,
          displayName: room.displayName,
          building: room.building,
          wing: room.wing,
          floorLabel: room.floorLabel
        }
      });

      if (room.entries.length > 0) {
        await trx.scheduleEntry.createMany({
          data: room.entries.map((entry) => ({
            roomId: createdRoom.id,
            eventDate: toDate(dateIso),
            title: entry.title,
            lecturer: entry.lecturer,
            groupName: entry.groupName,
            classType: entry.classType,
            startTime: toTime(entry.startTime),
            endTime: toTime(entry.endTime),
            description: entry.description,
            note: entry.note ?? null,
            fieldOfStudy: entry.fieldOfStudy ?? null,
            subjectCode: entry.subjectCode ?? null
          }))
        });
      }
    }
  });

  const roomsCount = await prisma.room.count();
  const entriesCount = await prisma.scheduleEntry.count();

  console.log(
    `Seed completed. Date=${dateIso}, rooms=${roomsCount}, schedule_entries=${entriesCount}.`
  );
};

main()
  .catch((error) => {
    console.error('Prisma seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
