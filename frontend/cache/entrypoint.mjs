import { constants } from 'node:fs';
import { access, chown, mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { startCacheFromEnvironment } from './server.mjs';

const directory = process.env.CACHE_DIR ?? '/data';
await mkdir(directory, { recursive: true });

// Linux bind mounts retain the host owner's numeric IDs. Docker Desktop maps
// Windows folders into the Linux VM, where they may appear owned by root.
if (process.getuid() === 0) {
  const owner = await stat(directory);
  const uid = owner.uid === 0 ? 1000 : owner.uid;
  const gid = owner.uid === 0 ? 1000 : owner.gid;
  const paths = [directory, ...(await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^plans-.*\.json(?:\..*)?$/.test(entry.name))
    .map((entry) => join(directory, entry.name))];

  for (const path of paths) {
    try { await chown(path, uid, gid); } catch (error) {
      // Some host shares do not implement Unix ownership. After dropping root,
      // check real access instead of requiring chown support from Windows.
      if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
    }
  }
  process.setgroups([]);
  process.setgid(gid);
  process.setuid(uid);
}

try {
  await access(directory, constants.R_OK | constants.W_OK | constants.X_OK);
} catch {
  throw new Error(`Brak dostępu do zapisu cache w ${directory}. Sprawdź uprawnienia udostępnionego katalogu.`);
}
await startCacheFromEnvironment();
