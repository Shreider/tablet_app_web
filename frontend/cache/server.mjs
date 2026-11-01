import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { FileCache, keyOf, MAX_BACKUP_BYTES } from './store.mjs';
import { RoomSchedule, localTime, validDate, validRoomId } from '../shared/roomSchedule.mjs';

class HttpError extends Error {
  constructor(status, message, code = 'CACHE_ERROR') { super(message); this.status = status; this.code = code; }
}

export function normalizeSource(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
    url.pathname !== '/' || url.search || url.hash) {
    throw new Error('BACKEND_URL musi być adresem HTTP lub HTTPS bez ścieżki i danych logowania.');
  }
  return url.origin;
}

function integer(value, fallback, minimum, maximum) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) throw new Error('Nieprawidłowy parametr cache.');
  return number;
}

async function readLimited(stream, limit) {
  let size = 0;
  const chunks = [];
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'Plik lub odpowiedź serwera jest zbyt duża.');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function createCacheServer(options) {
  const source = normalizeSource(options.backendUrl);
  const timeZone = options.timeZone ?? 'Europe/Warsaw';
  localTime(new Date(), timeZone); // Validate timezone before accepting requests.
  const refreshMs = options.refreshMs ?? 60_000;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const now = options.now ?? (() => new Date());
  const cache = new FileCache(options.directory, source, options.maxEntries ?? 500);
  await cache.open();
  const configuredRooms = new Set(options.roomIds ?? []);
  if ([...configuredRooms].some((roomId) => !validRoomId(roomId))) throw new Error('Nieprawidłowy CACHE_ROOM_IDS.');
  const attempts = new Map();
  const pending = new Map();
  const settingsPassword = options.settingsPassword || options.adminToken;
  const settingsLogin = { failures: 0, windowStart: 0, blockedUntil: 0 };

  async function unlockSettings(request, response) {
    if (!settingsPassword) {
      throw new HttpError(503, 'Dostęp do ustawień wymaga ustawienia API_SETTINGS_PASSWORD.');
    }
    const timestamp = now().getTime();
    if (timestamp < settingsLogin.blockedUntil) {
      const retryAfter = Math.ceil((settingsLogin.blockedUntil - timestamp) / 1000);
      return json(response, 429, { error: 'SETTINGS_LOCKED',
        message: `Zbyt wiele błędnych prób. Spróbuj ponownie za ${retryAfter} s.` },
      { 'Retry-After': String(retryAfter) });
    }
    if (settingsLogin.blockedUntil) {
      settingsLogin.failures = 0;
      settingsLogin.windowStart = timestamp;
      settingsLogin.blockedUntil = 0;
    }
    if (!request.headers['content-type']?.includes('application/json')) {
      throw new HttpError(415, 'Hasło należy przesłać jako JSON.');
    }
    let body;
    try { body = JSON.parse(await readLimited(request, 4096)); } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(400, 'Nieprawidłowe dane logowania.');
    }
    if (!body || typeof body.password !== 'string' || !body.password || body.password.length > 1024) {
      throw new HttpError(400, 'Wpisz hasło do ustawień API.');
    }
    const digest = (value) => createHash('sha256').update(value).digest();
    if (!timingSafeEqual(digest(body.password), digest(settingsPassword))) {
      if (timestamp - settingsLogin.windowStart >= 60_000) {
        settingsLogin.failures = 0;
        settingsLogin.windowStart = timestamp;
      }
      settingsLogin.failures++;
      if (settingsLogin.failures >= 5) settingsLogin.blockedUntil = timestamp + 30_000;
      throw new HttpError(401, 'Nieprawidłowe hasło.');
    }
    settingsLogin.failures = 0;
    settingsLogin.blockedUntil = 0;
    return json(response, 200, { authenticated: true });
  }

  async function refresh(roomId, date) {
    const key = keyOf(roomId, date);
    if (pending.has(key)) return pending.get(key);
    const operation = (async () => {
      const attempt = { at: now().getTime(), error: null };
      attempts.set(key, attempt);
      try {
        const response = await fetch(`${source}/api/room/${encodeURIComponent(roomId)}?date=${date}`, {
          headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs), redirect: 'error'
        });
        if (!response.ok) {
          // An authoritative 4xx must not resurrect a removed room from a backup.
          if (response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) {
            if (response.status === 404) await cache.forgetRoom(roomId);
            throw new HttpError(response.status, response.status === 404 ? 'Nie znaleziono sali.' :
              'Serwer źródłowy odrzucił żądanie.', 'UPSTREAM_REJECTED');
          }
          throw new HttpError(502, 'Serwer źródłowy jest chwilowo niedostępny.', 'UPSTREAM_UNAVAILABLE');
        }
        if (!response.headers.get('content-type')?.includes('application/json')) {
          await response.body?.cancel();
          throw new Error('Serwer nie zwrócił JSON.');
        }
        const json = JSON.parse(await readLimited(response.body, 2 * 1024 * 1024));
        const payload = RoomSchedule.fromJSON(json, { roomId, date }).toJSON(now(), timeZone);
        await cache.put({ roomId, date, payload, fetchedAt: now().toISOString(), imported: false });
      } catch (error) {
        attempt.error = error instanceof HttpError && error.code === 'UPSTREAM_REJECTED' ? error :
          new HttpError(503, 'Brak aktualnego połączenia lub poprawnej odpowiedzi serwera.', 'UPSTREAM_UNAVAILABLE');
      }
      return attempt;
    })().finally(() => pending.delete(key));
    pending.set(key, operation);
    return operation;
  }

  async function getRoom(roomId, date, explicitDate, force) {
    const key = keyOf(roomId, date);
    let entry = cache.get(roomId, date);
    let attempt = attempts.get(key);
    const lastCheck = Math.max(attempt?.at ?? 0, entry && !entry.imported ? Date.parse(entry.fetchedAt) : 0);
    if (pending.has(key)) attempt = await pending.get(key);
    else if (force || !lastCheck || now().getTime() - lastCheck >= refreshMs) attempt = await refresh(roomId, date);
    if (attempt?.error?.code === 'UPSTREAM_REJECTED') throw attempt.error;
    entry = cache.get(roomId, date) ?? (!explicitDate ? cache.latest(roomId, date) : undefined);
    if (!entry) throw attempt?.error ?? new HttpError(503, 'Nie zapisano jeszcze planu tej sali.');
    const payload = RoomSchedule.fromJSON(entry.payload).toJSON(now(), timeZone);
    return {
      ...payload,
      cache: {
        fetchedAt: entry.fetchedAt, timeZone, requestedDate: date,
        stale: Boolean(attempt?.error) || entry.imported || now().getTime() - Date.parse(entry.fetchedAt) >= refreshMs,
        outdated: entry.date !== date, imported: entry.imported
      }
    };
  }

  function authenticate(request) {
    const token = options.adminToken;
    const supplied = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice(7) : '';
    if (!token) throw new HttpError(503, 'Import i eksport wymagają ustawienia CACHE_ADMIN_TOKEN.');
    const actual = Buffer.from(supplied);
    const expected = Buffer.from(token);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new HttpError(401, 'Nieprawidłowy token administratora.');
    }
  }

  function json(response, status, value, headers = {}) {
    response.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', ...headers
    });
    response.end(JSON.stringify(value));
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://cache');
      if (url.pathname === '/healthz' && request.method === 'GET') {
        return json(response, 200, { status: 'ok', snapshots: cache.entries.size });
      }
      if (url.pathname === '/api/cache/settings/unlock' && request.method === 'POST') {
        return await unlockSettings(request, response);
      }
      const match = /^\/api\/room\/([^/]+)$/.exec(url.pathname);
      if (match && request.method === 'GET') {
        const roomId = decodeURIComponent(match[1]);
        const explicitDate = url.searchParams.has('date');
        const date = explicitDate ? url.searchParams.get('date') : localTime(now(), timeZone).date;
        if (!validRoomId(roomId) || !validDate(date) || url.searchParams.getAll('date').length > 1 ||
          [...url.searchParams.keys()].some((key) => !['date', 'refresh'].includes(key))) {
          throw new HttpError(400, 'Nieprawidłowy numer sali lub data planu.');
        }
        return json(response, 200, await getRoom(roomId, date, explicitDate, url.searchParams.get('refresh') === '1'));
      }
      if (url.pathname === '/api/cache/backup' && request.method === 'GET') {
        authenticate(request);
        return json(response, 200, cache.document(), {
          'Content-Disposition': `attachment; filename="room-tablet-${localTime(now(), timeZone).date}.json"`
        });
      }
      if (url.pathname === '/api/cache/import' && request.method === 'POST') {
        authenticate(request);
        if (!request.headers['content-type']?.includes('application/json')) {
          throw new HttpError(415, 'Wybierz plik JSON.');
        }
        if (Number(request.headers['content-length']) > MAX_BACKUP_BYTES) throw new HttpError(413, 'Plik jest zbyt duży.');
        let count;
        try {
          count = await cache.import(JSON.parse(await readLimited(request, MAX_BACKUP_BYTES)));
        } catch (error) {
          if (error instanceof HttpError) throw error;
          if (error.code) throw error; // Storage failures must not be reported as a malformed backup.
          throw new HttpError(400, error.message);
        }
        attempts.clear();
        return json(response, 200, { imported: count });
      }
      throw new HttpError(404, 'Nie znaleziono zasobu.');
    } catch (error) {
      const status = error instanceof URIError ? 400 : error.status ?? 500;
      if (!response.headersSent && !response.destroyed) {
        json(response, status, { error: error.code ?? 'CACHE_ERROR', message: status === 500 ?
          'Nie udało się zapisać lub odczytać lokalnej kopii.' : error.message });
      }
      if (status === 500) console.error('Błąd lokalnego cache:', error.code ?? error.name);
    }
  });
  server.requestTimeout = 15_000;

  let timer;
  let stopped = false;
  async function refreshKnownRooms() {
    const rooms = new Set([...configuredRooms, ...[...cache.entries.values()].map((entry) => entry.roomId)]);
    const date = localTime(now(), timeZone).date;
    // Limit parallel requests to the main server.
    const queue = [...rooms];
    await Promise.all(Array.from({ length: Math.min(queue.length, 4) }, async () => {
      while (queue.length) {
        const roomId = queue.shift();
        const entry = cache.get(roomId, date);
        const lastCheck = Math.max(attempts.get(keyOf(roomId, date))?.at ?? 0,
          entry && !entry.imported ? Date.parse(entry.fetchedAt) : 0);
        if (!lastCheck || now().getTime() - lastCheck >= refreshMs) await refresh(roomId, date);
      }
    }));
  }
  if (options.background !== false) {
    const tick = async () => {
      try { await refreshKnownRooms(); } catch (error) { console.error('Błąd odświeżania cache:', error.name); }
      if (!stopped) {
        timer = setTimeout(tick, refreshMs);
        timer.unref();
      }
    };
    server.once('listening', () => void tick());
  }
  server.once('close', () => { stopped = true; clearTimeout(timer); });
  return { server, cache, refreshKnownRooms };
}

export async function startCacheFromEnvironment() {
  const app = await createCacheServer({
    backendUrl: process.env.BACKEND_URL,
    directory: process.env.CACHE_DIR ?? './.cache',
    adminToken: process.env.CACHE_ADMIN_TOKEN,
    settingsPassword: process.env.API_SETTINGS_PASSWORD || process.env.CACHE_ADMIN_TOKEN,
    timeZone: process.env.APP_TIMEZONE ?? 'Europe/Warsaw',
    roomIds: (process.env.CACHE_ROOM_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean),
    refreshMs: integer(process.env.CACHE_REFRESH_SECONDS, 60, 5, 86_400) * 1000,
    timeoutMs: integer(process.env.CACHE_TIMEOUT_SECONDS, 5, 1, 30) * 1000,
    maxEntries: integer(process.env.CACHE_MAX_ENTRIES, 500, 1, 5000)
  });
  app.server.listen(integer(process.env.PORT, 3002, 1, 65535), '0.0.0.0', () => console.log('Lokalny cache planów działa.'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    app.server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startCacheFromEnvironment();
}
