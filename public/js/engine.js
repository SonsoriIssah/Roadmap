// The planning engine: pure functions that turn your calendar, timetable and
// progress into modes, forecasts, alerts and date checks. Nothing here
// touches the DOM or storage, so it is covered by tests in /tests.

import { toDay, isISODate, weekStart, weekKey, weekdayIndex, toMin, isTime, lastDayOfMonth, monthKey } from './dates.js';
import { KINDS, MODES } from './data/defaults.js';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** Parse calendar events into day numbers, dropping invalid entries. */
export function parseCalendar(events = []) {
  const out = [];
  for (const e of events) {
    if (!e || !isISODate(e.start) || !isISODate(e.end) || !KINDS[e.kind]) continue;
    const s = toDay(e.start);
    const en = toDay(e.end);
    if (en < s) continue;
    out.push({ ...e, s, e: en });
  }
  return out.sort((a, b) => a.s - b.s || a.e - b.e);
}

export function parseTimetables(tts = []) {
  const out = [];
  for (const t of tts) {
    if (!t || !isISODate(t.from) || !isISODate(t.to)) continue;
    const sessions = (t.sessions || [])
      .filter((c) => c && Number.isInteger(c.day) && c.day >= 0 && c.day <= 6 && isTime(c.start) && isTime(c.end) && toMin(c.end) > toMin(c.start))
      .map((c) => ({ ...c, s: toMin(c.start), e: toMin(c.end) }))
      .sort((a, b) => a.day - b.day || a.s - b.s);
    out.push({ ...t, fromDay: toDay(t.from), toDay: toDay(t.to), sessions });
  }
  return out;
}

export function makeContext(state) {
  return {
    cal: parseCalendar(state.calendar),
    timetables: parseTimetables(state.timetables),
    settings: state.settings,
    overrides: state.weekOverrides || {},
  };
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

export function eventsOn(day, cal) {
  return cal.filter((ev) => ev.s <= day && day <= ev.e);
}

/** The calendar period (highest priority kind with a mode) covering a day. */
export function periodOn(day, cal) {
  let best = null;
  for (const ev of cal) {
    if (ev.s > day || day > ev.e) continue;
    const k = KINDS[ev.kind];
    if (!k.mode) continue;
    if (!best || k.priority > KINDS[best.kind].priority) best = ev;
  }
  return best;
}

/** Next exam-type period starting after `day` (exclusive). */
export function nextExamAfter(day, cal) {
  let best = null;
  for (const ev of cal) {
    if ((ev.kind === 'exam' || ev.kind === 'midsem') && ev.s > day && (!best || ev.s < best.s)) best = ev;
  }
  return best;
}

/**
 * Resolve the mode for a day and explain why.
 * Order: manual week override > calendar period > pre-exam rule > default.
 */
export function resolveDay(day, ctx) {
  const ov = ctx.overrides[weekKey(day)];
  const period = periodOn(day, ctx.cal);
  if (ov && MODES[ov]) return { mode: ov, source: 'override', period };

  const defaultMode = MODES[ctx.settings.defaultMode] ? ctx.settings.defaultMode : 'normal';
  const mode = period ? KINDS[period.kind].mode : defaultMode;
  const preDays = Number(ctx.settings.preExamDays) || 0;
  if (mode === 'normal' && preDays > 0) {
    const nx = nextExamAfter(day, ctx.cal);
    if (nx && nx.s - day <= preDays) return { mode: 'heavy', source: 'preExam', period, exam: nx };
  }
  return { mode, source: period ? 'calendar' : 'default', period };
}

export function modeOn(day, ctx) {
  return resolveDay(day, ctx).mode;
}

export function paceFor(mode, settings) {
  const p = settings.pace && Number(settings.pace[mode]);
  if (Number.isFinite(p) && p >= 0) return p;
  return MODES[mode] ? MODES[mode].pace : 0;
}

/** Summary of a Monday-starting week. */
export function weekInfo(ws, ctx, fromDay = ws) {
  const days = [];
  const counts = {};
  let pace = 0;
  for (let i = 0; i < 7; i++) {
    const d = ws + i;
    const r = resolveDay(d, ctx);
    days.push({ day: d, ...r });
    counts[r.mode] = (counts[r.mode] || 0) + 1;
    if (d >= fromDay) pace += paceFor(r.mode, ctx.settings) / 7;
  }
  // Dominant mode: most days; ties go to the more restrictive mode.
  const restrictive = ['off', 'exam', 'heavy', 'normal', 'break'];
  let dominant = 'normal';
  let best = -1;
  for (const mode of restrictive) {
    if ((counts[mode] || 0) > best) {
      best = counts[mode] || 0;
      dominant = mode;
    }
  }
  return { start: ws, days, counts, dominant, pace, override: ctx.overrides[weekKey(ws)] || null };
}

// ---------------------------------------------------------------------------
// Roadmap progress and forecast
// ---------------------------------------------------------------------------

export function moduleState(mod, progress = {}) {
  const p = progress[mod.id] || {};
  const tasks = p.tasks || {};
  const done = p.status === 'done' || (tasks.objective && tasks.exit);
  const skipped = p.status === 'skipped';
  const checked = (tasks.objective ? 1 : 0) + (tasks.exit ? 1 : 0);
  return { done: !!done, skipped, checked, fraction: done ? 1 : checked / 2 };
}

export function moduleRemaining(mod, progress) {
  const st = moduleState(mod, progress);
  if (st.done || st.skipped) return 0;
  const w = Number(mod.weight) > 0 ? Number(mod.weight) : 1;
  return w * (1 - st.fraction);
}

export function currentModule(modules, progress) {
  return modules.find((m) => moduleRemaining(m, progress) > 0) || null;
}

/**
 * Place remaining modules on future weeks using each week's capacity.
 * Starts today, so the forecast moves when you fall behind or get ahead,
 * and whenever the calendar changes.
 */
export function forecast(modules, progress, today, ctx, { horizonWeeks = 156 } = {}) {
  const queue = modules.map((m) => ({ id: m.id, left: moduleRemaining(m, progress) })).filter((q) => q.left > 0);
  const result = {};
  let qi = 0;
  let ws = weekStart(today);
  let finish = null;
  for (let w = 0; w < horizonWeeks && qi < queue.length; w++, ws += 7) {
    // Walk day by day so partial weeks (e.g. exams starting mid-week) count correctly.
    for (let i = 0; i < 7 && qi < queue.length; i++) {
      const d = ws + i;
      if (d < today) continue;
      let cap = paceFor(modeOn(d, ctx), ctx.settings) / 7;
      while (cap > 1e-9 && qi < queue.length) {
        const q = queue[qi];
        if (!result[q.id]) result[q.id] = { start: d, end: d };
        const used = Math.min(cap, q.left);
        q.left -= used;
        cap -= used;
        result[q.id].end = d;
        if (q.left <= 1e-9) {
          finish = d;
          qi++;
        }
      }
    }
  }
  const unscheduled = queue.slice(qi).map((q) => q.id);
  return { byId: result, finish: unscheduled.length ? null : finish, unscheduled };
}

// ---------------------------------------------------------------------------
// Timetable and free time
// ---------------------------------------------------------------------------

export function timetableOn(day, ctx) {
  // Latest-starting timetable wins if ranges overlap.
  let best = null;
  for (const t of ctx.timetables) {
    if (t.fromDay <= day && day <= t.toDay && (!best || t.fromDay > best.fromDay)) best = t;
  }
  return best;
}

/** Classes only run on days whose calendar period is a teaching period. */
export function isClassDay(day, ctx) {
  const p = periodOn(day, ctx.cal);
  return !!p && p.kind === 'teaching';
}

export function classesOn(day, ctx) {
  if (!isClassDay(day, ctx)) return [];
  const tt = timetableOn(day, ctx);
  if (!tt) return [];
  const wd = weekdayIndex(day);
  return tt.sessions.filter((c) => c.day === wd);
}

// ---------------------------------------------------------------------------
// Course synergy: modules that overlap with a course you're taking.
// ---------------------------------------------------------------------------

export function relatedCourses(mod, ctx, day) {
  const kws = (mod.keywords || []).map((k) => String(k).toLowerCase()).filter(Boolean);
  if (!kws.length) return [];
  const tt = timetableOn(day, ctx) || ctx.timetables[ctx.timetables.length - 1];
  if (!tt) return [];
  const seen = new Set();
  const out = [];
  for (const c of tt.sessions) {
    const hay = `${c.code} ${c.title}`.toLowerCase();
    if (kws.some((k) => hay.includes(k)) && !seen.has(c.code)) {
      seen.add(c.code);
      out.push(c);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Date conflicts (e.g. an internship overlapping exams)
// ---------------------------------------------------------------------------

export function dateConflicts(startISO, endISO, ctx) {
  if (!isISODate(startISO) || !isISODate(endISO)) return [];
  const s = toDay(startISO);
  const e = toDay(endISO);
  if (e < s) return [];
  return ctx.cal
    .filter((ev) => ['exam', 'midsem', 'teaching'].includes(ev.kind) && ev.s <= e && s <= ev.e)
    .map((ev) => ({
      event: ev,
      severity: ev.kind === 'teaching' ? 'warning' : 'critical',
      overlapDays: Math.min(e, ev.e) - Math.max(s, ev.s) + 1,
    }));
}

// ---------------------------------------------------------------------------
// Rituals and alerts: calendar-triggered guidance
// ---------------------------------------------------------------------------

export function activeRituals(today, ctx, state) {
  const out = [];
  const dismissed = state.dismissed || {};
  const add = (type, key, detail) => {
    if (!dismissed[key]) out.push({ type, key, detail });
  };
  const r = resolveDay(today, ctx);

  const tt = timetableOn(today, ctx);
  if (isClassDay(today, ctx) && !tt) add('noTimetable', `noTimetable:${r.period ? r.period.id : ''}`, r.period ? r.period.title : '');

  for (const app of state.applications || []) {
    if (!['OA', 'interview'].includes(app.status) || !isISODate(app.interviewDate)) continue;
    const d = toDay(app.interviewDate);
    if (d >= today && d - today <= 14) add('interview', `interview:${app.id}:${app.interviewDate}`, { app, day: d });
  }

  if (r.mode === 'exam') add('exam', `exam:${r.period ? r.period.id : weekKey(today)}`, r.period);
  if (r.source === 'preExam') add('preExam', `preExam:${r.exam.id}`, r.exam);

  for (const ev of ctx.cal) {
    if (ev.kind === 'exam' && ev.e < today && today - ev.e <= 14) add('semesterEnd', `semesterEnd:${ev.id}`, ev);
  }

  // Reviews wait until exams are over so they don't compete with revision.
  if (r.mode !== 'exam') {
    if (lastDayOfMonth(today) - today <= 4) add('monthEnd', `monthEnd:${monthKey(today)}`, monthKey(today));
    const wk = weekKey(today);
    if (weekdayIndex(today) >= 5 && !(state.scorecards || {})[wk]) add('weekly', `weekly:${wk}`, wk);
  }

  return out;
}

/** Dated items coming up within `horizon` days, soonest first. */
export function upcoming(today, ctx, state, horizon = 30) {
  const items = [];
  const within = (d) => d >= today && d - today <= horizon;

  for (const ev of ctx.cal) {
    if (ev.kind === 'semester') continue;
    if (ev.kind === 'admin') {
      if (ev.s <= today && within(ev.e)) items.push({ day: ev.e, label: `${ev.title} closes`, tone: 'warning', type: 'calendar' });
      else if (within(ev.s)) items.push({ day: ev.s, endDay: ev.e, label: `${ev.title} opens`, tone: 'info', type: 'calendar' });
    } else if (within(ev.s)) {
      const tone = ev.kind === 'exam' || ev.kind === 'midsem' ? 'critical' : 'info';
      items.push({ day: ev.s, endDay: ev.s === ev.e ? null : ev.e, label: ev.title, tone, type: 'calendar' });
    }
  }

  for (const app of state.applications || []) {
    if (['rejected', 'offer'].includes(app.status)) continue;
    const name = [app.company, app.role].filter(Boolean).join(' · ') || 'Application';
    if (isISODate(app.deadline) && ['researching'].includes(app.status) && within(toDay(app.deadline))) {
      items.push({ day: toDay(app.deadline), label: `${name}: application deadline`, tone: 'critical', type: 'app', id: app.id });
    }
    if (isISODate(app.interviewDate) && within(toDay(app.interviewDate))) {
      items.push({ day: toDay(app.interviewDate), label: `${name}: ${app.status === 'OA' ? 'assessment' : 'interview'}`, tone: 'critical', type: 'app', id: app.id });
    }
    if (isISODate(app.nextActionDate) && toDay(app.nextActionDate) <= today + horizon) {
      const d = toDay(app.nextActionDate);
      items.push({ day: Math.max(d, today), overdue: d < today, label: `${name}: ${app.nextAction || 'next action'}`, tone: d < today ? 'critical' : 'warning', type: 'app', id: app.id });
    }
  }
  return items.sort((a, b) => a.day - b.day);
}

// ---------------------------------------------------------------------------
// Scorecard decision hints
// ---------------------------------------------------------------------------

export function decisionHints(scorecards = {}, today) {
  const keys = Object.keys(scorecards).filter(isISODate).sort();
  const cur = weekKey(today);
  const recent = keys.filter((k) => k <= cur).slice(-2).map((k) => scorecards[k]);
  if (!recent.length) return [];
  const all = (fn) => recent.every(fn);
  const hints = [];
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  if (all((s) => n(s.academic) !== null && n(s.academic) <= 1)) hints.push({ rule: 5, tone: 'critical', text: 'Academic progress is low. Reduce career preparation now — mark this week as Heavy.' });
  if (all((s) => n(s.dsa) !== null && n(s.dsa) <= 1)) hints.push({ rule: 0, tone: 'warning', text: 'DSA accuracy is low. Fewer new topics; return to foundational patterns.' });
  if (all((s) => n(s.dsa) >= 3 && n(s.timed) !== null && n(s.timed) <= 1)) hints.push({ rule: 1, tone: 'warning', text: 'Accuracy is good but timed performance lags. Practise timed sets and edge cases.' });
  if (all((s) => n(s.project) >= 3 && n(s.cs) !== null && n(s.cs) <= 1)) hints.push({ rule: 3, tone: 'warning', text: 'Backend work is strong but CS answers are weak. Shift project time to networking, databases and OS.' });
  if (all((s) => n(s.recruitment) !== null && n(s.recruitment) === 0)) hints.push({ rule: -1, tone: 'info', text: 'No recruitment actions recently. Applications must run alongside preparation.' });
  return hints;
}

export function scoreTotal(card) {
  if (!card) return 0;
  return ['dsa', 'timed', 'cs', 'project', 'interview', 'recruitment', 'academic'].reduce((s, k) => s + (Number(card[k]) || 0), 0);
}
