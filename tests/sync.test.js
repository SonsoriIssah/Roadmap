import { test } from 'node:test';
import assert from 'node:assert/strict';

import { defaultState, normalise, stampEdits } from '../public/js/store.js';
import { mergeStates, shareable, same } from '../public/js/sync.js';

const clone = (v) => JSON.parse(JSON.stringify(v));

// A synced starting point both devices share, with two problems in the bank.
const baseState = () => {
  const s = defaultState();
  s.problems = [
    { id: 'p1', title: 'Two Sum', status: 'new', stage: 'new' },
    { id: 'p2', title: '3Sum', status: 'new', stage: 'new' },
  ];
  s.checks = { 'kickoff:k1': '2026-10-20' };
  s.meta.edited = { problems: '2026-10-20T08:00:00.000Z' };
  return normalise(s);
};

// Change a copy the way the app does, stamping the edit time.
const edit = (state, at, fn) => {
  const next = clone(state);
  fn(next);
  return stampEdits(state, normalise(next), at);
};

test('changes made on each device are both kept', () => {
  const base = baseState();
  const phone = edit(base, '2026-10-21T09:00:00.000Z', (s) => {
    Object.assign(s.problems[0], { status: 'solved', stage: 'solved', firstAt: '2026-10-21', lastAt: '2026-10-21' });
    s.dsaLog.push({ id: 'l1', problemId: 'p1', date: '2026-10-21', kind: 'first', outcome: 'alone' });
  });
  const laptop = edit(base, '2026-10-21T18:00:00.000Z', (s) => {
    s.lessonDone.mo1 = '2026-10-21';
    s.checks['revise:2026-10-21:CSM 281'] = '2026-10-21';
  });
  const merged = normalise(mergeStates(base, laptop, phone));
  assert.equal(merged.problems.find((p) => p.id === 'p1').stage, 'solved');
  assert.deepEqual(merged.dsaLog.map((e) => e.id), ['l1']);
  assert.equal(merged.lessonDone.mo1, '2026-10-21');
  assert.ok(merged.checks['revise:2026-10-21:CSM 281']);
  assert.ok(merged.checks['kickoff:k1']);
  assert.equal(merged.meta.edited.problems, '2026-10-21T09:00:00.000Z');
  assert.equal(merged.meta.edited.lessonDone, '2026-10-21T18:00:00.000Z');
});

test('something removed on one device stays removed', () => {
  const base = baseState();
  const phone = edit(base, '2026-10-21T09:00:00.000Z', (s) => {
    delete s.checks['kickoff:k1'];
    s.problems = s.problems.filter((p) => p.id !== 'p2');
  });
  const merged = mergeStates(base, base, phone);
  assert.equal(merged.checks['kickoff:k1'], undefined);
  assert.deepEqual(merged.problems.map((p) => p.id), ['p1']);
});

test('when both devices changed the same problem, the later attempt wins it whole', () => {
  const base = baseState();
  const phone = edit(base, '2026-10-22T07:00:00.000Z', (s) => Object.assign(s.problems[0], { status: 'solved', stage: 'reimplemented', lastAt: '2026-10-24', nextReview: '2026-10-29' }));
  const laptop = edit(base, '2026-10-23T07:00:00.000Z', (s) => Object.assign(s.problems[0], { status: 'attempted', stage: 'attempted', lastAt: '2026-10-21', nextReview: '2026-10-22' }));
  const merged = mergeStates(base, laptop, phone);
  const p1 = merged.problems.find((p) => p.id === 'p1');
  assert.deepEqual([p1.stage, p1.nextReview], ['reimplemented', '2026-10-29']); // not a mix of the two
});

test('settings merge field by field; the newer edit wins the same field', () => {
  const base = baseState();
  const phone = edit(base, '2026-10-21T09:00:00.000Z', (s) => {
    s.settings.theme = 'dark';
    s.settings.courseBoost = 3;
  });
  const laptop = edit(base, '2026-10-21T10:00:00.000Z', (s) => {
    s.settings.theme = 'light';
    s.settings.problemOrder = 'sheet';
  });
  const merged = mergeStates(base, laptop, phone);
  assert.equal(merged.settings.theme, 'light'); // laptop edited settings later
  assert.equal(merged.settings.courseBoost, 3);
  assert.equal(merged.settings.problemOrder, 'sheet');
});

test('the preview date stays on its own device and is never uploaded', () => {
  const base = baseState();
  const phone = edit(base, '2026-10-21T09:00:00.000Z', (s) => (s.settings.previewDate = '2026-12-14'));
  const laptop = edit(base, '2026-10-21T10:00:00.000Z', (s) => (s.lessonDone.mo1 = '2026-10-21'));
  assert.equal(mergeStates(base, laptop, phone).settings.previewDate, null);
  assert.equal(mergeStates(base, phone, laptop).settings.previewDate, '2026-12-14');
  assert.equal(shareable(phone).settings.previewDate, null);
});

test("a device that was never used takes the other device's data on its first sync", () => {
  const fresh = defaultState();
  const phone = edit(baseState(), '2026-10-21T09:00:00.000Z', (s) => (s.calendar = s.calendar.filter((e) => e.id !== 'c-pre')));
  const merged = mergeStates(null, fresh, phone);
  assert.ok(!merged.calendar.some((e) => e.id === 'c-pre')); // a deletion on the phone is not undone
  assert.deepEqual(merged.problems.map((p) => p.id), ['p1', 'p2']);
});

test('a device with progress saved before sync existed is merged, not overwritten', () => {
  const oldLaptop = normalise({ ...defaultState(), lessonDone: { mo1: '2026-10-10' }, meta: {} }); // no edit times yet
  const phone = edit(baseState(), '2026-10-21T09:00:00.000Z', (s) => (s.lessonDone.mo2 = '2026-10-21'));
  const merged = mergeStates(null, oldLaptop, phone);
  assert.deepEqual(Object.keys(merged.lessonDone).sort(), ['mo1', 'mo2']);
});

test('two devices used before connecting keep everything from both on their first sync', () => {
  const phone = edit(baseState(), '2026-10-21T09:00:00.000Z', (s) => s.problems.push({ id: 'p3', title: 'Valid Anagram', status: 'new', stage: 'new' }));
  const laptop = edit(baseState(), '2026-10-21T10:00:00.000Z', (s) => (s.lessonDone.mo2 = '2026-10-21'));
  const merged = mergeStates(null, laptop, phone);
  assert.deepEqual(merged.problems.map((p) => p.id).sort(), ['p1', 'p2', 'p3']);
  assert.equal(merged.lessonDone.mo2, '2026-10-21');
});

test('merging is stable: syncing again with nothing new changes nothing', () => {
  const base = baseState();
  const laptop = edit(base, '2026-10-21T10:00:00.000Z', (s) => (s.lessonDone.mo2 = '2026-10-21'));
  const merged = normalise(mergeStates(base, laptop, base));
  assert.ok(same(normalise(mergeStates(merged, merged, merged)), merged));
});

test('only the parts of the state that changed are stamped as edited', () => {
  const s = baseState();
  const next = edit(s, '2026-10-22T10:00:00.000Z', (x) => (x.checks.a = '2026-10-22'));
  assert.equal(next.meta.edited.checks, '2026-10-22T10:00:00.000Z');
  assert.equal(next.meta.edited.problems, '2026-10-20T08:00:00.000Z');
  assert.equal(next.meta.edited.settings, undefined);
});
