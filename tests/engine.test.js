import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toDay, toISO, weekStart, weekdayIndex, fmtRange, localToday } from '../public/js/dates.js';
import {
  makeContext, resolveDay, weekInfo, forecast, currentModule, classesOn, dateConflicts, activeRituals,
  upcoming, relatedCourses, decisionHints, moduleRemaining,
} from '../public/js/engine.js';
import { defaultState, normalise, importJSON, exportJSON, createStore } from '../public/js/store.js';
import { parseTimetableText, timetableToText, parseCalendarText, calendarToText } from '../public/js/parse.js';
import { DEFAULT_MODULES } from '../public/js/data/defaults.js';

const d = toDay;
const ctxOf = (mutate) => {
  const s = defaultState();
  if (mutate) mutate(s);
  return { state: s, ctx: makeContext(s) };
};

test('dates: day numbers round-trip and weekdays are Monday-based', () => {
  assert.equal(toISO(d('2026-10-19')), '2026-10-19');
  assert.equal(weekdayIndex(d('2026-10-19')), 0); // Monday
  assert.equal(weekdayIndex(d('2026-10-06')), 1); // Tuesday
  assert.equal(weekdayIndex(d('2026-10-25')), 6); // Sunday
  assert.equal(toISO(weekStart(d('2026-10-25'))), '2026-10-19');
  assert.equal(fmtRange(d('2026-12-28'), d('2027-01-03')), '28 Dec – 3 Jan');
  assert.equal(localToday(new Date(2026, 9, 6, 23, 59)), d('2026-10-06'));
  assert.throws(() => toDay('2026-02-30'));
});

test('modes follow the KNUST calendar', () => {
  const { ctx } = ctxOf();
  assert.equal(resolveDay(d('2026-10-07'), ctx).mode, 'break'); // free time before the semester
  assert.equal(resolveDay(d('2026-10-21'), ctx).mode, 'normal'); // teaching
  assert.equal(resolveDay(d('2026-12-15'), ctx).mode, 'exam'); // mid-sem
  assert.equal(resolveDay(d('2026-12-25'), ctx).mode, 'break'); // Christmas beats teaching
  assert.equal(resolveDay(d('2027-02-01'), ctx).mode, 'exam'); // finals
  assert.equal(resolveDay(d('2027-03-01'), ctx).mode, 'break'); // inter-semester
  assert.equal(resolveDay(d('2027-06-10'), ctx).mode, 'exam');
});

test('the week before exams is heavy, and the rule can be switched off', () => {
  const { ctx } = ctxOf();
  const r = resolveDay(d('2027-01-20'), ctx);
  assert.equal(r.mode, 'heavy');
  assert.equal(r.source, 'preExam');
  assert.equal(r.exam.id, 'c-exam1');
  const off = ctxOf((s) => (s.settings.preExamDays = 0)).ctx;
  assert.equal(resolveDay(d('2027-01-20'), off).mode, 'normal');
});

test('a manual week override wins over the calendar', () => {
  const { ctx } = ctxOf((s) => (s.weekOverrides['2026-10-26'] = 'heavy'));
  assert.equal(resolveDay(d('2026-10-28'), ctx).mode, 'heavy');
  assert.equal(resolveDay(d('2026-10-28'), ctx).source, 'override');
  assert.equal(resolveDay(d('2026-11-04'), ctx).mode, 'normal');
});

test('weekInfo handles a week split between exams and a break', () => {
  const { ctx } = ctxOf();
  const info = weekInfo(d('2026-12-14'), ctx);
  assert.equal(info.counts.exam, 5);
  assert.equal(info.counts.break, 2);
  assert.equal(info.dominant, 'exam');
  assert.ok(Math.abs(info.pace - (2 * 2) / 7) < 1e-9);
});

test('classes only appear on teaching days within the timetable range', () => {
  const { ctx } = ctxOf();
  const mon = classesOn(d('2026-10-19'), ctx);
  assert.deepEqual(mon.map((c) => c.code), ['CSM 273', 'CSM 251', 'ENGL 263']);
  assert.equal(classesOn(d('2026-12-14'), ctx).length, 0); // mid-sem week: no lectures
  assert.equal(classesOn(d('2026-12-21'), ctx).length, 0); // Christmas
  assert.equal(classesOn(d('2026-10-12'), ctx).length, 0); // before teaching starts
});

test('forecast schedules every module and respects exam weeks', () => {
  const { state, ctx } = ctxOf();
  const today = d('2026-10-06');
  const fc = forecast(state.modules, state.progress, today, ctx);
  assert.equal(fc.unscheduled.length, 0);
  assert.ok(fc.finish > today);
  // Nothing starts during first-semester finals.
  for (const id of Object.keys(fc.byId)) {
    const r = fc.byId[id];
    assert.ok(!(r.start >= d('2027-01-25') && r.start <= d('2027-02-12')), `${id} starts during exams`);
  }
  // Modules are scheduled in order.
  const starts = state.modules.map((m) => fc.byId[m.id].start);
  assert.deepEqual([...starts].sort((a, b) => a - b), starts);
});

test('forecast moves when progress or the calendar changes', () => {
  const { state, ctx } = ctxOf();
  const today = d('2026-10-06');
  const base = forecast(state.modules, state.progress, today, ctx).finish;

  const ahead = { W1: { status: 'done' }, W2: { status: 'done' }, W3: { tasks: { objective: true } } };
  assert.ok(forecast(state.modules, ahead, today, ctx).finish < base);
  assert.equal(moduleRemaining(state.modules[2], ahead), 0.5);
  assert.equal(currentModule(state.modules, ahead).id, 'W3');

  const longer = ctxOf((s) => {
    s.calendar.find((e) => e.id === 'c-inter').end = '2027-02-20';
    s.calendar.find((e) => e.id === 'c-teach2').start = '2027-02-21';
  }).ctx;
  assert.notEqual(forecast(state.modules, state.progress, today, longer).finish, base);

  const allOff = ctxOf((s) => (s.settings.pace = { normal: 0, heavy: 0, exam: 0, break: 0, off: 0 })).ctx;
  const stuck = forecast(state.modules, state.progress, today, allOff, { horizonWeeks: 10 });
  assert.equal(stuck.finish, null);
  assert.equal(stuck.unscheduled.length, state.modules.length);
});

test('internship dates are checked against exams', () => {
  const { ctx } = ctxOf();
  const c = dateConflicts('2027-06-01', '2027-08-15', ctx);
  const exam = c.find((x) => x.event.id === 'c-exam2');
  assert.ok(exam);
  assert.equal(exam.severity, 'critical');
  assert.equal(exam.overlapDays, 19);
  assert.deepEqual(dateConflicts('2027-07-01', '2027-08-15', ctx), []);
});

test('rituals trigger from the calendar and applications', () => {
  const { state, ctx } = ctxOf((s) => {
    s.applications.push({ id: 'a1', company: 'Bloomberg', status: 'interview', interviewDate: '2026-11-10' });
  });
  const types = (day) => activeRituals(d(day), ctx, state).map((r) => r.type);
  assert.ok(types('2027-01-27').includes('exam'));
  assert.ok(types('2027-01-20').includes('preExam'));
  assert.ok(types('2027-02-16').includes('semesterEnd'));
  assert.ok(types('2026-11-01').includes('interview'));
  assert.ok(types('2026-10-28').includes('monthEnd'));
  assert.ok(types('2026-10-24').includes('weekly')); // Saturday, no scorecard yet
  assert.ok(!types('2027-01-28').includes('monthEnd')); // reviews wait while exams run

  state.scorecards['2026-10-19'] = { dsa: 2 };
  state.dismissed['exam:c-exam1'] = true;
  assert.ok(!types('2026-10-24').includes('weekly'));
  assert.ok(!types('2027-01-27').includes('exam'));
});

test('missing timetable for a teaching period is flagged', () => {
  const { state, ctx } = ctxOf();
  assert.ok(activeRituals(d('2027-03-16'), ctx, state).some((r) => r.type === 'noTimetable'));
  assert.ok(!activeRituals(d('2026-10-20'), ctx, state).some((r) => r.type === 'noTimetable'));
});

test('upcoming lists deadlines, exams and overdue actions', () => {
  const { state, ctx } = ctxOf((s) => {
    s.applications.push({ id: 'a1', company: 'Google', role: 'STEP', status: 'researching', deadline: '2026-10-20', nextAction: 'Ask for referral', nextActionDate: '2026-10-01' });
  });
  const items = upcoming(d('2026-10-06'), ctx, state, 30);
  const labels = items.map((i) => i.label);
  assert.ok(labels.some((l) => l.includes('Google · STEP: application deadline')));
  const reg = items.find((i) => i.label.startsWith('Online course registration'));
  assert.ok(reg.label.endsWith('opens') && reg.endDay === d('2026-10-29'));
  assert.ok(upcoming(d('2026-10-20'), ctx, state, 30).some((i) => i.label === 'Online course registration (continuing students) closes'));
  const overdue = items.find((i) => i.overdue);
  assert.ok(overdue && overdue.day === d('2026-10-06'));
});

test('modules link to related courses in the timetable', () => {
  const { ctx } = ctxOf();
  const sql = DEFAULT_MODULES.find((m) => m.id === 'W8');
  assert.deepEqual(relatedCourses(sql, ctx, d('2026-11-10')).map((c) => c.code), ['CSM 297']);
  const java = DEFAULT_MODULES.find((m) => m.id === 'W23');
  assert.deepEqual(relatedCourses(java, ctx, d('2026-11-10')).map((c) => c.code), ['CSM 281']);
});

test('decision hints read the last two scorecards', () => {
  const cards = { '2026-10-12': { dsa: 1, academic: 1 }, '2026-10-19': { dsa: 0, academic: 0 } };
  const rules = decisionHints(cards, d('2026-10-21')).map((h) => h.rule);
  assert.ok(rules.includes(5));
  assert.ok(rules.includes(0));
  assert.deepEqual(decisionHints({}, d('2026-10-21')), []);
});

test('timetable text round-trips and reports bad lines', () => {
  const s = defaultState();
  const text = timetableToText(s.timetables[0].sessions);
  const { sessions, errors } = parseTimetableText(text);
  assert.equal(errors.length, 0);
  assert.equal(sessions.length, s.timetables[0].sessions.length);
  assert.deepEqual(
    sessions.map(({ id, ...rest }) => rest),
    s.timetables[0].sessions.map(({ id, ...rest }) => ({ ...rest })),
  );
  const bad = parseTimetableText('Funday | 08:00-09:00 | X\nMon | 9:00-8:00 | Y\nTue | 8.00 – 9.30 | CSM 1');
  assert.equal(bad.errors.length, 2);
  assert.equal(bad.sessions[0].start, '08:00');
  assert.equal(bad.sessions[0].end, '09:30');
});

test('calendar text round-trips and accepts kind aliases', () => {
  const s = defaultState();
  const { events, errors } = parseCalendarText(calendarToText(s.calendar));
  assert.equal(errors.length, 0);
  assert.equal(events.length, s.calendar.length);
  const r = parseCalendarText('2027-01-25 | 2027-02-12 | finals | Exams\n2027-01-01 | 2026-12-01 | break | Bad');
  assert.equal(r.events[0].kind, 'exam');
  assert.equal(r.errors.length, 1);
});

test('normalise repairs partial or hostile input', () => {
  const s = normalise({ version: 2, settings: { pace: { normal: 'x', break: 3 }, defaultMode: 'party', daily: { normal: { problems: 'lots', learn: 45 } } }, weekOverrides: { a: 'heavy', b: 'nope' }, modules: [] });
  assert.equal(s.settings.daily.normal.problems, 2);
  assert.equal(s.settings.daily.normal.learn, 45);
  assert.equal(s.settings.daily.exam.rotate, 3);
  assert.equal(s.settings.pace.normal, 1);
  assert.equal(s.settings.pace.break, 3);
  assert.equal(s.settings.defaultMode, 'normal');
  assert.deepEqual(s.weekOverrides, { a: 'heavy' });
  assert.equal(s.modules.length, DEFAULT_MODULES.length);
  assert.deepEqual(normalise(null).calendar, defaultState().calendar);
});

test('export/import round-trips and rejects other files', () => {
  const s = defaultState();
  s.applications.push({ id: 'x', company: 'Stripe' });
  const back = importJSON(exportJSON(s));
  assert.equal(back.applications[0].company, 'Stripe');
  assert.throws(() => importJSON('not json'), /not valid JSON/);
  assert.throws(() => importJSON('{"hello":1}'), /does not contain/);
});

test('store persists updates and survives broken storage', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const store = createStore(storage);
  store.update((s) => {
    s.progress.W1 = { status: 'done' };
  });
  assert.equal(createStore(storage).get().progress.W1.status, 'done');

  const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
  const b = createStore(broken);
  assert.equal(b.persisted, false);
  b.update((s) => {
    s.notes.x = 'still works in memory';
  });
  assert.equal(b.get().notes.x, 'still works in memory');
});
