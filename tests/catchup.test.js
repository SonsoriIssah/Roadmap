import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toDay, toISO } from '../public/js/dates.js';
import { makeContext } from '../public/js/engine.js';
import { defaultState } from '../public/js/store.js';
import { progressSeries } from '../public/js/progress.js';
import { catchUp, catchUpPath } from '../public/js/catchup.js';

const d = toDay;

const state = (problems = 10) => {
  const s = defaultState();
  s.settings.planStart = '2026-10-05';
  s.meta.freshStartAt = '2026-10-23';
  s.problems = Array.from({ length: problems }, (_, i) => ({ id: `p${i}`, title: `P${i}`, status: 'new', stage: 'new' }));
  return s;
};
const run = (s, today) => {
  const ctx = makeContext(s);
  const p = progressSeries(s, ctx, today);
  return { p, c: catchUp(p, s, ctx, today) };
};

test('the catch-up line does half as much again as the plan until it meets it', () => {
  const plan = [0, 2, 4, 6, 8, 10, 12];
  const path = catchUpPath(plan, [0, 0, 1, null, null, null, null], 2, 12);
  assert.deepEqual(path.values, [null, null, 1, 4, 7, 10, null]);
  assert.equal(path.rejoin, 5);
  assert.equal(plan[path.rejoin], path.values[path.rejoin]);
});

test('ahead of the plan, the line keeps the plan pace and needs no catching up', () => {
  const path = catchUpPath([0, 2, 4, 6], [0, 5, null, null], 1, 6);
  assert.ok(path.ahead);
  assert.equal(path.rejoin, 1);
  assert.deepEqual(path.values, [null, 5, 6, 6]);
});

test('a catch-up line never rejoins when the plan stops rising, as in exam weeks', () => {
  const path = catchUpPath([0, 2, 4, 4, 4], [0, 0, 0, null, null], 2, 4);
  assert.equal(path.rejoin, null);
  assert.deepEqual(path.values, [null, null, 0, 0, 0]);
});

test('behind the plan: the overall line rejoins on a date, and suggestions name what to do', () => {
  const today = d('2026-11-20');
  const { p, c } = run(state(), today);
  const t = today - p.start;
  assert.ok(c.behind);
  assert.equal(c.path[t], p.overall.you[t]);
  assert.equal(c.path[t - 1], null);
  assert.ok(c.rejoin > today && c.rejoin <= p.end);
  assert.equal(c.path[c.rejoin - p.start], p.overall.plan[c.rejoin - p.start]);
  assert.equal(c.path[c.rejoin - p.start + 1], null);

  const ids = c.suggestions.map((x) => x.id);
  assert.ok(ids.includes('leetcode'));
  assert.ok(c.suggestions.length <= 4);
  const lc = c.suggestions.find((x) => x.id === 'leetcode');
  assert.match(lc.title, /^Start \d+ extra problems? a week$/);
  assert.match(lc.detail, /behind the plan/);
  // Most useful first: the larger gaps lead.
  for (let i = 1; i < c.suggestions.length; i++) assert.ok(c.suggestions[i - 1].score >= c.suggestions[i].score);
});

test('a review backlog comes before new problems', () => {
  const s = state();
  for (let i = 0; i < 8; i++) Object.assign(s.problems[i], { status: 'solved', stage: 'solved', firstAt: '2026-10-25', lastAt: '2026-10-25', nextReview: '2026-11-01' });
  const { c } = run(s, d('2026-11-20'));
  assert.equal(c.suggestions[0].id, 'reviews');
  assert.match(c.suggestions[0].title, /^Clear 8 overdue reviews first$/);
});

test('no problem bank: import it before anything else LeetCode-related', () => {
  const { c } = run(state(0), d('2026-11-20'));
  assert.ok(c.suggestions.some((x) => x.id === 'import'));
  assert.ok(!c.suggestions.some((x) => x.id === 'leetcode' || x.id === 'daily'));
});

test('too far behind to catch up by the target: start fresh or move the target', () => {
  const s = state();
  s.settings.targetEnd = '2026-12-31';
  const { c } = run(s, d('2026-12-20'));
  assert.equal(c.suggestions[0].id, 'respread');
  assert.equal(c.suggestions[0].action.route, 'settings');
});

test('exams within three weeks: count the study days left before them', () => {
  const { c } = run(state(), d('2026-11-30'));
  const exam = c.suggestions.find((x) => x.id === 'exams');
  assert.ok(exam);
  assert.match(exam.title, /^\d+ study days? before mid-semester examinations$/);
});

test('on plan: nothing to catch up, and no catch-up line', () => {
  const s = state();
  const today = d('2026-10-23');
  const ctx = makeContext(s);
  const p = progressSeries(s, ctx, today);
  // Everything planned by today counts as done.
  for (const k of ['leetcode', 'learn', 'roadmap']) p[k].you = p[k].plan.map((v, i) => (i <= today - p.start ? v : null));
  const c = catchUp(p, s, ctx, today);
  assert.ok(!c.behind);
  assert.ok(c.path.every((v) => v === null));
  assert.equal(toISO(c.rejoin), '2026-10-23');
  assert.deepEqual(c.suggestions.map((x) => x.id), ['onplan']);
});
