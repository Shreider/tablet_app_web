import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chown, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createCacheServer } from '../server.mjs';
import { FileCache, MAX_BACKUP_BYTES } from '../store.mjs';
import { localTime } from '../../shared/roomSchedule.mjs';

function fixture(roomId, date) {
  return {
    room: { roomId, name: `Sala ${roomId}`, building: 'Budynek C', floor: '2 piętro' },
    date, generatedAt: '2025-01-01T08:00:00Z', schedule: [{
      id: 'lec-1', title: 'Matematyka', room: roomId, date, lecturer: 'Jan Kowalski',
      group: 'A', type: 'Wykład', startTime: '09:00', endTime: '10:00', description: 'Plan testowy'
    }]
  };
}

const close = (server) => new Promise((resolve) => {
  server.close(resolve);
  server.closeAllConnections();
});

async function setup(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'room-tablet-cache-test-'));
  let now = new Date('2025-01-01T08:30:00Z');
  let requests = 0;
  let mode = 'ok';
  const upstream = createServer(async (request, response) => {
    requests++;
    if (mode === 'slow') await new Promise((resolve) => setTimeout(resolve, 150));
    if (mode === 'offline') { response.writeHead(503).end(); return; }
    if (mode === 'missing') { response.writeHead(404).end(); return; }
    if (mode === 'unauthorized') { response.writeHead(403).end(); return; }
    const url = new URL(request.url, 'http://upstream');
    const payload = fixture(decodeURIComponent(url.pathname.split('/').at(-1)), url.searchParams.get('date'));
    if (mode === 'wrong-room') payload.room.roomId = 'OTHER';
    if (mode === 'invalid') { response.writeHead(200, { 'Content-Type': 'application/json' }).end('{broken'); return; }
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(payload));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const config = {
    backendUrl: `http://127.0.0.1:${upstream.address().port}`, directory,
    adminToken: 'test-admin-token', background: false, now: () => now, ...options
  };
  let app;
  let url;
  async function start() {
    app = await createCacheServer(config);
    app.server.listen(0, '127.0.0.1');
    await once(app.server, 'listening');
    url = `http://127.0.0.1:${app.server.address().port}`;
  }
  await start();
  t.after(async () => { await close(app.server); await close(upstream); await rm(directory, { recursive: true, force: true }); });
  return {
    get app() { return app; }, directory, config,
    get requests() { return requests; }, setMode(value) { mode = value; },
    advance(ms) { now = new Date(+now + ms); },
    request(path = '/api/room/205', init) { return fetch(`${url}${path}`, init); },
    async restart() { await close(app.server); await start(); },
    stopUpstream() { return close(upstream); },
    async backup() {
      const response = await fetch(`${url}/api/cache/backup`, { headers: { Authorization: 'Bearer test-admin-token' } });
      assert.equal(response.status, 200);
      return response.json();
    },
    import(body) {
      return fetch(`${url}/api/cache/import`, {
        method: 'POST', headers: { Authorization: 'Bearer test-admin-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
  };
}

test('API settings unlock checks the server password, works offline and never returns the secret', async (t) => {
  const f = await setup(t, { settingsPassword: 'separate-settings-password' });
  await f.stopUpstream();
  const unlock = (password) => f.request('/api/cache/settings/unlock', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
  });
  // The backup token does not unlock settings when a separate password is configured.
  assert.equal((await unlock('test-admin-token')).status, 401);
  const rejected = await unlock('wrong-password');
  assert.equal(rejected.status, 401);
  assert.equal((await rejected.json()).message, 'Nieprawidłowe hasło.');
  const accepted = await unlock('separate-settings-password');
  assert.equal(accepted.status, 200);
  assert.equal(accepted.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await accepted.json(), { authenticated: true });
  assert.equal(f.requests, 0);
  assert.equal((await f.request('/api/cache/backup')).status, 401);
  assert.equal((await f.request('/api/cache/backup', {
    headers: { Authorization: 'Bearer separate-settings-password' }
  })).status, 401);
});

test('API settings use the existing backup token as fallback and stay locked without configuration', async (t) => {
  const f = await setup(t);
  const init = { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-admin-token' }) };
  const accepted = await f.request('/api/cache/settings/unlock', init);
  assert.equal(accepted.status, 200);
  const unconfigured = await setup(t, { adminToken: undefined });
  assert.equal((await unconfigured.request('/api/cache/settings/unlock', init)).status, 503);
});

test('API settings validate login bodies and temporarily block repeated wrong passwords', async (t) => {
  const f = await setup(t);
  const post = (body, contentType = 'application/json') => f.request('/api/cache/settings/unlock', {
    method: 'POST', headers: { 'Content-Type': contentType }, body
  });
  assert.equal((await post('{}', 'text/plain')).status, 415);
  for (const body of ['{broken', '{}', '{"password":null}', '{"password":123}', '{"password":""}']) {
    assert.equal((await post(body)).status, 400, body);
  }
  assert.equal((await post(JSON.stringify({ password: 'x'.repeat(5000) }))).status, 413);
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal((await post('{"password":"wrong"}')).status, 401);
  }
  const locked = await post('{"password":"test-admin-token"}');
  assert.equal(locked.status, 429);
  assert.equal(locked.headers.get('retry-after'), '30');
  f.advance(30_000);
  assert.equal((await post('{"password":"test-admin-token"}')).status, 200);
  // Unlocking does not depend on or prevent the public room display.
  assert.equal((await f.request()).status, 200);
});

test('a successful plan is saved as JSON and fresh reads do not hit the main server', async (t) => {
  const f = await setup(t);
  const first = await f.request();
  assert.equal(first.status, 200);
  const data = await first.json();
  assert.equal(data.currentLecture.title, 'Matematyka');
  assert.equal(data.cache.stale, false);
  const saved = JSON.parse(await readFile(f.app.cache.file, 'utf8'));
  assert.equal(saved.entries[0].payload.room.roomId, '205');
  await f.request();
  assert.equal(f.requests, 1);
});

test('disk cache survives a service restart with the main server completely offline', async (t) => {
  const f = await setup(t);
  await f.request();
  await f.stopUpstream();
  f.advance(61_000);
  await f.restart();
  const response = await f.request();
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.room.roomId, '205');
  assert.equal(data.cache.stale, true);
  assert.equal(data.cache.fetchedAt, '2025-01-01T08:30:00.000Z');
});

test('invalid upstream JSON or data from another room never replaces the good snapshot', async (t) => {
  const f = await setup(t);
  await f.request();
  const original = await readFile(f.app.cache.file, 'utf8');
  for (const mode of ['invalid', 'wrong-room']) {
    f.setMode(mode);
    const response = await f.request('/api/room/205?refresh=1');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).cache.stale, true);
    assert.equal(await readFile(f.app.cache.file, 'utf8'), original);
  }
});

test('real 404 and 403 responses do not fall back to a previous plan', async (t) => {
  const f = await setup(t);
  await f.request();
  f.setMode('unauthorized');
  assert.equal((await f.request('/api/room/205?refresh=1')).status, 403);
  f.setMode('missing');
  assert.equal((await f.request('/api/room/205?refresh=1')).status, 404);
  assert.equal(f.app.cache.entries.size, 0);
});

test('at midnight an unavailable current plan is explicitly marked as yesterday; explicit dates never substitute another day', async (t) => {
  const f = await setup(t);
  await f.request();
  f.advance(24 * 60 * 60 * 1000);
  f.setMode('offline');
  const data = await (await f.request()).json();
  assert.equal(data.date, '2025-01-01');
  assert.equal(data.cache.requestedDate, '2025-01-02');
  assert.equal(data.cache.outdated, true);
  assert.equal(data.currentLecture, null);
  assert.equal(data.nextLecture, null);
  assert.equal((await f.request('/api/room/205?date=2025-01-02')).status, 503);
});

test('backup operations require a bearer token, validate the whole file and preserve fetch timestamps', async (t) => {
  const f = await setup(t);
  await f.request();
  assert.equal((await f.request('/api/cache/backup')).status, 401);
  assert.equal((await f.request('/api/cache/import', { method: 'POST' })).status, 401);
  const backup = await f.backup();
  assert.ok(!JSON.stringify(backup).includes('test-admin-token'));
  const original = await readFile(f.app.cache.file, 'utf8');
  const broken = structuredClone(backup);
  broken.entries.push({ ...broken.entries[0], roomId: '30' });
  assert.equal((await f.import(broken)).status, 400);
  assert.equal(await readFile(f.app.cache.file, 'utf8'), original);
  const foreign = { ...backup, source: 'http://another-server:3001' };
  assert.equal((await f.import(foreign)).status, 400);
  assert.equal((await f.import(backup)).status, 200);
  f.setMode('offline');
  const imported = await (await f.request()).json();
  assert.equal(imported.cache.imported, true);
  assert.equal(imported.cache.stale, true);
  assert.equal(imported.cache.fetchedAt, backup.entries[0].fetchedAt);
  assert.equal((await f.request('/api/cache/import', {
    method: 'POST', headers: { Authorization: 'Bearer test-admin-token', 'Content-Type': 'application/json' },
    body: ' '.repeat(MAX_BACKUP_BYTES + 1)
  })).status, 413);
});

test('changing the configured source isolates the previous server cache', async (t) => {
  const f = await setup(t);
  await f.request();
  const isolated = new FileCache(f.directory, 'http://another-server:3001');
  await isolated.open();
  assert.equal(isolated.entries.size, 0);
  assert.notEqual(isolated.file, f.app.cache.file);
});

test('simultaneous visitors share a fetch and new rooms are retained when saved concurrently', async (t) => {
  const f = await setup(t);
  const responses = await Promise.all(Array.from({ length: 8 }, () => f.request()));
  assert.ok(responses.every((response) => response.status === 200));
  assert.equal(f.requests, 1);
  await Promise.all(['30', '40'].map((room) => f.request(`/api/room/${room}`)));
  assert.equal(f.app.cache.entries.size, 3);
  const files = await readdir(f.directory);
  assert.deepEqual(files, [f.app.cache.file.split('/').at(-1)]);
});

test('background refresh updates known rooms without a browser, then recovers after an outage', async (t) => {
  const f = await setup(t, { roomIds: ['205'] });
  await f.app.refreshKnownRooms();
  assert.equal(f.app.cache.entries.size, 1);
  f.advance(61_000);
  f.setMode('offline');
  await f.app.refreshKnownRooms();
  assert.equal((await (await f.request()).json()).cache.stale, true);
  f.advance(61_000);
  f.setMode('ok');
  await f.app.refreshKnownRooms();
  assert.equal((await (await f.request()).json()).cache.stale, false);
});

test('timeouts have a bounded wait; without a snapshot the service returns 503', async (t) => {
  const f = await setup(t, { timeoutMs: 30 });
  f.setMode('slow');
  const start = Date.now();
  assert.equal((await f.request()).status, 503);
  assert.ok(Date.now() - start < 1000);
  assert.equal(f.app.cache.entries.size, 0);
});

test('invalid and repeated dates are rejected before making an upstream request', async (t) => {
  const f = await setup(t);
  for (const path of ['/api/room/205?date=2025-02-30', '/api/room/205?date=',
    '/api/room/205?date=2025-01-01&date=2025-01-02', '/api/room/%2Fetc%2Fpasswd']) {
    assert.equal((await f.request(path)).status, 400);
  }
  assert.equal(f.requests, 0);
});

for (const ownerUid of [0, 12345]) {
  test(`bind directory owned by UID ${ownerUid}: preserve saved plans, drop root and write as its owner`, {
    skip: process.getuid?.() !== 0
  }, async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'room-tablet-bind-test-'));
    const upstream = createServer((request, response) => {
      const url = new URL(request.url, 'http://upstream');
      response.writeHead(200, { 'Content-Type': 'application/json' })
        .end(JSON.stringify(fixture('205', url.searchParams.get('date'))));
    });
    upstream.listen(0, '127.0.0.1');
    await once(upstream, 'listening');
    let child;
    t.after(async () => {
      if (child && child.exitCode === null && child.signalCode === null) {
        const exited = once(child, 'exit');
        child.kill('SIGTERM');
        await exited;
      }
      await close(upstream);
      await rm(directory, { recursive: true, force: true });
    });
    const source = `http://127.0.0.1:${upstream.address().port}`;
    const cache = new FileCache(directory, source);
    await cache.open();
    const date = localTime().date;
    await cache.put({ roomId: '205', date, fetchedAt: new Date().toISOString(),
      imported: false, payload: fixture('205', date) });
    // The file still belongs to root, as after copying data from another host.
    await chown(directory, ownerUid, ownerUid);
    const probe = createServer();
    probe.listen(0, '127.0.0.1');
    await once(probe, 'listening');
    const port = probe.address().port;
    await close(probe);
    child = spawn(process.execPath, [fileURLToPath(new URL('../entrypoint.mjs', import.meta.url))], {
      env: { ...process.env, CACHE_DIR: directory, BACKEND_URL: source, PORT: String(port), APP_TIMEZONE: 'Europe/Warsaw' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    let started = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(output);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/healthz`);
        if (response.ok) { started = true; break; }
      } catch { /* Wait for HTTP to start after dropping privileges. */ }
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    assert.ok(started, output);
    const expectedUid = ownerUid || 1000;
    const status = await readFile(`/proc/${child.pid}/status`, 'utf8');
    assert.match(status, new RegExp(`Uid:\\s+${expectedUid}\\s+${expectedUid}\\s+${expectedUid}\\s+${expectedUid}`));
    const response = await fetch(`http://127.0.0.1:${port}/api/room/205?refresh=1`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).cache.stale, false);
    assert.equal((await stat(cache.file)).uid, expectedUid);
    assert.equal((await stat(directory)).uid, expectedUid);
    const saved = JSON.parse(await readFile(cache.file, 'utf8'));
    assert.equal(saved.entries[0].roomId, '205');
  });
}
