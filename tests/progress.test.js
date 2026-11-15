import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toDay } from '../public/js/dates.js';
import { makeContext } from '../public/js/engine.js';
import { defaultState } from '../public/js/store.js';
import { progressSeries, progressStart, gapLabel } from '../public/js/progress.js';

const d = toDay;

const state = () => {
  const s = defaultState();
  s.settings.planStart = '2026-10-05';
  s.meta.freshStartAt = '2026-10-23';
  s.problems = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, title: `P${i}`, status: 'new', stage: 'new' }));
  return s;
};

test('charts start at the later of the plan start and the last fresh start, and end at the target', () => {
  const s = state();
  assert.equal(progressStart(s), d('2026-10-23'));
  const p = progressSeries(s, makeContext(s), d('2026-11-15'));
  assert.equal(p.days[0], d('2026-10-23'));
  assert.equal(p.days[p.days.length - 1], d('2027-07-31'));
});

test('the LeetCode plan reaches each goal on its date and stays flat in exam weeks', () => {
  const s = state();
  const p = progressSeries(s, makeContext(s), d('2026-11-15'));
  const at = (iso) => p.leetcode.plan[d(iso) - p.start];
  assert.equal(at('2027-04-30'), 80);
  assert.equal(at('2027-07-31'), 115);
  assert.equal(at('2027-01-25'), at('2027-02-12')); // first-semester exams: no new problems planned
  assert.ok(at('2026-11-15') < at('2026-12-13')); // rising on teaching days
});

test('your line counts problems started and lessons done by each day, and stops at today', () => {
  const s = state();
  s.dsaLog = [
    { kind: 'first', problemId: 'p0', date: '2026-10-31' },
    { kind: 'first', problemId: 'p1', date: '2026-11-03' },
    { kind: 'revisit', problemId: 'p0', date: '2026-11-03' }, // reviews don't add problems
  ];
  s.lessonDone = Object.fromEntries(['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'].map((id) => [id, '2026-10-23']));
  const today = d('2026-11-15');
  const p = progressSeries(s, makeContext(s), today);
  const at = (iso) => d(iso) - p.start;
  assert.equal(p.leetcode.you[at('2026-10-30')], 0);
  assert.equal(p.leetcode.you[at('2026-11-02')], 1);
  assert.equal(p.leetcode.you[at('2026-11-15')], 2);
  assert.equal(p.leetcode.you[at('2026-11-16')], null); // the future is the plan's alone
  assert.equal(p.leetcode.now, 2);
  assert.ok(p.overall.you[at('2026-10-23')] > 0); // the lessons count from that day
  assert.ok(p.overall.plan[at('2027-07-31')] === 100);
  assert.ok(p.overall.now < p.overall.planNow);
});

test('gap labels say behind, ahead or on plan', () => {
  assert.equal(gapLabel(6, 10), '4 behind');
  assert.equal(gapLabel(12, 10.2), '2 ahead');
  assert.equal(gapLabel(5.8, 13.9, ' points'), '8 points behind');
  assert.equal(gapLabel(10.2, 10), 'on plan');
});
