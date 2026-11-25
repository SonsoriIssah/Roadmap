// Suggested times: fits a day's list into the free time around lectures, meals
// and your chosen hours. Pure — no DOM or storage.

import { isTime, toMin } from './dates.js';
import { DEFAULT_SETTINGS } from './data/defaults.js';

const CLASS_BUFFER = 15; // to get to and from a lecture
const BREAK = 10; // between tasks
const MIN_CHUNK = 20; // the shortest part worth splitting a long task into

// Work that needs the most focus gets the earliest free time. The interview step
// comes early too: it is only minutes, and each piece builds on the one before.
const FOCUS = { revisit: 0, problem: 0, recall: 0, lesson: 1, interview: 2, academic: 3, revise: 3, roadmap: 4, basics: 5, career: 6 };

export function normaliseDayPlan(raw) {
  const base = DEFAULT_SETTINGS.dayPlan;
  const p = raw && typeof raw === 'object' ? raw : {};
  const time = (v, fallback) => (isTime(v) ? v : fallback);
  const saved = Array.isArray(p.blocked) ? p.blocked : [];
  return {
    start: time(p.start, base.start),
    end: time(p.end, base.end),
    blocked: base.blocked.map((b, i) => ({ label: b.label, start: time(saved[i]?.start, b.start), end: time(saved[i]?.end, b.end) })),
  };
}

/** Free windows of a day, in order, as { s, e } in minutes from midnight. */
export function freeWindows(classes, dayPlan, nowMin = null) {
  const busy = [
    ...classes.map((c) => ({ s: c.s - CLASS_BUFFER, e: c.e + CLASS_BUFFER })),
    ...dayPlan.blocked.map((b) => ({ s: toMin(b.start), e: toMin(b.end) })),
  ].sort((a, b) => a.s - b.s);
  const end = toMin(dayPlan.end);
  let at = toMin(dayPlan.start);
  if (nowMin !== null) at = Math.max(at, Math.ceil(nowMin / 5) * 5);
  const out = [];
  for (const b of busy) {
    if (b.s > at) out.push({ s: at, e: Math.min(b.s, end) });
    at = Math.max(at, b.e);
  }
  out.push({ s: at, e: end });
  return out.filter((w) => w.e > w.s);
}

/** Take `min` minutes from the windows, not before `notBefore`: whole if a window can hold it, else in parts. */
function place(min, allWindows, notBefore = 0) {
  const at = allWindows.findIndex((w) => w.s < notBefore && notBefore < w.e);
  if (at >= 0) allWindows.splice(at, 1, { s: allWindows[at].s, e: notBefore }, { s: notBefore, e: allWindows[at].e });
  const windows = allWindows.filter((w) => w.s >= notBefore);
  const whole = windows.find((w) => w.e - w.s >= min);
  if (whole) {
    const slot = { s: whole.s, e: whole.s + min };
    whole.s = slot.e + BREAK;
    return { slots: [slot], left: 0 };
  }
  const slots = [];
  let left = min;
  for (const w of windows) {
    const take = Math.min(left, w.e - w.s);
    if (take < MIN_CHUNK) continue;
    slots.push({ s: w.s, e: w.s + take });
    w.s += take + BREAK;
    left -= take;
    if (!left) break;
  }
  return { slots, left };
}

/**
 * Suggest times for a day's open tasks and its roadmap block.
 * Returns { slots: Map(key -> [{ s, e }]), short: [{ title, min }] }, where
 * `short` holds what the free time couldn't hold.
 */
export function suggestTimes(day, dayPlan, { nowMin = null } = {}) {
  const windows = freeWindows(day.classes || [], dayPlan, nowMin);
  const roadmap = day.roadmap ? [{ key: 'roadmap', type: 'roadmap', title: `Roadmap: ${day.roadmap.id} · ${day.roadmap.title}`, min: day.roadmap.min }] : [];
  const open = [...day.items.filter((i) => !i.done && i.min > 0), ...roadmap];
  const rank = (i) => FOCUS[i.type] ?? 6;
  const slots = new Map();
  const short = [];
  for (const item of open.sort((a, b) => rank(a) - rank(b))) {
    // A lecture's revision comes after that lecture.
    const lectures = item.type === 'revise' ? (day.classes || []).filter((c) => c.code === item.courseCode) : [];
    const placed = place(item.min, windows, Math.max(0, ...lectures.map((c) => c.e)));
    if (placed.slots.length) slots.set(item.key, placed.slots);
    if (placed.left) short.push({ title: item.title, min: placed.left });
  }
  return { slots, short };
}
