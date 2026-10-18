import assert from 'node:assert/strict';
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { after, before, test } from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('..', import.meta.url));
const prefix = `api-${process.pid}-${Date.now().toString(36)}`;
let database: typeof import('../src/db/prisma.js') | undefined;
let server: ChildProcess | undefined;
let apiUrl: string;
let today: string;
let yesterday: string;
let tomorrow: string;
let roomCode: string;
let emptyRoomCode: string;
const fixtureIds: Record<string, number> = {};

before(async () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl, 'Set TEST_DATABASE_URL to a dedicated PostgreSQL test database.');
  assert.match(new URL(databaseUrl).pathname, /_test$/, 'The test database name must end with _test.');

  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_ADMIN_URL = databaseUrl;
  process.env.APP_TIMEZONE = 'Europe/Warsaw';

  await promisify(execFile)(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    cwd: backendDirectory,
    env: process.env
  });

  database = await import('../src/db/prisma.js');
  const db = database.prismaAdmin;
  const { getDateAndMinutesInTimezone } = await import('../src/db/time.js');
  today = getDateAndMinutesInTimezone('Europe/Warsaw').dateIso;
  const day = new Date(`${today}T12:00:00Z`);
  yesterday = new Date(day.getTime() - 86_400_000).toISOString().slice(0, 10);
  tomorrow = new Date(day.getTime() + 86_400_000).toISOString().slice(0, 10);

  fixtureIds.building = (await db.building.create({ data: { name: prefix } })).id;
  fixtureIds.floor = (await db.floor.create({ data: { label: prefix } })).id;
  fixtureIds.field = (await db.fieldOfStudy.create({ data: { name: prefix } })).id;
  fixtureIds.subject = (await db.subject.create({ data: {
    code: prefix, name: 'Przedmiot z bazy PostgreSQL', fieldOfStudyId: fixtureIds.field
  } })).id;
  fixtureIds.lecturer = (await db.lecturer.create({ data: { fullName: prefix } })).id;
  fixtureIds.group = (await db.studentGroup.create({ data: { name: prefix } })).id;
  fixtureIds.type = (await db.classType.create({ data: { name: prefix } })).id;

  roomCode = `${prefix}-205`;
  emptyRoomCode = `${prefix}-empty`;
  const createRoom = async (code: string) => (await db.room.create({ data: {
    roomCode: code, displayName: `Sala ${code}`,
    buildingId: fixtureIds.building, floorId: fixtureIds.floor
  } })).id;
  fixtureIds.room = await createRoom(roomCode);
  fixtureIds.emptyRoom = await createRoom(emptyRoomCode);
  fixtureIds.otherRoom = await createRoom(`${prefix}-other`);

  const entry = (roomId: number, date: string, start: string, end: string) => ({
    roomId,
    eventDate: new Date(`${date}T00:00:00Z`),
    title: 'Zajęcia z bazy PostgreSQL',
    subjectId: fixtureIds.subject,
    lecturerId: fixtureIds.lecturer,
    studentGroupId: fixtureIds.group,
    classTypeId: fixtureIds.type,
    startTime: new Date(`1970-01-01T${start}:00Z`),
    endTime: new Date(`1970-01-01T${end}:00Z`),
    description: 'Opis odczytany z bazy danych'
  });
  await db.scheduleEntry.createMany({ data: [
    entry(fixtureIds.room, today, '11:00', '12:00'),
    entry(fixtureIds.room, today, '08:00', '09:00'),
    entry(fixtureIds.room, yesterday, '08:00', '09:00'),
    entry(fixtureIds.room, tomorrow, '08:00', '09:00'),
    entry(fixtureIds.otherRoom, today, '08:00', '09:00')
  ] });

  const portProbe = createServer();
  portProbe.listen(0, '127.0.0.1');
  await once(portProbe, 'listening');
  const address = portProbe.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((resolve, reject) => portProbe.close(error => error ? reject(error) : resolve()));

  server = spawn(process.execPath, ['dist/index.js'], {
    cwd: backendDirectory,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  server.stdout?.on('data', chunk => { output += chunk; });
  server.stderr?.on('data', chunk => { output += chunk; });
  apiUrl = `http://127.0.0.1:${port}/api`;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Backend failed to start: ${output}`);
    try {
      if ((await fetch(`${apiUrl}/health`)).ok) return;
    } catch { /* Wait for the production server to accept connections. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Backend startup timed out: ${output}`);
}, { timeout: 30_000 });

after(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    const stopped = once(server, 'exit');
    server.kill('SIGTERM');
    await stopped;
  }
  if (!database) return;
  const db = database.prismaAdmin;
  const roomIds = [fixtureIds.room, fixtureIds.emptyRoom, fixtureIds.otherRoom].filter(Boolean);
  await db.scheduleEntry.deleteMany({ where: { roomId: { in: roomIds } } });
  await db.room.deleteMany({ where: { id: { in: roomIds } } });
  if (fixtureIds.subject) await db.subject.delete({ where: { id: fixtureIds.subject } });
  if (fixtureIds.field) await db.fieldOfStudy.delete({ where: { id: fixtureIds.field } });
  if (fixtureIds.lecturer) await db.lecturer.delete({ where: { id: fixtureIds.lecturer } });
  if (fixtureIds.group) await db.studentGroup.delete({ where: { id: fixtureIds.group } });
  if (fixtureIds.type) await db.classType.delete({ where: { id: fixtureIds.type } });
  if (fixtureIds.building) await db.building.delete({ where: { id: fixtureIds.building } });
  if (fixtureIds.floor) await db.floor.delete({ where: { id: fixtureIds.floor } });
  await database.closePrismaClients();
});

test('GET /room/:id returns JSON from the database for this room and today, ordered by start time', async () => {
  const response = await fetch(`${apiUrl}/room/${roomCode}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.room.roomId, roomCode);
  assert.equal(body.room.building, prefix);
  assert.equal(body.date, today);
  assert.ok(!Number.isNaN(Date.parse(body.generatedAt)));
  assert.equal(body.schedule.length, 2);
  assert.deepEqual(body.schedule.map((entry: { startTime: string }) => entry.startTime), ['08:00', '11:00']);
  for (const entry of body.schedule) {
    assert.equal(entry.room, roomCode);
    assert.equal(entry.date, today);
    assert.equal(entry.subject, 'Przedmiot z bazy PostgreSQL');
    assert.equal(entry.subjectCode, prefix);
    assert.equal(entry.lecturer, prefix);
    assert.equal(entry.group, prefix);
    assert.equal(entry.description, 'Opis odczytany z bazy danych');
  }
});

test('an explicit past date returns only that day and no current or upcoming lecture', async () => {
  const response = await fetch(`${apiUrl}/room/${roomCode}?date=${yesterday}`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.date, yesterday);
  assert.equal(body.schedule.length, 1);
  assert.equal(body.schedule[0].date, yesterday);
  assert.equal(body.schedule[0].status, 'finished');
  assert.equal(body.currentLecture, null);
  assert.equal(body.nextLecture, null);
});

test('an explicit future date returns upcoming lectures without marking them as currently running', async () => {
  const response = await fetch(`${apiUrl}/room/${roomCode}?date=${tomorrow}`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.date, tomorrow);
  assert.equal(body.schedule.length, 1);
  assert.equal(body.schedule[0].date, tomorrow);
  assert.equal(body.schedule[0].status, 'upcoming');
  assert.equal(body.currentLecture, null);
  assert.deepEqual(body.nextLecture, body.schedule[0]);
});

test('an existing room without lessons returns its metadata and an empty schedule', async () => {
  const response = await fetch(`${apiUrl}/room/${emptyRoomCode}`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.room.roomId, emptyRoomCode);
  assert.deepEqual(body.schedule, []);
  assert.equal(body.currentLecture, null);
  assert.equal(body.nextLecture, null);
});

test('an unknown room returns a JSON 404 instead of another room or a default schedule', async () => {
  const response = await fetch(`${apiUrl}/room/${prefix}-missing`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'ROOM_NOT_FOUND');
});

test('invalid, nonexistent, empty and repeated dates return JSON 400', async () => {
  for (const query of ['date=2026-02-30', 'date=18.10.2026', 'date=', 'date=2026-10-18&date=2026-10-19']) {
    const response = await fetch(`${apiUrl}/room/${roomCode}?${query}`);
    assert.equal(response.status, 400, query);
    assert.equal((await response.json()).error, 'INVALID_DATE', query);
  }
});
