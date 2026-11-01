const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const stringFields = (value, fields) => fields.every((field) => typeof value[field] === 'string');

export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

export function validRoomId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 &&
    value === value.trim() && !/[\u0000-\u001f\u007f/\\]/.test(value) && !['.', '..'].includes(value);
}

export function localTime(now = new Date(), timeZone = 'Europe/Warsaw') {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: +parts.hour * 60 + +parts.minute };
}

const minutes = (time) => +time.slice(0, 2) * 60 + +time.slice(3, 5);

export function liveSchedule(data, now = new Date(), timeZone = 'Europe/Warsaw') {
  const current = localTime(now, timeZone);
  const schedule = data.schedule.map((entry) => {
    const status = entry.date < current.date ? 'finished' : entry.date > current.date ? 'upcoming' :
      current.minutes < minutes(entry.startTime) ? 'upcoming' :
      current.minutes < minutes(entry.endTime) ? 'current' : 'finished';
    return { ...entry, status, isCurrent: status === 'current' };
  });
  return {
    ...data, schedule,
    ...(data.cache ? { cache: { ...data.cache, outdated: data.cache.outdated || data.date < current.date } } : {}),
    currentLecture: schedule.find((entry) => entry.status === 'current') ?? null,
    nextLecture: schedule.find((entry) => entry.status === 'upcoming') ?? null
  };
}

// One data model is used for upstream responses, files, imports and the display.
export class RoomSchedule {
  static fromJSON(value, expected = {}) {
    const invalid = () => { throw new Error('Nieprawidłowy format planu sali.'); };
    if (!object(value) || !object(value.room) || !validRoomId(value.room.roomId) ||
      !stringFields(value.room, ['name', 'building', 'floor']) || !validDate(value.date) ||
      typeof value.generatedAt !== 'string' || !Number.isFinite(Date.parse(value.generatedAt)) ||
      !Array.isArray(value.schedule) || value.schedule.length > 2000 ||
      (expected.roomId !== undefined && value.room.roomId !== expected.roomId) ||
      (expected.date !== undefined && value.date !== expected.date)) invalid();

    const ids = new Set();
    const schedule = value.schedule.map((entry) => {
      if (!object(entry) || !stringFields(entry, [
        'id', 'title', 'room', 'date', 'lecturer', 'group', 'type', 'startTime', 'endTime', 'description'
      ]) || !entry.id || ids.has(entry.id) || entry.room !== value.room.roomId || entry.date !== value.date ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.startTime) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.endTime) || entry.startTime >= entry.endTime ||
        !['note', 'fieldOfStudy', 'subjectCode', 'subject'].every(
          (field) => entry[field] === undefined || typeof entry[field] === 'string'
        )) invalid();
      ids.add(entry.id);
      // Project known fields, rather than accepting arbitrary backup properties.
      return Object.fromEntries([
        'id', 'title', 'room', 'date', 'lecturer', 'group', 'type', 'startTime', 'endTime',
        'description', 'note', 'fieldOfStudy', 'subjectCode', 'subject'
      ].filter((field) => entry[field] !== undefined).map((field) => [field, entry[field]]));
    }).sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));

    const model = new RoomSchedule();
    model.value = {
      room: Object.fromEntries(['roomId', 'name', 'building', 'floor'].map((field) => [field, value.room[field]])),
      date: value.date, generatedAt: value.generatedAt, schedule
    };
    return model;
  }

  toJSON(now = new Date(), timeZone = 'Europe/Warsaw') {
    return liveSchedule(this.value, now, timeZone);
  }
}
