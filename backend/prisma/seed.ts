import crypto from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { env } from '../src/config/env.ts';
import { getDateAndMinutesInTimezone } from '../src/db/time.ts';
import { roomSeeds } from '../src/seed/seedRooms.ts';

const pool = new Pool({
  connectionString: env.databaseAdminUrl
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter
});

const toDate = (dateIso: string): Date => new Date(`${dateIso}T00:00:00.000Z`);
const toTime = (timeValue: string): Date => new Date(`1970-01-01T${timeValue}:00.000Z`);

const normalize = (value: string): string => value.trim();

const resolveFieldOfStudyName = (value?: string): string => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : 'Nieprzypisany kierunek';
};

const resolveSubjectCode = (title: string, fieldOfStudyName: string, explicitCode?: string): string => {
  const normalized = explicitCode?.trim();
  if (normalized && normalized.length > 0) {
    return normalized;
  }

  const hash = crypto
    .createHash('md5')
    .update(`${title.trim().toLowerCase()}|${fieldOfStudyName.trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 12);

  return `AUTO-${hash}`;
};

const main = async () => {
  const { dateIso } = getDateAndMinutesInTimezone(env.timezone);

  await prisma.$transaction(async (trx) => {
    await trx.scheduleEntry.deleteMany();
    await trx.room.deleteMany();
    await trx.subject.deleteMany();
    await trx.classType.deleteMany();
    await trx.studentGroup.deleteMany();
    await trx.lecturer.deleteMany();
    await trx.wing.deleteMany();
    await trx.building.deleteMany();
    await trx.floor.deleteMany();
    await trx.fieldOfStudy.deleteMany();

    const floorLabels = Array.from(new Set(roomSeeds.map((room) => normalize(room.floorLabel)))).sort();
    const floors = await Promise.all(
      floorLabels.map((label, index) =>
        trx.floor.create({
          data: {
            label,
            sortOrder: index
          }
        })
      )
    );
    const floorByLabel = new Map(floors.map((row) => [row.label, row.id]));

    const buildingNames = Array.from(new Set(roomSeeds.map((room) => normalize(room.building)))).sort();
    const buildings = await Promise.all(
      buildingNames.map((name) =>
        trx.building.create({
          data: {
            name
          }
        })
      )
    );
    const buildingByName = new Map(buildings.map((row) => [row.name, row.id]));

    const wingPairs = Array.from(
      new Set(roomSeeds.map((room) => `${normalize(room.building)}|${normalize(room.wing)}`))
    )
      .sort()
      .map((key) => {
        const [buildingName, wingName] = key.split('|');
        return {
          buildingName,
          wingName
        };
      });

    const wings = await Promise.all(
      wingPairs.map(({ buildingName, wingName }) =>
        trx.wing.create({
          data: {
            buildingId: buildingByName.get(buildingName)!,
            name: wingName
          }
        })
      )
    );
    const wingByBuildingAndName = new Map(
      wings.map((row) => {
        const buildingName = buildingNames.find((name) => buildingByName.get(name) === row.buildingId)!;
        return [`${buildingName}|${row.name}`, row.id] as const;
      })
    );

    const fieldNames = Array.from(
      new Set(
        roomSeeds.flatMap((room) => room.entries.map((entry) => resolveFieldOfStudyName(entry.fieldOfStudy)))
      )
    ).sort();

    const fields = await Promise.all(
      fieldNames.map((name) =>
        trx.fieldOfStudy.create({
          data: {
            name
          }
        })
      )
    );
    const fieldByName = new Map(fields.map((row) => [row.name, row.id]));

    const lecturerNames = Array.from(
      new Set(roomSeeds.flatMap((room) => room.entries.map((entry) => normalize(entry.lecturer))))
    ).sort();
    const lecturers = await Promise.all(
      lecturerNames.map((fullName) =>
        trx.lecturer.create({
          data: {
            fullName
          }
        })
      )
    );
    const lecturerByName = new Map(lecturers.map((row) => [row.fullName, row.id]));

    const groupNames = Array.from(
      new Set(roomSeeds.flatMap((room) => room.entries.map((entry) => normalize(entry.groupName))))
    ).sort();
    const groups = await Promise.all(
      groupNames.map((name) =>
        trx.studentGroup.create({
          data: {
            name
          }
        })
      )
    );
    const groupByName = new Map(groups.map((row) => [row.name, row.id]));

    const classTypeNames = Array.from(
      new Set(roomSeeds.flatMap((room) => room.entries.map((entry) => normalize(entry.classType))))
    ).sort();
    const classTypes = await Promise.all(
      classTypeNames.map((name) =>
        trx.classType.create({
          data: {
            name
          }
        })
      )
    );
    const classTypeByName = new Map(classTypes.map((row) => [row.name, row.id]));

    const subjectRows = Array.from(
      new Map(
        roomSeeds
          .flatMap((room) => room.entries)
          .map((entry) => {
            const fieldName = resolveFieldOfStudyName(entry.fieldOfStudy);
            const subjectName = normalize(entry.title);
            const code = resolveSubjectCode(subjectName, fieldName, entry.subjectCode);
            return [
              code,
              {
                code,
                name: subjectName,
                fieldName
              }
            ] as const;
          })
      ).values()
    ).sort((left, right) => left.code.localeCompare(right.code));

    const subjects = await Promise.all(
      subjectRows.map((subject) =>
        trx.subject.create({
          data: {
            code: subject.code,
            name: subject.name,
            fieldOfStudyId: fieldByName.get(subject.fieldName)!
          }
        })
      )
    );
    const subjectByCode = new Map(subjects.map((row) => [row.code, row.id]));

    for (const room of roomSeeds) {
      const buildingName = normalize(room.building);
      const wingName = normalize(room.wing);
      const floorLabel = normalize(room.floorLabel);

      const createdRoom = await trx.room.create({
        data: {
          roomCode: normalize(room.roomCode),
          displayName: normalize(room.displayName),
          buildingId: buildingByName.get(buildingName)!,
          wingId: wingByBuildingAndName.get(`${buildingName}|${wingName}`)!,
          floorId: floorByLabel.get(floorLabel)!
        }
      });

      if (room.entries.length > 0) {
        await trx.scheduleEntry.createMany({
          data: room.entries.map((entry) => {
            const fieldName = resolveFieldOfStudyName(entry.fieldOfStudy);
            const subjectName = normalize(entry.title);
            const code = resolveSubjectCode(subjectName, fieldName, entry.subjectCode);

            return {
              roomId: createdRoom.id,
              eventDate: toDate(dateIso),
              title: subjectName,
              lecturerId: lecturerByName.get(normalize(entry.lecturer))!,
              studentGroupId: groupByName.get(normalize(entry.groupName))!,
              classTypeId: classTypeByName.get(normalize(entry.classType))!,
              subjectId: subjectByCode.get(code)!,
              startTime: toTime(entry.startTime),
              endTime: toTime(entry.endTime),
              description: normalize(entry.description),
              note: entry.note ? normalize(entry.note) : null
            };
          })
        });
      }
    }
  });

  const [roomsCount, entriesCount, lecturersCount, subjectsCount] = await Promise.all([
    prisma.room.count(),
    prisma.scheduleEntry.count(),
    prisma.lecturer.count(),
    prisma.subject.count()
  ]);

  console.log(
    `Seed completed. Date=${dateIso}, rooms=${roomsCount}, schedule_entries=${entriesCount}, lecturers=${lecturersCount}, subjects=${subjectsCount}.`
  );
};

main()
  .catch((error) => {
    console.error('Prisma seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([prisma.$disconnect(), pool.end()]);
  });
