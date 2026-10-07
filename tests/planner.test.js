import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { toDay, toISO } from '../public/js/dates.js';
import { makeContext, forecast, currentModule } from '../public/js/engine.js';
import { defaultState, normalise, migrate } from '../public/js/store.js';
import { readXlsx, parseCSV, decodeEntities } from '../public/js/xlsx.js';
import {
  detectTable, candidateSheets, rowsToProblems, mergeProblems, orderNew, mapStatus, mapDate, mapPriority,
  applyFirstAttempt, applyRevisit, dueProblems, problemsToCSV, slugify,
} from '../public/js/problems.js';
import { parseChapters, importChapters, videoLink, lessonsToText, parseLessonsText, lessonMinutes, fmtTimestamp } from '../public/js/learn.js';
import { planDays, historyDay, semesterCourses } from '../public/js/planner.js';

const d = toDay;
let n = 0;
const makeId = () => `t${++n}`;

const sampleProblems = () => {
  const rows = [
    ['Contains Duplicate', 'Hash map lookup', 'P0', 'Easy', 'Not Started'],
    ['Two Sum', 'Hash map lookup', 'P0', 'Easy', 'Not Started'],
    ['Valid Anagram', 'Frequency counting', 'P0', 'Easy', 'Not Started'],
    ['Valid Palindrome', 'Two pointers', 'P0', 'Easy', 'Not Started'],
    ['3Sum', 'Two pointers', 'P1', 'Medium', 'Not Started'],
    ['Group Anagrams', 'Frequency counting', 'P0', 'Medium', 'Not Started'],
    ['Longest Substring Without Repeating Characters', 'Sliding window', 'P0', 'Medium', 'Not Started'],
    ['Word Ladder', 'Graph BFS', 'P2', 'Hard', 'Not Started'],
    ['Top K Frequent Elements', 'Frequency counting', 'P0', 'Medium', 'Not Started'],
    ['Container With Most Water', 'Two pointers', 'P0', 'Medium', 'Not Started'],
  ];
  const sheet = { name: 'DSA Problems', rows: [['Problem', 'Pattern', 'Priority', 'Difficulty', 'Status'], ...rows], links: {} };
  return mergeProblems([], rowsToProblems(sheet, detectTable(sheet.rows)), { today: d('2026-10-07'), makeId }).problems;
};

const setup = (mutate) => {
  const s = defaultState();
  s.problems = sampleProblems();
  if (mutate) mutate(s);
  const ctx = makeContext(s);
  return { s, ctx };
};

const plan = (s, ctx, today, from = today, count = 1, opts = {}) => {
  const fc = forecast(s.modules, s.progress, today, ctx);
  return planDays(from, count, s, ctx, today, { fc, current: currentModule(s.modules, s.progress), ...opts });
};

const types = (day) => day.items.map((i) => i.type);

// ---------------------------------------------------------------------------
// Spreadsheet import
// ---------------------------------------------------------------------------

test('reads an .xlsx laid out like your trackers, including hyperlinks', async () => {
  const sheets = await readXlsx(readFileSync(new URL('./fixtures/trackers.xlsx', import.meta.url)));
  assert.deepEqual(sheets.map((s) => s.name), ['Dashboard', 'DSA Problems', 'Master Tracker', 'Next Problems']);

  const ranked = candidateSheets(sheets);
  assert.equal(ranked[0].sheet.name, 'DSA Problems');
  assert.ok(!ranked.some((c) => c.sheet.name === 'Dashboard'));
  assert.ok(ranked.findIndex((c) => c.sheet.name === 'Next Problems') > ranked.findIndex((c) => c.sheet.name === 'Master Tracker'));

  const probs = rowsToProblems(ranked[0].sheet, ranked[0].table);
  const by = Object.fromEntries(probs.map((p) => [p.title, p]));
  assert.equal(by['Contains Duplicate'].url, 'https://leetcode.com/problems/contains-duplicate/'); // =HYPERLINK formula
  assert.equal(by['Two Sum'].url, 'https://leetcode.com/problems/two-sum/'); // hyperlink cell
  assert.equal(by['Best Time to Buy and Sell Stock'].url, 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/'); // from LC #
  assert.equal(by['Contains Duplicate'].status, 'solved');
  assert.equal(by['Contains Duplicate'].nextReview, '2026-10-16'); // Excel date serial
  assert.equal(by['Best Time to Buy and Sell Stock'].status, 'attempted');
  assert.equal(by['3Sum'].priority, 1);
  assert.equal(by['Minimum Window Substring'].difficulty, 'Hard');
});

test('a problem column with no header is still found', async () => {
  const sheets = await readXlsx(readFileSync(new URL('./fixtures/trackers.xlsx', import.meta.url)));
  const master = sheets.find((s) => s.name === 'Master Tracker');
  const t = detectTable(master.rows);
  assert.equal(t.cols.title, 0);
  const probs = rowsToProblems(master, t);
  assert.deepEqual(probs.map((p) => p.title), ['Maximum Subarray', 'Product of Array Except Self', 'Encode and Decode Strings (Premium)']);
  assert.equal(probs[2].url, 'http://buttercola.blogspot.com/2015/09/leetcode-encode-and-decode-strings.html');
  assert.equal(probs[1].status, 'solved');
});

test('CSV import handles quotes, semicolons and missing links', () => {
  const rows = parseCSV('Category,Title,URL,Notes,Difficulty,Progress\nArray,Two Sum,https://leetcode.com/problems/two-sum/,"dict, enumerate",Easy,Done\nArray,"Chocolate Distribution Problem",,,Easy,Not Done\n');
  const t = detectTable(rows);
  const probs = rowsToProblems({ name: 'csv', rows, links: {} }, t);
  assert.equal(probs[0].status, 'solved');
  assert.equal(probs[0].notes, 'dict, enumerate');
  assert.equal(probs[1].status, 'new');
  assert.match(probs[1].url, /problemset\/\?search=Chocolate/);
  assert.deepEqual(parseCSV('a;b\n1;2'), [['a', 'b'], ['1', '2']]);
  assert.equal(decodeEntities('a &amp; b &#x2197;'), 'a & b ↗');
});

test('status, priority, date and slug mapping', () => {
  assert.equal(mapStatus('Not Started'), 'new');
  assert.equal(mapStatus('Hint Needed'), 'attempted');
  assert.equal(mapStatus('Reimplemented'), 'solved');
  assert.equal(mapStatus('Done'), 'solved');
  assert.equal(mapStatus('Not Done'), 'new');
  assert.equal(mapPriority('P2'), 2);
  assert.equal(mapPriority('High'), 0);
  assert.equal(mapDate('46311'), '2026-10-16');
  assert.equal(mapDate('2026-10-16T00:00:00'), '2026-10-16');
  assert.equal(mapDate('—'), null);
  assert.equal(slugify("Best Time to Buy and Sell Stock"), 'best-time-to-buy-and-sell-stock');
});

test('re-importing keeps progress made in the app', () => {
  const today = d('2026-10-07');
  const bank = sampleProblems();
  const two = bank.find((p) => p.title === 'Two Sum');
  Object.assign(two, applyFirstAttempt(two, 'alone', today));
  const sheet = { name: 's', rows: [['Problem', 'Status'], ['Two Sum', 'Not Started'], ['Brand New', 'Not Started']], links: {} };
  const { problems, added, updated } = mergeProblems(bank, rowsToProblems(sheet, detectTable(sheet.rows)), { today, makeId });
  assert.equal(added, 1);
  assert.equal(updated, 1);
  assert.equal(problems.find((p) => p.title === 'Two Sum').status, 'solved');
  assert.equal(problems.length, bank.length + 1);
  const replaced = mergeProblems(bank, rowsToProblems(sheet, detectTable(sheet.rows)), { today, makeId, replace: true });
  assert.equal(replaced.problems.length, 2);
});

test('the roadmap topic decides which problems come first', () => {
  const bank = sampleProblems();
  const twoPointers = orderNew(bank, ['two pointer']).map((p) => p.title);
  assert.deepEqual(twoPointers.slice(0, 3), ['Valid Palindrome', 'Container With Most Water', '3Sum']); // topic first, then P0 before P1
  assert.equal(twoPointers[twoPointers.length - 1], 'Word Ladder'); // P2 last
  const sheetOrder = orderNew(bank, ['two pointer'], 'sheet').map((p) => p.title);
  assert.equal(sheetOrder[0], 'Contains Duplicate');
});

test('outcomes schedule revisits; clean revisits retire a problem', () => {
  const today = d('2026-10-07');
  const p = { id: 'x', title: 'X', status: 'new' };
  const failed = applyFirstAttempt(p, 'failed', today);
  assert.equal(failed.status, 'attempted');
  assert.equal(failed.nextReview, '2026-10-08');
  assert.deepEqual(dueProblems([failed], today + 1).map((q) => q.id), ['x']);
  let q = applyFirstAttempt(p, 'alone', today);
  assert.equal(q.nextReview, '2026-10-14');
  q = applyRevisit(q, true, today + 7);
  assert.equal(q.interval, 18);
  q = applyRevisit(q, true, today + 25);
  q = applyRevisit(q, true, today + 70);
  assert.equal(q.nextReview, null);
  assert.ok(problemsToCSV([q]).includes('Solved'));
});

// ---------------------------------------------------------------------------
// Video chapters
// ---------------------------------------------------------------------------

test('YouTube chapter lists parse in common formats', () => {
  const ch = parseChapters('0:00 Intro\n1:13:00 - Creating Variables\n(1:40:30) Primitive Data Types\nnot a chapter\n2:15:00 – Arrays', 3 * 3600);
  assert.deepEqual(ch.map((c) => c.title), ['Intro', 'Creating Variables', 'Primitive Data Types', 'Arrays']);
  assert.equal(ch[1].start, 4380);
  assert.equal(ch[1].end, 6030);
  assert.equal(ch[3].end, 10800);
  assert.equal(fmtTimestamp(4380), '1:13:00');
  assert.equal(videoLink('https://www.youtube.com/watch?v=abc', 4380), 'https://www.youtube.com/watch?v=abc&t=4380s');
  assert.equal(videoLink('https://youtu.be/abc?t=10', 60), 'https://youtu.be/abc?t=60s');
});

test('importing chapters replaces the video placeholders and keeps practice tasks', () => {
  const s = defaultState();
  const java = s.tracks[0];
  const chapters = parseChapters('0:00 Installing JDK\n10:00 Creating Variables\n25:00 Primitive Data Types\n40:00 Arrays and Indexes\n55:00 Classes and Objects', 3600);
  const next = importChapters(java, chapters, { url: 'https://youtu.be/xyz', makeId });
  const videos = next.lessons.filter((l) => l.video);
  assert.equal(videos.length, 5);
  assert.ok(next.lessons.indexOf(videos[4]) < next.lessons.findIndex((l) => l.id === 'j9'));
  assert.match(videos.find((l) => l.title === 'Primitive Data Types').practice, /primitive type/);
  assert.match(videos.find((l) => l.title === 'Arrays and Indexes').practice, /Contains Duplicate/);
  assert.equal(next.lessons.filter((l) => l.id === 'j2').length, 0);
  assert.equal(next.url, 'https://youtu.be/xyz');
});

test('lesson text editing round-trips', () => {
  const lessons = [
    { id: 'a', title: 'Variables', start: 4380, end: 8100, video: true, practice: 'Declare variables' },
    { id: 'b', title: 'Generics', min: 40, practice: 'Write Pair<A,B>' },
  ];
  const { lessons: back, errors } = parseLessonsText(lessonsToText(lessons), makeId, lessons);
  assert.equal(errors.length, 0);
  assert.deepEqual(back.map((l) => [l.id, lessonMinutes(l), l.practice]), [['a', 72, 'Declare variables'], ['b', 40, 'Write Pair<A,B>']]); // 62 min video + 10 min practice
  assert.equal(parseLessonsText('X | 9:00-8:00', makeId).errors.length, 1);
});

// ---------------------------------------------------------------------------
// Daily plans
// ---------------------------------------------------------------------------

test('a free day before the semester is full: Java, four problems, four first-week tasks', () => {
  const { s, ctx } = setup();
  const [day] = plan(s, ctx, d('2026-10-07')).days;
  assert.equal(day.mode, 'break');
  assert.equal(day.items.filter((i) => i.type === 'problem').length, 4);
  assert.equal(day.items.filter((i) => i.type === 'kickoff').length, 4);
  assert.ok(day.items.some((i) => i.type === 'lesson' && i.title.startsWith('Java')));
  assert.ok(!day.items.some((i) => i.type === 'revise')); // no lectures yet
  assert.equal(types(day)[0], 'lesson'); // learning first, like your example
  // The first week's tasks are finished in two days, not seven.
  const days = plan(s, ctx, d('2026-10-07'), d('2026-10-07'), 3).days;
  assert.equal(days[1].items.filter((i) => i.type === 'kickoff').length, 3);
  assert.equal(days[2].items.filter((i) => i.type === 'kickoff').length, 0);
});

test('lecture days list a revision item per course, with more Java on CSM 281 days', () => {
  const { s, ctx } = setup();
  const days = plan(s, ctx, d('2026-10-19'), d('2026-10-21'), 2).days; // Wed, Thu
  const [wed, thu] = days;
  const revise = (day) => day.items.filter((i) => i.type === 'revise').map((i) => i.title.split(' · ')[0]);
  assert.deepEqual(revise(wed), ['Revise CS-SEMINAR', 'Revise CSM 265']);
  assert.deepEqual(revise(thu), ['Revise CSM 255', 'Revise CSM 281', 'Revise CSM 297']);
  assert.match(thu.items.find((i) => i.title.startsWith('Revise CSM 281')).desc, /in code/);
  const javaMin = (day) => day.items.filter((i) => i.type === 'lesson').reduce((a, i) => a + i.min, 0);
  assert.ok(javaMin(thu) > javaMin(wed), `Thursday ${javaMin(thu)} should exceed Wednesday ${javaMin(wed)}`);
  assert.equal(thu.items.filter((i) => i.type === 'problem').length, 2);
});

test('weekends rotate through courses; exams rotate three a day with no new problems', () => {
  const { s, ctx } = setup();
  const sat = plan(s, ctx, d('2026-10-24')).days[0];
  assert.equal(sat.items.filter((i) => i.type === 'revise').length, 2);
  assert.ok(sat.items.some((i) => i.title === 'Check new openings and deadlines'));
  const exam = plan(s, ctx, d('2027-01-27')).days[0];
  assert.equal(exam.mode, 'exam');
  assert.equal(exam.items.filter((i) => i.type === 'revise').length, 3);
  assert.equal(exam.items.filter((i) => i.type === 'problem').length, 0);
  assert.equal(exam.items.filter((i) => i.type === 'lesson').length, 0);
  // Exams use the semester timetable that just ended.
  assert.equal(semesterCourses(d('2027-01-27'), ctx, { lookback: true }).length, 9);
  // An "off" week is empty.
  const off = setup((st) => (st.weekOverrides['2026-10-19'] = 'off'));
  assert.equal(plan(off.s, off.ctx, d('2026-10-20')).days[0].items.length, 0);
});

test('Java finishes inside its weeks, and adjusting the weeks moves the finish', () => {
  const { s, ctx } = setup();
  const today = d('2026-10-07');
  const three = plan(s, ctx, today, today, 1, { horizon: 120 }).trackFinish.java;
  assert.ok(three <= d('2026-10-27'), `3 weeks finished ${toISO(three)}`);
  s.tracks[0].weeks = 2;
  const two = plan(s, ctx, today, today, 1, { horizon: 120 }).trackFinish.java;
  assert.ok(two <= d('2026-10-20'), `2 weeks finished ${toISO(two)}`);
  assert.ok(two < three);
  // Every lesson is scheduled exactly once.
  const days = plan(s, ctx, today, today, 30).days;
  const ids = days.flatMap((x) => x.items.filter((i) => i.type === 'lesson').flatMap((i) => i.lessonIds));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, s.tracks[0].lessons.length);
});

test('missing days spreads the remaining Java over the days left', () => {
  const { s, ctx } = setup();
  const late = d('2026-10-14'); // a week in, nothing done
  const fin = plan(s, ctx, late, late, 1, { horizon: 120 }).trackFinish.java;
  assert.ok(fin <= d('2026-10-27'), `finished ${toISO(fin)}`);
  const onTime = plan(s, ctx, d('2026-10-07')).days[0].items.filter((i) => i.type === 'lesson').reduce((a, i) => a + i.min, 0);
  const catchUp = plan(s, ctx, late).days[0].items.filter((i) => i.type === 'lesson').reduce((a, i) => a + i.min, 0);
  assert.ok(catchUp > onTime);
});

test("ticked items stay on today's list and tomorrow continues from there", () => {
  const today = d('2026-10-07');
  const { s, ctx } = setup();
  const first = plan(s, ctx, today).days[0];
  const lesson = first.items.find((i) => i.type === 'lesson');
  const prob = first.items.find((i) => i.type === 'problem');
  lesson.lessonIds.forEach((id) => (s.lessonDone[id] = toISO(today)));
  const p = s.problems.find((x) => x.id === prob.problemId);
  Object.assign(p, applyFirstAttempt(p, 'alone', today));
  s.checks['kickoff:k1'] = toISO(today);

  const again = plan(s, ctx, today, today, 2).days;
  const t = again[0];
  assert.ok(t.items.find((i) => i.key === lesson.key).done);
  assert.ok(t.items.find((i) => i.key === `problem:${prob.problemId}`).done);
  assert.ok(t.items.find((i) => i.key === 'kickoff:k1').done);
  assert.equal(t.items.filter((i) => i.type === 'problem').length, 4); // list doesn't grow or shrink
  const tomorrowLessons = again[1].items.filter((i) => i.type === 'lesson').flatMap((i) => i.lessonIds);
  assert.ok(!tomorrowLessons.some((id) => lesson.lessonIds.includes(id)));

  const past = historyDay(today, s, ctx);
  assert.ok(past.items.some((i) => i.key === lesson.key));
  assert.ok(past.items.some((i) => i.type === 'problem'));
});

test('revisits appear when due, capped per day, overflow rolls forward', () => {
  const today = d('2026-10-20'); // normal day: 2 revisits max
  const { s, ctx } = setup((st) => {
    for (const p of st.problems.slice(0, 3)) Object.assign(p, applyFirstAttempt(p, 'failed', today - 3));
  });
  const [t, tm] = plan(s, ctx, today, today, 2).days;
  assert.equal(t.items.filter((i) => i.type === 'revisit').length, 2);
  assert.equal(tm.items.filter((i) => i.type === 'revisit').length, 1);
});

test('the roadmap module step and application actions are on the list', () => {
  const today = d('2026-10-07');
  const { s, ctx } = setup((st) => {
    st.applications.push({ id: 'a1', company: 'Bloomberg', status: 'applied', nextAction: 'Email alumni for a referral', nextActionDate: '2026-10-05' });
  });
  const items = plan(s, ctx, today).days[0].items;
  const mod = items.find((i) => i.type === 'module');
  assert.equal(mod.moduleId, 'W1');
  assert.equal(mod.task, 'objective');
  const app = items.find((i) => i.type === 'career');
  assert.match(app.meta, /overdue/);
});

test('version-1 saves upgrade without losing data', () => {
  const old = {
    version: 1,
    settings: { theme: 'dark', studyStart: '06:00' },
    calendar: defaultState().calendar.filter((e) => e.id !== 'c-pre'),
    modules: defaultState().modules.map(({ patterns, ...m }) => m),
    dsaLog: [{ id: 'x', title: 'Two Sum', pattern: 'Arrays & hashing', independent: true, date: '2026-10-06', nextReview: '2026-10-13', interval: 7 }],
    progress: { W1: { status: 'done' } },
  };
  const s = normalise(old);
  assert.equal(s.version, 3);
  assert.equal(s.settings.theme, 'dark');
  assert.equal(s.settings.studyStart, undefined);
  assert.ok(s.calendar.some((e) => e.id === 'c-pre'));
  assert.deepEqual(s.modules.find((m) => m.id === 'W5').patterns, ['two pointer']);
  assert.equal(s.problems[0].title, 'Two Sum');
  assert.equal(s.problems[0].status, 'solved');
  assert.equal(s.tracks[0].id, 'java');
  assert.equal(s.progress.W1.status, 'done');
  assert.equal(migrate({ version: 2, a: 1 }).a, 1);
});

// ---------------------------------------------------------------------------
// Mosh Java course
// ---------------------------------------------------------------------------

test('a pasted YouTube transcript yields its chapter titles and times', () => {
  const transcript = [
    'Introduction', '0:00', 'hello and welcome to the course', '0:07', 'we start by installing tools',
    'Installing Java', '1:48', 'search for jdk download', '1:53', 'jdk is short for java development kit',
    'Variables', '26:02', 'we use variables to store data', '26:11', 'int age equals thirty',
  ].join('\n');
  const ch = parseChapters(transcript);
  assert.deepEqual(ch.map((c) => [c.title, c.start]), [['Introduction', 0], ['Installing Java', 108], ['Variables', 1562]]);
  assert.equal(ch[1].end, 1562);
  assert.equal(ch[2].end, 26 * 60 + 11 + 15); // last caption + 15 s
});

test("Java lessons are Mosh's chapters with exact timestamps and links", () => {
  const { s, ctx } = setup();
  const java = s.tracks[0];
  assert.equal(java.lessons.filter((l) => l.video).length, 42);
  const first = plan(s, ctx, d('2026-10-07')).days[0].items.find((i) => i.type === 'lesson');
  assert.match(first.action, /^Watch Mosh 0:00 → \d+:\d{2}/);
  assert.equal(first.url, 'https://www.youtube.com/watch?v=eIrMbAQSU34');
  assert.ok(first.practice.length >= 1);
  // A project chapter ends that day's watch range, so you build it before the solution.
  const days = plan(s, ctx, d('2026-10-07'), d('2026-10-07'), 21).days;
  const lessonItems = days.flatMap((x) => x.items.filter((i) => i.type === 'lesson'));
  const withProject = lessonItems.find((i) => i.lessonIds.includes('mo24'));
  assert.equal(withProject.lessonIds[withProject.lessonIds.length - 1], 'mo24');
  assert.match(withProject.action, /→ 1:32:58$/);
  // All 42 chapters, then the OOP / collections lessons, inside three weeks.
  const fin = plan(s, ctx, d('2026-10-07'), d('2026-10-07'), 1, { horizon: 120 }).trackFinish.java;
  assert.ok(fin <= d('2026-10-27'), `finished ${toISO(fin)}`);
});

test('saves with the old Java placeholders switch to Mosh and keep ticks', () => {
  const placeholders = [
    { id: 'j1', title: 'Install JDK', min: 30, video: true },
    { id: 'j2', title: 'Variables', min: 40, video: true },
    { id: 'j7', title: 'Input and methods', min: 40, video: true },
    { id: 'j8', title: 'Classes and objects', min: 45, video: true },
    { id: 'j9', title: 'Encapsulation', min: 40 },
  ];
  const v2 = { version: 2, tracks: [{ id: 'java', name: 'Java', start: '2026-10-07', weeks: 2, resource: 'Amigoscode Java course', url: '', lessons: placeholders }], lessonDone: { j1: '2026-10-07' } };
  const s = normalise(v2);
  const java = s.tracks[0];
  assert.equal(java.weeks, 2);
  assert.equal(java.url, 'https://www.youtube.com/watch?v=eIrMbAQSU34');
  assert.deepEqual(java.lessons.slice(-3).map((l) => l.id), ['j7', 'j8', 'j9']);
  assert.equal(java.lessons.filter((l) => l.video).length, 42);
  for (const id of ['mo1', 'mo4', 'mo7']) assert.equal(s.lessonDone[id], '2026-10-07');
  assert.equal(s.lessonDone.mo8, undefined);
  // Pasted chapters are never overwritten.
  const pasted = normalise({ version: 2, tracks: [{ id: 'java', name: 'Java', lessons: [{ id: 'v1', title: 'Intro', start: 0, end: 60, video: true }] }] });
  assert.equal(pasted.tracks[0].lessons[0].id, 'v1');
});
