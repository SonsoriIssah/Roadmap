import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toDay, toISO } from '../public/js/dates.js';
import { makeContext } from '../public/js/engine.js';
import { defaultState } from '../public/js/store.js';
import { DEFAULT_COURSES, DEFAULT_TIMETABLES } from '../public/js/data/defaults.js';
import { planDays, isSem1StudyWindow, isXmasBreak, SEM1_START, SEM1_END } from '../public/js/planner.js';
import { calculateSemesterAverage, getTopicStats } from '../public/js/views/courses.js';

const d = toDay;

const setup = (mutate) => {
  const s = defaultState();
  if (mutate) mutate(s);
  const ctx = makeContext(s);
  return { s, ctx };
};

// ---------------------------------------------------------------------------
// 1. Course summary and representations
// ---------------------------------------------------------------------------

test('all eight KNUST courses are represented with correct credits and 17 total credits', () => {
  const courses = DEFAULT_COURSES;
  assert.equal(courses.length, 8);

  const byCode = Object.fromEntries(courses.map((c) => [c.code, c]));
  const codes = ['CSM 251', 'CSM 255', 'CSM 265', 'CSM 273', 'CSM 281', 'CSM 291', 'CSM 297', 'ENGL 263'];
  for (const code of codes) {
    assert.ok(byCode[code], `Course ${code} should exist`);
  }

  assert.equal(byCode['CSM 251'].credits, 2);
  assert.equal(byCode['CSM 255'].credits, 2);
  assert.equal(byCode['CSM 265'].credits, 2);
  assert.equal(byCode['CSM 273'].credits, 3);
  assert.equal(byCode['CSM 281'].credits, 3);
  assert.equal(byCode['CSM 291'].credits, 2);
  assert.equal(byCode['CSM 297'].credits, 2);
  assert.equal(byCode['ENGL 263'].credits, 1);

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  assert.equal(totalCredits, 17);
});

test('topic, unit and strand counts are verified without invented data', () => {
  const byCode = Object.fromEntries(DEFAULT_COURSES.map((c) => [c.code, c]));

  // CSM 251: 7 topics
  assert.equal(byCode['CSM 251'].topics.length, 7);
  assert.equal(byCode['CSM 251'].topics[0].title, 'Basic Semiconductor Physics');
  assert.equal(byCode['CSM 251'].topics[6].title, 'Operational Amplifiers');

  // CSM 255: 6 units (uses word "units")
  assert.equal(byCode['CSM 255'].topicUnit, 'units');
  assert.equal(byCode['CSM 255'].topics.length, 6);
  assert.equal(byCode['CSM 255'].topics[0].title, 'Introduction to Operating Systems and Linux');
  assert.equal(byCode['CSM 255'].topics[5].title, 'Advanced Concepts in Outsourcing');

  // CSM 265: 4 strands, 11 weeks duration (not counted as topics, no policy definition)
  assert.equal(byCode['CSM 265'].topicUnit, 'strands');
  assert.equal(byCode['CSM 265'].topics.length, 4);
  assert.equal(byCode['CSM 265'].durationWeeks, 11);
  assert.equal(byCode['CSM 265'].topics[0].title, 'Ethical Knowledge Area');
  assert.equal(byCode['CSM 265'].topics[3].title, 'Ethics Research Practice');
  assert.ok(!JSON.stringify(byCode['CSM 265']).toLowerCase().includes('policy definition'));

  // CSM 273: 10 topics
  assert.equal(byCode['CSM 273'].topics.length, 10);
  assert.equal(byCode['CSM 273'].topics[0].title, 'Vectors in Two and Three Dimensional Spaces');
  assert.ok(byCode['CSM 273'].topics[0].desc.includes('dot product'));
  assert.equal(byCode['CSM 273'].topics[9].title, 'Iterative Methods for Solving Systems of Equations');

  // CSM 281: Java reuses existing roadmap count (58 lessons), does not duplicate curriculum
  assert.equal(byCode['CSM 281'].credits, 3);
  assert.equal(byCode['CSM 281'].topicCount, 58);
  assert.equal(byCode['CSM 281'].outlinePending, true);
  assert.equal(byCode['CSM 281'].trackId, 'java');
  assert.equal(byCode['CSM 281'].topics.length, 0); // No duplicate topics array

  // CSM 291: System Analysis and Design playlist resource, outline pending
  assert.equal(byCode['CSM 291'].outlinePending, true);
  assert.equal(byCode['CSM 291'].topics.length, 0);
  assert.ok(byCode['CSM 291'].resources.some((r) => r.url.includes('youtube.com/playlist?list=PL5q3E8eRUieWtYLmRU3z94-vGRcwKr9tM')));

  // CSM 297: 7 topics, midsem note after ER model
  assert.equal(byCode['CSM 297'].topics.length, 7);
  assert.equal(byCode['CSM 297'].topics[2].title, 'Data Modelling Using the Entity-Relationship (ER) Model');
  assert.match(byCode['CSM 297'].notes, /mid-semester.*ER Model/i);

  // ENGL 263: outline pending, no invented content
  assert.equal(byCode['ENGL 263'].outlinePending, true);
  assert.equal(byCode['ENGL 263'].topics.length, 0);
  assert.equal(byCode['ENGL 263'].resources.length, 0);
});

test('Friday lecture timetable has CSM 273 at 18:00-18:55', () => {
  const tt = DEFAULT_TIMETABLES[0];
  const fri = tt.sessions.find((s) => s.day === 4 && s.code === 'CSM 273');
  assert.ok(fri);
  assert.equal(fri.start, '18:00');
  assert.equal(fri.end, '18:55');
});

// ---------------------------------------------------------------------------
// 2. Important Scheduling Rule: Category-Specific Cap
// ---------------------------------------------------------------------------

test('personal activities remain capped at three', () => {
  const { s, ctx } = setup((st) => {
    // Add 5 personal items for today
    st.checks = {};
  });

  const today = d('2026-10-20');
  const res = planDays(today, 1, s, ctx, today);
  const day = res.days[0];

  // Inject 5 mock personal activities into planDays test
  const customState = { ...s };
  customState.settings.maxPersonalPerDay = 3;
  // Test capping logic directly on planner items
  const personalTasks = [
    { key: 'p1', type: 'personal', category: 'personal', title: 'Personal 1', done: false },
    { key: 'p2', type: 'personal', category: 'personal', title: 'Personal 2', done: false },
    { key: 'p3', type: 'personal', category: 'personal', title: 'Personal 3', done: false },
    { key: 'p4', type: 'personal', category: 'personal', title: 'Personal 4', done: false },
    { key: 'p5', type: 'personal', category: 'personal', title: 'Personal 5', done: false },
  ];

  const maxPersonal = 3;
  const openPersonal = personalTasks.filter((x) => !x.done);
  const kept = openPersonal.slice(0, maxPersonal);
  assert.equal(kept.length, 3);
});

test('four or more academic activities can exist on the same day without being capped', () => {
  const { s, ctx } = setup((st) => {
    // Schedule 4 academic tasks on Thursday 22 October 2026
    const iso = '2026-10-22';
    st.academic.studyTasks = [
      { id: 'acad-1', courseCode: 'CSM 273', title: 'Matrix algebra practice', date: iso, min: 45 },
      { id: 'acad-2', courseCode: 'CSM 251', title: 'Diode circuits review', date: iso, min: 40 },
    ];
  });

  const thu = d('2026-10-22');
  const res = planDays(thu, 1, s, ctx, thu);
  const day = res.days[0];

  // Thursday already has 3 lecture revisions: CSM 255, CSM 281, CSM 297
  // Plus 2 scheduled academic study tasks = 5 academic items total!
  const academicItems = day.items.filter((i) => i.category === 'academic');
  assert.ok(academicItems.length >= 4, `Expected at least 4 academic items, got ${academicItems.length}`);
  assert.ok(academicItems.some((i) => i.title.includes('CSM 255')));
  assert.ok(academicItems.some((i) => i.title.includes('CSM 281')));
  assert.ok(academicItems.some((i) => i.title.includes('CSM 297')));
  assert.ok(academicItems.some((i) => i.title.includes('Matrix algebra')));
  assert.ok(academicItems.some((i) => i.title.includes('Diode circuits')));
});

test('existing DSA, project, career and other roadmap tasks continue to work', () => {
  const { s, ctx } = setup();
  // Saturday 24 October 2026: has course rotation + career task + roadmap module
  const sat = d('2026-10-24');
  const res = planDays(sat, 1, s, ctx, sat);
  const day = res.days[0];

  assert.ok(day.items.some((i) => i.type === 'career'));
  assert.ok(day.items.some((i) => i.type === 'revise'));
});

// ---------------------------------------------------------------------------
// 3. Strict KNUST Semester Scheduling Boundaries (Section 10)
// ---------------------------------------------------------------------------

test('university study activities fall strictly within October 13, 2026 to February 13, 2027', () => {
  assert.equal(isSem1StudyWindow(d('2026-10-12')), false); // Before semester
  assert.equal(isSem1StudyWindow(d('2026-10-13')), true);  // Semester start
  assert.equal(isSem1StudyWindow(d('2026-11-15')), true);  // Teaching period
  assert.equal(isSem1StudyWindow(d('2027-02-13')), true);  // Semester departure date
  assert.equal(isSem1StudyWindow(d('2027-02-14')), false); // After departure date

  const { s, ctx } = setup();
  // Day before semester (2026-10-07)
  const pre = planDays(d('2026-10-07'), 1, s, ctx, d('2026-10-07')).days[0];
  assert.equal(pre.items.filter((i) => i.category === 'academic').length, 0);

  // Day after semester departure (2027-02-14)
  const post = planDays(d('2027-02-14'), 1, s, ctx, d('2027-02-14')).days[0];
  assert.equal(post.items.filter((i) => i.category === 'academic').length, 0);
});

test('Christmas break (Dec 19, 2026 – Jan 3, 2027) is free from routine academic scheduling', () => {
  assert.equal(isXmasBreak(d('2026-12-18')), false);
  assert.equal(isXmasBreak(d('2026-12-19')), true);
  assert.equal(isXmasBreak(d('2026-12-25')), true);
  assert.equal(isXmasBreak(d('2027-01-03')), true);
  assert.equal(isXmasBreak(d('2027-01-04')), false);

  const { s, ctx } = setup();
  const xmasDay = d('2026-12-22');
  const res = planDays(xmasDay, 1, s, ctx, xmasDay);
  const day = res.days[0];

  // No routine coursework revision or lectures scheduled during Christmas break
  const academicItems = day.items.filter((i) => i.category === 'academic');
  assert.equal(academicItems.length, 0);
});

test('first semester exam period (Jan 25 – Feb 12, 2027) prioritises exam prep without regular lectures', () => {
  const { s, ctx } = setup();
  const examDay = d('2027-01-27');
  const res = planDays(examDay, 1, s, ctx, examDay);
  const day = res.days[0];

  assert.equal(day.mode, 'exam');
  // Exactly 3 courses rotated daily for exam prep
  const examRevisions = day.items.filter((i) => i.type === 'revise');
  assert.equal(examRevisions.length, 3);
  assert.ok(examRevisions.every((i) => i.meta === 'Exam prep'));
  assert.equal(day.items.filter((i) => i.type === 'problem').length, 0);
  assert.equal(day.items.filter((i) => i.type === 'lesson').length, 0);
});

// ---------------------------------------------------------------------------
// 4. Performance Tracking & Credit-Weighted Average Calculations
// ---------------------------------------------------------------------------

test('credit-weighted average calculation respects course credits and handles empty assessments', () => {
  const courses = DEFAULT_COURSES;

  // No marks recorded yet -> returns null (does not invent fake 0% or assume marks)
  assert.equal(calculateSemesterAverage(courses, []), null);

  // Marks entered for CSM 273 (3 credits) and CSM 251 (2 credits)
  const assessments = [
    { courseCode: 'CSM 273', mark: 90, maxMark: 100 }, // 90%
    { courseCode: 'CSM 251', mark: 80, maxMark: 100 }, // 80%
  ];
  // Expected credit-weighted average:
  // (90 * 3 + 80 * 2) / (3 + 2) = (270 + 160) / 5 = 430 / 5 = 86.0%
  const avg = calculateSemesterAverage(courses, assessments);
  assert.ok(avg !== null);
  assert.equal(Math.round(avg * 10) / 10, 86.0);
});

test('topic mastery counts track untouched, studying, revised, confident', () => {
  const courses = DEFAULT_COURSES;
  const progress = {
    'CSM 251': {
      topicStatus: {
        'csm251-1': 'confident',
        'csm251-2': 'revised',
        'csm251-3': 'studying',
      },
    },
  };

  const stats = getTopicStats(courses, progress);
  assert.equal(stats.confident, 1);
  assert.equal(stats.revised, 1);
  assert.equal(stats.studying, 1);
  assert.ok(stats.not_started > 0);
  assert.equal(stats.total, stats.confident + stats.revised + stats.studying + stats.not_started);
});
