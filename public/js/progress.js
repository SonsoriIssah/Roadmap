// Progress against the plan: what you had done by each day, next to where the
// plan expected you to be. The plan line is fixed by your calendar and goals,
// so it doesn't move when you fall behind. Pure functions: no DOM or storage.

import { toDay, toISO, isISODate } from './dates.js';
import { modeOn, paceFor } from './engine.js';
import { dailyLoad } from './planner.js';
import { lessonMinutes, trackWindow } from './learn.js';
import { DSA_GOALS } from './data/defaults.js';

/** Where the charts start: the later of the plan start and your last fresh start. */
export function progressStart(state) {
  const days = [state.settings && state.settings.planStart, state.meta && state.meta.freshStartAt].filter(isISODate).map(toDay);
  return days.length ? Math.max(...days) : null;
}

/** The day each problem was first attempted (in the app or in your sheet). */
function firstAttempts(state) {
  const first = new Map();
  const note = (id, iso) => {
    if (!id || !isISODate(iso)) return;
    const d = toDay(iso);
    if (!first.has(id) || d < first.get(id)) first.set(id, d);
  };
  for (const e of state.dsaLog || []) if (e.kind === 'first') note(e.problemId, e.date);
  for (const p of state.problems || []) if (p.status !== 'new') note(p.id, p.firstAt);
  return [...first.values()];
}

/** Cumulative share of a day weight from `from` through each day up to `to`. */
function cumulative(from, to, weight) {
  const out = [];
  let sum = 0;
  for (let d = from; d <= to; d++) out.push((sum += weight(d)));
  return { at: (d) => (d < from ? 0 : out[Math.min(d, to) - from] || 0), total: sum };
}

/**
 * Day-by-day series from the start of the plan to its target finish.
 * Each series is an array over `days`; "you" stops at today (null after).
 */
export function progressSeries(state, ctx, today) {
  const s = state.settings;
  const start = progressStart(state);
  const end = isISODate(s.targetEnd) ? toDay(s.targetEnd) : null;
  if (start === null || end === null || end <= start) return null;
  const days = [];
  for (let d = start; d <= end; d++) days.push(d);
  const mode = new Map(days.map((d) => [d, modeOn(d, ctx)]));
  const load = (d, key) => dailyLoad(mode.get(d) || 'normal', s)[key] || 0;

  // LeetCode: problems first attempted. The plan follows your daily capacity
  // (none in exam weeks) through each goal, from where you were at the start.
  const firsts = firstAttempts(state);
  const before = firsts.filter((d) => d < start).length;
  const cap = cumulative(start, end, (d) => load(d, 'problems'));
  const goals = DSA_GOALS.map((g) => ({ day: toDay(g.by), problems: g.problems })).filter((g) => g.day > start).sort((a, b) => a.day - b.day);
  const planLc = (d) => {
    let fromDay = start;
    let fromValue = before;
    for (const g of goals) {
      const target = Math.max(g.problems, fromValue);
      if (d <= g.day) {
        const span = cap.at(g.day) - cap.at(fromDay);
        return fromValue + (span > 0 ? ((target - fromValue) * (cap.at(d) - cap.at(fromDay))) / span : 0);
      }
      fromDay = g.day;
      fromValue = target;
    }
    return fromValue;
  };
  const youLc = (d) => firsts.filter((x) => x <= d).length;
  const finalGoal = goals.length ? Math.max(before, goals[goals.length - 1].problems) : Math.max(before, 1);

  // Learning tracks: lesson minutes, each track due by the end of its window.
  const tracks = (state.tracks || []).filter((t) => t.active !== false && (t.lessons || []).length);
  const learnTotal = tracks.reduce((sum, t) => sum + t.lessons.reduce((a, l) => a + lessonMinutes(l), 0), 0) || 1;
  const trackPlans = tracks.map((t) => {
    const win = trackWindow(t);
    const total = t.lessons.reduce((a, l) => a + lessonMinutes(l), 0);
    if (!win) return () => 0;
    const w = cumulative(win.start, win.end, (d) => dailyLoad(modeOn(d, ctx), s).learn || 0);
    return (d) => (w.total ? (total * w.at(d)) / w.total : d >= win.end ? total : 0);
  });
  const trackDone = (t, d) => t.lessons.reduce((a, l) => {
    const v = (state.lessonDone || {})[l.id];
    return v && (isISODate(v) ? toDay(v) : start) <= d ? a + lessonMinutes(l) : a;
  }, 0);
  const lessonDays = [];
  for (const t of tracks) {
    for (const l of t.lessons) {
      const v = (state.lessonDone || {})[l.id];
      if (v) lessonDays.push({ day: isISODate(v) ? toDay(v) : start, min: lessonMinutes(l) });
    }
  }
  const youLearn = (d) => lessonDays.reduce((a, x) => (x.day <= d ? a + x.min : a), 0);
  const planLearn = (d) => trackPlans.reduce((a, f) => a + f(d), 0);

  // Roadmap modules: by the weekly pace for each kind of week, to the target finish.
  const mods = state.modules || [];
  const modTotal = mods.reduce((a, m) => a + (Number(m.weight) > 0 ? Number(m.weight) : 1), 0) || 1;
  const pace = cumulative(start, end, (d) => paceFor(mode.get(d) || 'normal', s));
  const modDone = mods
    .map((m) => ({ m, p: (state.progress || {})[m.id] || {} }))
    .filter(({ p }) => p.status === 'done' || (p.tasks && p.tasks.objective && p.tasks.exit))
    .map(({ m, p }) => ({ day: isISODate(p.completedOn) ? toDay(p.completedOn) : start, w: Number(m.weight) > 0 ? Number(m.weight) : 1 }));
  const youMods = (d) => modDone.reduce((a, x) => (x.day <= d ? a + x.w : a), 0);
  const planMods = (d) => (pace.total ? (modTotal * pace.at(d)) / pace.total : 0);

  // Overall: the average share done across learning, roadmap and LeetCode.
  const totals = { learn: learnTotal, roadmap: modTotal, leetcode: finalGoal };
  const pct = (learn, roadmap, leetcode) => overallPct({ learn, roadmap, leetcode }, totals);

  const lc = { you: [], plan: [] };
  const learn = { you: [], plan: [] };
  const roadmap = { you: [], plan: [] };
  const overall = { you: [], plan: [] };
  for (const d of days) {
    const past = d <= today;
    lc.plan.push(Math.round(planLc(d) * 10) / 10);
    lc.you.push(past ? youLc(d) : null);
    learn.plan.push(planLearn(d));
    learn.you.push(past ? youLearn(d) : null);
    roadmap.plan.push(planMods(d));
    roadmap.you.push(past ? youMods(d) : null);
    overall.plan.push(pct(planLearn(d), planMods(d), planLc(d)));
    overall.you.push(past ? pct(youLearn(d), youMods(d), youLc(d)) : null);
  }
  const at = Math.min(Math.max(today, start), end) - start;
  const now = start + at;
  return {
    start,
    end,
    days,
    totals,
    goals: goals.map((g) => ({ day: g.day, problems: g.problems })),
    leetcode: { ...lc, now: lc.you[at] ?? 0, planNow: lc.plan[at], goal: finalGoal },
    learn: { ...learn, tracks: tracks.map((t, i) => ({ id: t.id, name: t.name, window: trackWindow(t), planNow: trackPlans[i](now), now: trackDone(t, now) })) },
    roadmap,
    overall: { ...overall, now: overall.you[at] ?? 0, planNow: overall.plan[at] },
  };
}

/** Overall progress in percent: the average share done of each area's total. */
export function overallPct(values, totals) {
  const share = (k) => Math.min(1, values[k] / (totals[k] || 1));
  return Math.round(((share('learn') + share('roadmap') + share('leetcode')) / 3) * 1000) / 10;
}

/** "6 behind", "2 ahead" or "on plan", rounding to whole units. */
export function gapLabel(you, plan, unit = '') {
  const diff = Math.round(you - plan);
  if (diff === 0) return 'on plan';
  return `${Math.abs(diff)}${unit} ${diff < 0 ? 'behind' : 'ahead'}`;
}


