import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RoomSchedule, liveSchedule, localTime, validDate } from './roomSchedule.mjs';

export function fixture(roomId = '205', date = '2025-01-01') {
  return {
    room: { roomId, name: `Sala ${roomId}`, building: 'Budynek C', floor: '2 piętro' },
    date, generatedAt: '2025-01-01T08:00:00.000Z',
    currentLecture: null, nextLecture: null,
    schedule: [{
      id: 'lec-1', title: 'Matematyka', room: roomId, date, lecturer: 'Jan Kowalski',
      group: 'A', type: 'Wykład', startTime: '09:00', endTime: '10:00',
      description: 'Plan testowy', status: 'upcoming', isCurrent: false
    }]
  };
}

test('cached statuses follow the clock at lesson boundaries without a network request', () => {
  const data = RoomSchedule.fromJSON(fixture()).toJSON();
  for (const [time, status] of [['07:59', 'upcoming'], ['08:00', 'current'], ['08:59', 'current'], ['09:00', 'finished']]) {
    const result = liveSchedule(data, new Date(`2025-01-01T${time}:00Z`));
    assert.equal(result.schedule[0].status, status);
    assert.equal(result.currentLecture?.id ?? null, status === 'current' ? 'lec-1' : null);
    assert.equal(result.nextLecture?.id ?? null, status === 'upcoming' ? 'lec-1' : null);
  }
});

test('previous-day plans never show current lessons and Warsaw midnight uses the local date', () => {
  const data = { ...fixture(), cache: { outdated: false } };
  const result = liveSchedule(data, new Date('2025-01-02T08:30:00Z'));
  assert.equal(result.schedule[0].status, 'finished');
  assert.equal(result.currentLecture, null);
  assert.equal(result.nextLecture, null);
  assert.equal(result.cache.outdated, true);
  assert.equal(localTime(new Date('2025-01-01T23:05:00Z')).date, '2025-01-02');
});

test('the model rejects mismatched rooms, dates, impossible times and duplicate events', () => {
  for (const mutate of [
    (data) => { data.schedule[0].room = '30'; },
    (data) => { data.schedule[0].date = '2025-01-02'; },
    (data) => { data.date = '2025-02-30'; },
    (data) => { data.schedule[0].startTime = '25:00'; },
    (data) => { data.schedule[0].endTime = '08:00'; },
    (data) => { data.schedule.push(data.schedule[0]); }
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(() => RoomSchedule.fromJSON(data));
  }
  assert.throws(() => RoomSchedule.fromJSON(fixture(), { roomId: '30' }));
  assert.throws(() => RoomSchedule.fromJSON(fixture(), { date: '2025-01-02' }));
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2025-02-29'), false);
});
