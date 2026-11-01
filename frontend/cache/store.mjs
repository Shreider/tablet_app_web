import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RoomSchedule, validDate, validRoomId } from '../shared/roomSchedule.mjs';

export const keyOf = (roomId, date) => JSON.stringify([roomId, date]);
export const MAX_BACKUP_BYTES = 8 * 1024 * 1024;

export class FileCache {
  constructor(directory, source, maxEntries = 500) {
    this.directory = directory;
    this.source = source;
    this.maxEntries = maxEntries;
    const namespace = createHash('sha256').update(source).digest('hex').slice(0, 20);
    this.file = join(directory, `plans-${namespace}.json`);
    this.entries = new Map();
    this.queue = Promise.resolve();
  }

  validateBackup(backup) {
    if (!backup || backup.format !== 'room-tablet-cache' || backup.version !== 1 ||
      backup.source !== this.source || !Array.isArray(backup.entries) ||
      backup.entries.length > this.maxEntries) {
      throw new Error('Nieprawidłowa kopia lub kopia z innego serwera źródłowego.');
    }
    const entries = new Map();
    for (const entry of backup.entries) {
      if (!entry || !validRoomId(entry.roomId) || !validDate(entry.date) ||
        typeof entry.fetchedAt !== 'string' || !Number.isFinite(Date.parse(entry.fetchedAt)) ||
        Date.parse(entry.fetchedAt) > Date.now() + 60_000) {
        throw new Error('Kopia zawiera nieprawidłowe dane lub datę zapisu.');
      }
      const payload = RoomSchedule.fromJSON(entry.payload, { roomId: entry.roomId, date: entry.date }).toJSON();
      const key = keyOf(entry.roomId, entry.date);
      if (entries.has(key)) throw new Error('Kopia zawiera powtórzony plan sali.');
      entries.set(key, {
        roomId: entry.roomId, date: entry.date, fetchedAt: entry.fetchedAt,
        imported: entry.imported === true, payload
      });
    }
    return entries;
  }

  document(entries = this.entries) {
    return {
      format: 'room-tablet-cache', version: 1, source: this.source,
      exportedAt: new Date().toISOString(), entries: [...entries.values()]
    };
  }

  async open() {
    await mkdir(this.directory, { recursive: true });
    try {
      this.entries = this.validateBackup(JSON.parse(await readFile(this.file, 'utf8')));
    } catch (error) {
      if (error.code === 'ENOENT') return;
      // Preserve a damaged file for recovery instead of silently overwriting it.
      if (error.code) throw error;
      await rename(this.file, `${this.file}.corrupt-${Date.now()}`);
      console.warn('Uszkodzony cache zachowano w pliku .corrupt; uruchamiam pusty cache.');
    }
  }

  async update(change) {
    const operation = this.queue.then(async () => {
      const next = new Map(this.entries);
      change(next);
      // Bound disk usage while retaining the most recently fetched snapshots.
      const ordered = [...next.entries()].sort((a, b) => b[1].fetchedAt.localeCompare(a[1].fetchedAt));
      const pruned = new Map(ordered.slice(0, this.maxEntries));
      const json = JSON.stringify(this.document(pruned));
      if (Buffer.byteLength(json) > MAX_BACKUP_BYTES) throw new Error('Przekroczono limit rozmiaru cache.');
      const temporary = `${this.file}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, json, { mode: 0o600, flush: true });
        await rename(temporary, this.file);
      } catch (error) {
        await unlink(temporary).catch(() => {});
        throw error;
      }
      this.entries = pruned;
    });
    this.queue = operation.catch(() => {});
    return operation;
  }

  get(roomId, date) { return this.entries.get(keyOf(roomId, date)); }

  latest(roomId, date) {
    return [...this.entries.values()].filter((entry) => entry.roomId === roomId && entry.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  }

  async put(entry) { await this.update((entries) => entries.set(keyOf(entry.roomId, entry.date), entry)); }

  async forgetRoom(roomId) {
    await this.update((entries) => {
      for (const [key, entry] of entries) if (entry.roomId === roomId) entries.delete(key);
    });
  }

  async import(backup) {
    const imported = this.validateBackup(backup);
    await this.update((entries) => {
      for (const [key, entry] of imported) entries.set(key, { ...entry, imported: true });
    });
    return imported.size;
  }
}
