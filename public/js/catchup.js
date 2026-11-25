// Getting back on track: a catch-up line and a short list of suggestions,
// worked out by fixed rules from where you are against the plan line. No AI
// service is involved. Pure functions: no DOM or storage.

import { fmtDay, fmtDuration } from './dates.js';
import { modeOn, nextExamAfter, currentModule } from './engine.js';
import { dueProblems, leetcodeDays } from './problems.js';
import { overallPct } from './progress.js';

// The catch-up line does half as much again as the plan on each day, so the
// days that carry the most (breaks) close the gap fastest and exam weeks none.
export const CATCH_UP = 1.5;
const REVIEW_BACKLOG = 5; // above this, the daily list holds new problems back
const EXAM_WARNING_DAYS = 21;
const BREAK_LOOKAHEAD_DAYS = 60;

/**
 * One area's catch-up from index `t` (today): the values (null before today
 * and after it rejoins the plan) and the index where it rejoins (null if never).
 * When you are ahead, it keeps the plan's pace and is already on plan.
 */
export function catchUpPath(plan, you, t, total, factor = CATCH_UP) {
  const values = plan.map(() => null);
  const start = you[t] ?? 0;
  if (start >= plan[t] - 1e-9) {
    for (let i = t; i < plan.length; i++) values[i] = Math.min(total, start + plan[i] - plan[t]);
    return { values, rejoin: t, ahead: true };
  }
  let v = start;
  values[t] = v;
  for (let i = t + 1; i < plan.length; i++) {
    v += (plan[i] - plan[i - 1]) * factor;
    if (v >= plan[i] - 1e-9) {
      values[i] = plan[i];
      return { values, rejoin: i, ahead: false };
    }
    values[i] = v;
  }
  return { values, rejoin: null, ahead: false };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * The catch-up line for overall progress, each area's gap, and what to do.
 * `p` is the result of progressSeries(). Suggestions come ranked, most useful first.
 */
export function catchUp(p, state, ctx, today) {
  const t = Math.min(Math.max(today, p.start), p.end) - p.start;
  const day = (i) => (i === null ? null : p.days[i]);
  const areas = [
    { id: 'leetcode', label: 'LeetCode', series: p.leetcode, unit: 'problem' },
    { id: 'learn', label: 'Learning tracks', series: p.learn, unit: 'minute' },
    { id: 'roadmap', label: 'Roadmap modules', series: p.roadmap, unit: 'module' },
  ].map((a) => {
    const total = p.totals[a.id];
    const path = catchUpPath(a.series.plan, a.series.you, t, total);
    const you = a.series.you[t] ?? 0;
    const plan = a.series.plan[t];
    // Points of overall progress this area is behind by.
    const pts = Math.max(0, ((Math.min(1, plan / total) - Math.min(1, you / total)) / 3) * 100);
    return { ...a, total, path, gap: Math.max(0, plan - you), pts: Math.round(pts * 10) / 10, rejoin: day(path.rejoin) };
  });

  // Overall line: each area follows its catch-up, then the plan once it rejoins.
  const behind = areas.filter((a) => !a.path.ahead);
  const rejoinIdx = behind.some((a) => a.path.rejoin === null) ? null : Math.max(t, ...behind.map((a) => a.path.rejoin));
  const path = p.days.map((_, i) => {
    if (i < t || (rejoinIdx !== null && i > rejoinIdx) || !behind.length) return null;
    const v = {};
    for (const a of areas) v[a.id] = a.path.values[i] ?? a.series.plan[i];
    return overallPct(v, p.totals);
  });

  return { path, rejoin: behind.length ? day(rejoinIdx) : today, behind: behind.length > 0, areas, suggestions: suggest(p, state, ctx, today, areas, day(rejoinIdx), behind.length > 0) };
}

/** Weeks from today to a day, at least one. */
const weeksTo = (today, d) => Math.max(1, (d - today) / 7);

function suggest(p, state, ctx, today, areas, rejoin, behind) {
  const out = [];
  const add = (score, s) => out.push({ score, ...s });
  const by = (area) => area.rejoin;
  const lc = areas.find((a) => a.id === 'leetcode');
  const learn = areas.find((a) => a.id === 'learn');
  const roadmap = areas.find((a) => a.id === 'roadmap');

  // Out of reach by the target: re-spread the plan rather than cram.
  if (behind && (rejoin === null || rejoin > p.end)) {
    add(100, {
      id: 'respread',
      tone: 'critical',
      title: `At this pace you won't catch up by ${fmtDay(p.end, { weekday: false })}`,
      detail: 'Even at half as much again as the plan each day, the gap stays open. Start fresh from today to spread what is left over the time you have, or move the target finish.',
      action: { label: 'Settings', route: 'settings' },
    });
  }

  // LeetCode: reviews first, then extra new problems.
  if (!(state.problems || []).length) {
    add(50, { id: 'import', tone: 'warning', title: 'Import your DSA sheet', detail: 'LeetCode is a third of your progress, and the plan counts problems you start. Import your sheet so the daily list can hand them out.', action: { label: 'Problems', route: 'track/dsa' } });
  } else if (lc.gap >= 1) {
    const due = dueProblems(state.problems, today).length;
    const gap = Math.round(lc.gap);
    if (due > REVIEW_BACKLOG) {
      add(lc.pts + 20, {
        id: 'reviews',
        tone: 'warning',
        title: `Clear ${due} overdue reviews first`,
        detail: `While more than ${REVIEW_BACKLOG} reviews are due, your daily list gives up new problems so the backlog can't grow. At two reviews a day it's clear in ${plural(Math.ceil((due - REVIEW_BACKLOG) / 2), 'day')}; then new problems come back.`,
        action: { label: 'Today', route: 'today' },
      });
    }
    const perWeek = Math.ceil(gap / weeksTo(today, by(lc) ?? p.end));
    add(lc.pts, {
      id: 'leetcode',
      tone: lc.pts >= 5 ? 'critical' : 'warning',
      title: `Start ${plural(perWeek, 'extra problem')} a week`,
      detail: `You're ${plural(gap, 'problem')} behind the plan. Tap "+1 problem" on Today when you finish early${by(lc) ? `; at this rate you're back on plan by ${fmtDay(by(lc), { weekday: false })}` : ''}.`,
      action: { label: 'Today', route: 'today' },
    });
  }
  if (behind && (state.problems || []).length) {
    const c = leetcodeDays(state, today);
    if (c.done < c.window * 0.6) {
      add(3, { id: 'daily', tone: 'info', title: `LeetCode on ${c.done} of the last ${c.window} days`, detail: 'One short review on most days keeps reviews from piling up, and does more than a long weekend session. Aim for five days a week before adding more.', action: { label: 'Today', route: 'today' } });
    }
  }

  // Learning: the track furthest behind.
  const track = p.learn.tracks.map((x) => ({ ...x, gap: x.planNow - x.now })).sort((a, b) => b.gap - a.gap)[0];
  if (track && track.gap >= 15 && learn.gap >= 15) {
    const ended = track.window && track.window.end < today;
    const late = ended || (track.window && by(learn) && by(learn) > track.window.end);
    const perDay = Math.ceil(track.gap / Math.max(1, ((by(learn) ?? p.end) - today) * (5 / 7)) / 5) * 5;
    const end = track.window && fmtDay(track.window.end, { weekday: false });
    add(learn.pts, {
      id: 'learn',
      tone: learn.pts >= 5 ? 'critical' : 'warning',
      title: `Catch up ${fmtDuration(Math.round(track.gap))} of ${track.name}`,
      detail: ended
        ? `Its end date, ${end}, has passed, so all of it counts as due. Give it more weeks in Plan -> Learn, so each day's share is realistic.`
        : late
          ? `That won't fit before the track's end on ${end}. Give it more weeks in Plan -> Learn, so each day's share stays realistic.`
          : `Your list already adds missed lessons each day. Do about ${perDay} extra minutes on study days, or tap "+ next lesson" when you finish early.`,
      action: late ? { label: 'Plan', route: 'plan/learn' } : { label: 'Today', route: 'today' },
    });
  }

  // Roadmap: name the module to finish next.
  const mod = currentModule(state.modules || [], state.progress || {});
  if (mod && roadmap.gap >= 0.5) {
    const tasks = ((state.progress || {})[mod.id] || {}).tasks || {};
    const next = tasks.objective ? `exit task: ${mod.exit}` : `objective: ${mod.objective}`;
    add(roadmap.pts, {
      id: 'roadmap',
      tone: roadmap.pts >= 5 ? 'critical' : 'warning',
      title: `Finish ${mod.id} · ${mod.title}`,
      detail: `You're ${Math.round(roadmap.gap * 10) / 10} modules behind. Next, the ${next}`,
      action: { label: 'Plan', route: 'plan' },
    });
  }

  // The calendar: study days before exams, and free days coming up.
  if (behind) {
    const exam = nextExamAfter(today, ctx.cal);
    if (exam && exam.s - today <= EXAM_WARNING_DAYS) {
      let n = 0;
      for (let d = today; d < exam.s; d++) if (['normal', 'break'].includes(modeOn(d, ctx))) n++;
      add(4, { id: 'exams', tone: 'warning', title: `${plural(n, 'study day')} before ${exam.title.toLowerCase()}`, detail: `The plan pauses in exam weeks, so catch up before ${fmtDay(exam.s, { weekday: false })}, not during them.`, action: null });
    }
    const brk = ctx.cal.find((e) => e.kind === 'break' && e.s > today && e.s - today <= BREAK_LOOKAHEAD_DAYS && e.e - e.s >= 4);
    if (brk && (rejoin === null || rejoin >= brk.s)) {
      add(2, { id: 'break', tone: 'info', title: `Catch up over ${brk.title}`, detail: `${plural(brk.e - brk.s + 1, 'free day')} from ${fmtDay(brk.s, { weekday: false })}. Each carries about twice a normal day, so that is where the gap closes fastest.`, action: null });
    }
  }

  if (!behind) {
    add(0, { id: 'onplan', tone: 'good', title: "You're on plan", detail: 'Keep the daily routine. Nothing extra is needed; finishing early is a fine time for "+1 problem".', action: null });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 4);
}
