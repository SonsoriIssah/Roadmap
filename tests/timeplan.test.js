import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_SETTINGS } from '../public/js/data/defaults.js';
import { freeWindows, normaliseDayPlan, suggestTimes } from '../public/js/timeplan.js';
import { toMin as m } from '../public/js/dates.js';

const dp = DEFAULT_SETTINGS.dayPlan;
const lecture = (start, end, code = 'CSM 100') => ({ code, s: m(start), e: m(end) });
const task = (key, type, min, done = false) => ({ key, type, min, title: key, done });

test('free time leaves out lectures with time to get there, meals and hours outside your day', () => {
  assert.deepEqual(freeWindows([lecture('08:00', '10:00')], dp), [
    { s: m('06:00'), e: m('07:45') },
    { s: m('10:15'), e: m('12:30') },
    { s: m('13:30'), e: m('18:30') },
    { s: m('19:30'), e: m('22:00') },
  ]);
});

test('free time today starts from now, rounded up', () => {
  assert.equal(freeWindows([], dp, m('14:02'))[0].s, m('14:05'));
  assert.deepEqual(freeWindows([], dp, m('23:00')), []);
});

test('tasks avoid lectures, focused work and the interview step go first, and finished tasks get no time', () => {
  const day = {
    classes: [lecture('08:00', '12:00')],
    items: [task('step', 'interview', 10), task('revise', 'revise', 25), task('solve', 'problem', 35), task('old', 'lesson', 60, true)],
    roadmap: { id: 'W4', title: 'Project audit', min: 30 },
  };
  const { slots, short } = suggestTimes(day, dp);
  assert.deepEqual(short, []);
  assert.deepEqual(slots.get('solve'), [{ s: m('06:00'), e: m('06:35') }]);
  assert.deepEqual(slots.get('step'), [{ s: m('06:45'), e: m('06:55') }]);
  assert.deepEqual(slots.get('revise'), [{ s: m('07:05'), e: m('07:30') }]);
  assert.deepEqual(slots.get('roadmap'), [{ s: m('13:30'), e: m('14:00') }]); // no longer fits before the lecture
  assert.ok(!slots.has('old'));
});

test("a lecture's revision is suggested after that lecture, even with free time before it", () => {
  const revise = { key: 'r', type: 'revise', courseCode: 'CSM 273', min: 25, title: 'r', done: false };
  const { slots } = suggestTimes({ classes: [lecture('08:00', '10:00', 'CSM 273')], items: [revise, task('solve', 'problem', 30)] }, dp);
  assert.deepEqual(slots.get('r'), [{ s: m('10:15'), e: m('10:40') }]);
  assert.deepEqual(slots.get('solve'), [{ s: m('06:00'), e: m('06:30') }]);
});

test('a long task with no window big enough is split, and what cannot fit is reported', () => {
  const tight = { start: '06:00', end: '10:00', blocked: dp.blocked };
  const split = suggestTimes({ classes: [lecture('08:15', '08:30')], items: [task('long', 'lesson', 150)] }, tight);
  assert.deepEqual(split.slots.get('long'), [{ s: m('06:00'), e: m('08:00') }, { s: m('08:45'), e: m('09:15') }]);
  assert.deepEqual(split.short, []);

  const over = suggestTimes({ classes: [], items: [task('huge', 'lesson', 300)] }, tight);
  assert.deepEqual(over.short, [{ title: 'huge', min: 60 }]);
});

test('saved hours are checked, and missing ones fall back to the defaults', () => {
  assert.deepEqual(normaliseDayPlan(undefined), dp);
  const p = normaliseDayPlan({ start: '07:30', end: 'late', blocked: [{ start: '13:00', end: '14:00' }] });
  assert.equal(p.start, '07:30');
  assert.equal(p.end, dp.end);
  assert.equal(p.blocked[0].start, '13:00');
  assert.equal(p.blocked[1].start, dp.blocked[1].start);
});
