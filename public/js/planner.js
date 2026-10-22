// Day-by-day task lists. Starting from today, the planner walks forward one
// day at a time and hands out work from queues (lessons, problems, first-week
// tasks), so tomorrow's list continues where today's leaves off and anything
// you skip simply rolls forward. Pure — no DOM or storage.

import { toISO, toDay, isISODate, weekKey, fmtDay } from './dates.js';
import { resolveDay, classesOn, timetableOn } from './engine.js';
import { CHECKLISTS, DEFAULT_SETTINGS } from './data/defaults.js';
import { orderNew, dueProblems, reviewTask, reviewGap, stageOf, targetMinutes, applyOutcome, STAGE_LABEL } from './problems.js';
import { lessonMinutes, trackWindow, remainingMinutes, isCourseDay, fmtTimestamp, videoLink } from './learn.js';
import { BASICS } from './data/basics.js';

export function dailyLoad(mode, settings) {
  const base = DEFAULT_SETTINGS.daily[mode] || DEFAULT_SETTINGS.daily.off;
  const user = (settings.daily && settings.daily[mode]) || {};
  const out = {};
  for (const k of Object.keys(base)) {
    const v = Number(user[k]);
    out[k] = Number.isFinite(v) && v >= 0 ? v : base[k];
  }
  return out;
}

/** Courses of the semester a day belongs to (exams use the timetable that just ended). */
export function semesterCourses(day, ctx, { lookback = false } = {}) {
  let tt = timetableOn(day, ctx);
  if (!tt && lookback) {
    for (const t of ctx.timetables) if (t.toDay < day && day - t.toDay <= 30 && (!tt || t.toDay > tt.toDay)) tt = t;
  }
  if (!tt) return [];
  const seen = new Map();
  for (const c of tt.sessions) if (!seen.has(c.code)) seen.set(c.code, { code: c.code, title: c.title.replace(/\s*\(combined\)\s*$/i, '') });
  return [...seen.values()];
}

const doneOn = (v, iso) => v === iso;

export const SEM1_START = toDay('2026-10-13');
export const SEM1_END = toDay('2027-02-13');
export const XMAS_START = toDay('2026-12-19');
export const XMAS_END = toDay('2027-01-03');
export const isSem1StudyWindow = (day) => day >= SEM1_START && day <= SEM1_END;
export const isXmasBreak = (day) => day >= XMAS_START && day <= XMAS_END;

export function normalizeTaskKey(key, title = '') {
  if (!key) return '';
  if (key === 'baseline:dsa' || key === 'kickoff:k2' || key === 'module:W1:objective') return 'baseline:dsa';
  if (key === 'assessment:sql' || key === 'kickoff:k4') return 'assessment:sql';
  if (key === 'career:tracker' || key === 'kickoff:k1') return 'career:tracker';
  if (key === 'kickoff:k7' || key.startsWith('review:weekly')) return 'review:weekly';
  const t = (title || '').toLowerCase().trim();
  if (t.includes('dsa baseline') || t.includes('solve two unseen dsa problems')) return 'baseline:dsa';
  return key.trim().toLowerCase();
}

export const DSA_BASELINE_TITLE = 'Run the DSA baseline: solve two unseen problems; record approach, time, hints, complexity and mistakes';
export const DSA_BASELINE_DESC = 'Solve two unseen problems, no solutions first. Record approach, time, hints, complexity and mistakes. Write your starting scorecard.';

export function pushItem(dayItems, item, d) {
  const norm = normalizeTaskKey(item.key, item.title);
  if (dayItems.some((i) => normalizeTaskKey(i.key, i.title) === norm)) {
    return false;
  }
  item.scheduledDate = item.scheduledDate || toISO(d);
  dayItems.push(item);
  return true;
}

/** Highest priority first. Lower number = kept first when a day is over the cap. */
const RANK = { revisit: 0, problem: 1, lesson: 2, revise: 3, academic: 3, career: 4, kickoff: 5, module: 6, personal: 7 };
const rankOf = (i) => (i.basics ? 2.5 : RANK[i.type] ?? 99);

/**
 * Keep one slot for a new problem: when reviews (or anything ranked above it)
 * would fill every slot, the first open problem takes the last one. Skipped
 * when a new problem is already done that day or there is only one slot.
 */
function reserveNewProblem(open, slots, items) {
  if (slots < 2 || items.some((i) => i.type === 'problem' && i.done)) return open;
  const at = open.findIndex((x) => x.item.type === 'problem');
  if (at < slots) return open;
  const out = open.slice();
  const [p] = out.splice(at, 1);
  out.splice(slots - 1, 0, p);
  return out;
}
/** Module the forecast places on a day (falls back to the current one). */
function moduleOn(day, today, modules, fc, current) {
  if (day <= today || !fc) return current;
  for (const m of modules) {
    const r = fc.byId[m.id];
    if (r && r.start <= day && day <= r.end) return m;
  }
  return current;
}

function groupTitle(track, group) {
  if (group.length <= 3) return `${track.name}: ${group.map((l) => l.title).join(', ')}`;
  return `${track.name}: ${group[0].title} → ${group[group.length - 1].title} (${group.length} chapters)`;
}

function lessonItem(track, group, iso, lessonDone) {
  const ids = group.map((l) => l.id);
  const done = group.every((l) => doneOn(lessonDone[l.id], iso));
  const min = group.reduce((s, l) => s + lessonMinutes(l), 0);
  const practice = group.map((l) => l.practice).filter(Boolean);
  const first = group[0];
  const last = group[group.length - 1];
  if (first.video && Number.isFinite(first.start) && Number.isFinite(last.end)) {
    return {
      key: `lesson:${ids.join(',')}`,
      type: 'lesson',
      category: 'technical',
      isTechnical: true,
      _group: group,
      _track: track,
      lessonIds: ids,
      trackId: track.id,
      title: groupTitle(track, group),
      action: `Watch ${track.resource || 'the video'} ${fmtTimestamp(first.start)} → ${fmtTimestamp(last.end)}`,
      url: videoLink(track.url, first.start),
      practice,
      min,
      done,
    };
  }
  return {
    key: `lesson:${ids.join(',')}`,
    type: 'lesson',
    category: 'technical',
    isTechnical: true,
    _group: group,
    _track: track,
    lessonIds: ids,
    trackId: track.id,
    title: `${track.name}: ${group.map((l) => l.title).join(', ')}`,
    action: first.video ? `Study in ${track.resource || 'your course'}` : 'Study',
    url: track.url || '',
    practice,
    min,
    done,
  };
}

/** Group consecutive video lessons into one "watch a → b" item. */
function groupLessons(lessons) {
  const groups = [];
  for (const l of lessons) {
    const g = groups[groups.length - 1];
    const prev = g && g[g.length - 1];
    const contiguous = prev && !prev.breakAfter && l.video && prev.video && Number.isFinite(l.start) && Number.isFinite(prev.end) && l.start === prev.end;
    if (contiguous) g.push(l);
    else groups.push([l]);
  }
  return groups;
}

/**
 * Build task lists for `count` days starting at `from` (≥ today).
 * Returns { days: [{ day, mode, items, minutes }], trackFinish: { trackId: day|null } }
 */
export function planDays(from, count, state, ctx, today, { fc = null, current = null, horizon = 0 } = {}) {
  const s = state.settings;
  const iso0 = toISO(today);
  const lessonDone = state.lessonDone || {};
  const checks = state.checks || {};
  const problems = state.problems || [];
  const extra = (state.extra || {})[iso0] || {};
  const boost = Number(s.courseBoost) > 0 ? Number(s.courseBoost) : 1;

  // --- Learning tracks: queues and pacing ---------------------------------
  const tracks = (state.tracks || [])
    .filter((t) => t.active !== false && (t.lessons || []).length)
    .map((t) => {
      const win = trackWindow(t);
      const pending = t.lessons.filter((l) => !lessonDone[l.id]);
      const doneToday = t.lessons.filter((l) => doneOn(lessonDone[l.id], iso0));
      const memo = new Map();
      const weight = (d) => {
        if (win && d < win.start) return 0;
        if (!memo.has(d)) {
          const cap = dailyLoad(resolveDay(d, ctx).mode, s).learn;
          memo.set(d, cap * (isCourseDay(classesOn(d, ctx), t.keywords) ? boost : 1));
        }
        return memo.get(d);
      };
      // Weight still available from day d to the end of the track's window.
      const weightLeft = (d) => {
        let sum = 0;
        if (win) for (let x = d; x <= win.end; x++) sum += weight(x);
        return sum;
      };
      return { t, win, queue: pending, doneToday, weight, weightLeft, rem: remainingMinutes(t, lessonDone, today), finish: null, prevFinish: null };
    });

  // --- Problems ----------------------------------------------------------------
  const takenNew = new Set();
  const attemptedToday = problems.filter((p) => p.firstAt === iso0);
  const reviewedToday = problems.filter((p) => p.lastAt === iso0 && p.firstAt !== iso0);
  const dueQueue = dueProblems(problems, today).filter((p) => p.lastAt !== iso0);
  // Today's log entries hold each problem as it was before you ticked it, so a
  // finished review still shows the step you did (not the next one).
  const before = new Map();
  for (const e of state.dsaLog || []) if (e.date === iso0 && e.prev && e.problemId) before.set(e.problemId, e.prev);
  const scheduledLater = new Map();
  const schedule = (d, p) => (scheduledLater.get(d) || scheduledLater.set(d, []).get(d)).push(p);
  const restoreDroppedTech = (d, droppedTech) => {
    for (const item of droppedTech) {
      if (item.type === 'problem' && item.problemId) {
        takenNew.delete(item.problemId);
        const reviewTarget = d + reviewGap('solved');
        if (scheduledLater.has(reviewTarget)) {
          scheduledLater.set(reviewTarget, scheduledLater.get(reviewTarget).filter((p) => p.id !== item.problemId));
        }
      } else if (item.type === 'lesson' && item._group && item._track) {
        const trackObj = tracks.find((tr) => tr.t.id === item._track.id);
        if (trackObj) {
          trackObj.queue.unshift(...item._group);
          trackObj.rem += item.min || 0;
          trackObj.finish = trackObj.prevFinish;
        }
      } else if (item.type === 'revisit' && item._src) {
        overflow.unshift(item._src);
      }
    }
  };
  for (const p of problems) {
    if (p.status === 'new' || !isISODate(p.nextReview)) continue;
    const d = toDay(p.nextReview);
    if (d > today) schedule(d, p);
  }
  let overflow = [];
  const nextLabel = (p) => (isISODate(p.nextReview) ? `Review ${fmtDay(toDay(p.nextReview))}: ${reviewTask(p).step}` : '');

  const basicsOn = s.basicsRevisit !== false && BASICS.topics.length > 0;
  const basicsKeys = Object.entries(checks).filter(([k]) => k.startsWith('revise:') && k.includes(':basics:'));
  const basicsBase = basicsKeys.filter(([, v]) => v !== iso0).length;
  const basicsDoneToday = basicsKeys.find(([, v]) => v === iso0);
  const days = [];
  const last = from + Math.max(count, horizon) - 1;
  for (let d = today; d <= last; d++) {
    const iso = toISO(d);
    const isToday = d === today;
    const r = resolveDay(d, ctx);
    const load = dailyLoad(r.mode, s);
    const classes = classesOn(d, ctx);
    const items = [];

    // 1. Learning
    for (const tr of tracks) {
      if (tr.win && d < tr.win.start) continue;
      // Share of what's left, by this day's weight in the remaining window.
      // Recomputed daily, so a short day is made up on the following ones.
      const w = tr.weight(d);
      const left = tr.win && d <= tr.win.end ? tr.weightLeft(d) : 0;
      const quota = left > 0 ? Math.min(w, (tr.rem * w) / left) : w;
      const chosen = isToday ? [...tr.doneToday] : [];
      let used = chosen.reduce((sum, l) => sum + lessonMinutes(l), 0);
      let extraN = isToday ? Number(extra.lessons) || 0 : 0;
      while (tr.queue.length && (quota > 0 || extraN > 0)) {
        const l = tr.queue[0];
        const m = lessonMinutes(l);
        const fits = used + m <= quota + 10;
        const firstOfDay = chosen.length === 0 && quota >= 10;
        if (!(fits || firstOfDay || extraN > 0)) break;
        if (!fits && !firstOfDay) extraN--;
        chosen.push(tr.queue.shift());
        used += m;
      }
      tr.rem -= used;
      if (chosen.length) {
        tr.prevFinish = tr.finish;
        tr.finish = d;
        for (const g of groupLessons(chosen)) items.push(lessonItem(tr.t, g, iso, lessonDone));
      }
    }

    // 2. DSA: reviews first (overdue, then due today), then new problems in
    // the slots left, as in your tracker's "Study today" order.
    const mod = moduleOn(d, today, state.modules, fc, current);
    const focus = mod && mod.track === 'dsa' ? mod.patterns || [] : [];
    const doneReviews = isToday ? reviewedToday : [];
    const dueNow = isToday ? dueQueue : [...overflow, ...(scheduledLater.get(d) || [])];
    const reviewCap = Math.max(0, load.revisits + Math.max(0, load.problems - 1) - doneReviews.length);
    const reviews = [...doneReviews, ...dueNow.slice(0, reviewCap)];
    overflow = dueNow.slice(reviewCap);
    for (const p of reviews) {
      const done = isToday && p.lastAt === iso0 && p.firstAt !== iso0;
      const src = done ? before.get(p.id) || p : p;
      const task = reviewTask(src);
      const overdue = !p.projected && isISODate(src.nextReview) && toDay(src.nextReview) < d;
      items.push({
        key: `revisit:${p.id}`,
        type: 'revisit',
        category: 'technical',
        isTechnical: true,
        problemId: p.id,
        _src: src,
        title: task.title,
        desc: task.desc,
        meta: [STAGE_LABEL[stageOf(src)], p.pattern || p.topic, overdue ? `overdue since ${fmtDay(toDay(src.nextReview), { weekday: false })}` : '', p.projected ? 'expected' : ''].filter(Boolean).join(' · '),
        url: p.url,
        min: task.min,
        done,
        next: done ? nextLabel(p) : '',
      });
    }

    const extraP = isToday ? Number(extra.problems) || 0 : 0;
    const slots = load.problems > 0 ? Math.max(1, Math.min(load.problems, load.problems + load.revisits - reviews.length)) : 0;
    const quotaP = slots + extraP;
    const todayNew = isToday ? attemptedToday.slice() : [];
    if (quotaP > todayNew.length) {
      const pool = orderNew(problems.filter((p) => !takenNew.has(p.id)), focus, s.problemOrder);
      for (const p of pool.slice(0, quotaP - todayNew.length)) {
        takenNew.add(p.id);
        todayNew.push(p);
        // Expect it to be solved on its day: its first review shows up 3 days later.
        schedule(d + reviewGap('solved'), { ...p, stage: 'solved', status: 'solved', nextReview: toISO(d + reviewGap('solved')), projected: true });
      }
    }
    for (const p of todayNew) {
      const done = isToday && p.firstAt === iso0;
      items.push({
        key: `problem:${p.id}`,
        type: 'problem',
        category: 'technical',
        isTechnical: true,
        problemId: p.id,
        title: `Solve ${p.title}`,
        meta: [p.difficulty, p.pattern || p.topic, p.priority !== null && p.priority !== undefined ? `P${p.priority}` : ''].filter(Boolean).join(' · '),
        url: p.url,
        min: targetMinutes(p) + 10,
        done,
        next: done ? nextLabel(p) : '',
      });
    }

    // 4. Coursework revision and university study
    // Strict scheduling rules (Section 10):
    // All university study activities fall within 2026-10-13 to 2027-02-13.
    // Christmas break (2026-12-19 to 2027-01-03) is left free from routine academic scheduling.
    const inSem1 = isSem1StudyWindow(d);
    const inXmas = isXmasBreak(d);
    const trackKeys = tracks.flatMap((tr) => tr.t.keywords || []);
    const lectured = [];
    if (inSem1 && !inXmas && load.lecture > 0) {
      const seen = new Set();
      for (const c of classes) {
        if (seen.has(c.code)) continue;
        seen.add(c.code);
        lectured.push(c);
        const javaish = isCourseDay([c], trackKeys);
        pushItem(items, {
          key: `revise:${iso}:${c.code}`,
          type: 'revise',
          category: 'academic',
          isTechnical: false,
          courseCode: c.code,
          scheduledDate: iso,
          title: `Revise ${c.code} · ${c.title.replace(/\s*\(combined\)\s*$/i, '')}`,
          desc: javaish ? "Rewrite today's lecture examples in code, then add one variation of your own." : "Go over today's notes and write three questions an exam could ask.",
          meta: 'Coursework',
          min: load.lecture,
          done: doneOn(checks[`revise:${iso}:${c.code}`], iso),
        }, d);
      }
    }
    if (inSem1 && !inXmas && load.rotate > 0 && !lectured.length) {
      const examLike = r.mode === 'exam' || r.mode === 'heavy';
      const courses = r.mode === 'break' ? (timetableOn(d, ctx) ? semesterCourses(d, ctx) : []) : semesterCourses(d, ctx, { lookback: examLike });
      if (courses.length) {
        const n = Math.min(load.rotate, courses.length);
        for (let k = 0; k < n; k++) {
          const c = courses[(((d * n + k) % courses.length) + courses.length) % courses.length];
          const desc = r.mode === 'exam' ? 'Past questions, then a one-page summary from memory.' : examLike ? 'Exam prep: summary notes and past questions.' : 'Review the week: rewrite the key points and examples.';
          pushItem(items, {
            key: `revise:${iso}:${c.code}`,
            type: 'revise',
            category: 'academic',
            isTechnical: false,
            courseCode: c.code,
            scheduledDate: iso,
            title: `Revise ${c.code} · ${c.title}`,
            desc,
            meta: r.mode === 'exam' ? 'Exam prep' : 'Revision',
            min: load.rotateMin,
            done: doneOn(checks[`revise:${iso}:${c.code}`], iso),
          }, d);
        }
      }
    }

    // 4c. Scheduled university study sessions & academic deadlines
    if (inSem1 && state.academic && Array.isArray(state.academic.studyTasks)) {
      for (const t of state.academic.studyTasks) {
        if (t.date === iso) {
          pushItem(items, {
            key: `academic:${t.id}`,
            type: 'academic',
            category: 'academic',
            isTechnical: false,
            taskId: t.id,
            courseCode: t.courseCode || '',
            scheduledDate: iso,
            title: t.title,
            desc: t.desc || '',
            meta: [t.courseCode, t.topic || t.meta || 'Study session'].filter(Boolean).join(' · '),
            min: Number(t.min) || 45,
            done: doneOn(checks[`academic:${t.id}`], iso),
          }, d);
        }
      }
    }

    // 4d. Fundamentals revisit on Upsoma
    if (basicsOn && r.mode !== 'off' && r.mode !== 'exam') {
      const n = BASICS.topics.length;
      const idx = isToday && basicsDoneToday ? Number(basicsDoneToday[0].split(':').pop()) : (basicsBase + (d - today)) % n;
      const t = BASICS.topics[idx];
      if (t) {
        const key = `revise:${iso}:basics:${idx}`;
        pushItem(items, {
          key,
          type: 'basics',
          category: 'technical',
          isTechnical: true,
          basics: true,
          scheduledDate: iso,
          title: `${t.name}: Revisit this topic`,
          desc: t.area === 'python'
            ? 'Revisit it on Upsoma, then close the tab and write a short example from memory.'
            : 'Revisit it on Upsoma, then explain it aloud in two minutes with one example from your own projects.',
          meta: t.area === 'python' ? 'Python basics · Upsoma' : 'Software engineering · Upsoma',
          url: BASICS.url,
          min: 30,
          done: doneOn(checks[key], iso),
        }, d);
      }
    }

    // 5. Applications
    if (r.mode !== 'off') {
      for (const a of state.applications || []) {
        if (['rejected', 'offer'].includes(a.status) || !isISODate(a.nextActionDate) || !a.nextAction) continue;
        const ad = toDay(a.nextActionDate);
        const key = `app:${a.id}:${a.nextActionDate}`;
        const doneDate = checks[key];
        if (isToday ? ad <= d && (!doneDate || doneOn(doneDate, iso)) : ad === d && !doneDate) {
          pushItem(items, { key, type: 'career', category: 'career', isTechnical: false, appId: a.id, scheduledDate: iso, title: `${a.nextAction}`, meta: [a.company, a.role].filter(Boolean).join(' · ') + (ad < d ? ' · overdue' : ''), min: 20, done: doneOn(doneDate, iso) }, d);
        }
      }
    }

    // 6. Cap personal activities independently of school and career work.
    const maxPersonal = Math.max(1, Math.floor(Number(s.maxPersonalPerDay ?? s.maxPersonalTasks)) || 3);
    const personalItems = items.filter((i) => i.category === 'personal');
    if (personalItems.length > maxPersonal) {
      const doneCount = personalItems.filter((i) => i.done).length;
      const openSlots = Math.max(0, maxPersonal - doneCount);
      const openPersonal = personalItems
        .map((item, idx) => ({ item, idx }))
        .filter((x) => !x.item.done)
        .sort((a, b) => a.idx - b.idx);
      const keepOpen = new Set(openPersonal.slice(0, openSlots).map((x) => x.item));
      const droppedPersonal = new Set(openPersonal.slice(openSlots).map((x) => x.item));
      if (droppedPersonal.size) {
        const kept = items.filter((i) => !droppedPersonal.has(i));
        items.length = 0;
        items.push(...kept);
      }
    }

    // Keep today's non-school task list to three items. Coursework remains
    // visible but does not use one of those slots.
    if (isToday) {
      const nonSchool = items
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.category !== 'academic');
      if (nonSchool.length > 3) {
        const completed = nonSchool.filter(({ item }) => item.done);
        const kept = new Set(completed.slice(0, 3).map(({ item }) => item));
        const free = Math.max(0, 3 - kept.size);
        const open = reserveNewProblem(
          nonSchool.filter(({ item }) => !item.done).sort((a, b) => rankOf(a.item) - rankOf(b.item) || a.idx - b.idx),
          free,
          items,
        );
        for (const { item } of open.slice(0, free)) kept.add(item);
        const droppedTech = new Set(nonSchool.map(({ item }) => item).filter((item) => !kept.has(item) && (item.isTechnical || item.category === 'technical')));
        restoreDroppedTech(d, droppedTech);
        const filtered = items.filter((item) => item.category === 'academic' || kept.has(item));
        items.length = 0;
        items.push(...filtered);
      }
    }

    // 7. Enforce extracurricular technical-task cap and time constraints.
    // Mentor rule:
    // - Normal day: maximum 3 extracurricular technical items (ceiling up to maxTechMin, default 180m).
    // - Genuinely free day (break): maximum 5 items ceiling (up to maxTechMin, default 300m) ONLY when the exception is enabled.
    // - Heavy coursework / pre-exam: max 1 item, up to 45m.
    // - Exam period: max 1 item deliberate override, up to 20m.
    // - Rest day (off): 0 items (strict rest, recovery, and reset).
    // Academic work is separate and NOT included in this cap.
    const allowFreeDayMax5 = s.allowFreeDayMax5 !== false && s.freeDayException !== false;
    let maxTech = load.maxTech !== undefined
      ? load.maxTech
      : (r.mode === 'break' ? (allowFreeDayMax5 ? 5 : 3) : r.mode === 'normal' ? 3 : (r.mode === 'heavy' || r.mode === 'exam') ? 1 : 0);
    if (r.mode === 'break' && !allowFreeDayMax5 && maxTech > 3) {
      maxTech = 3;
    }
    const maxTechMin = load.maxTechMin !== undefined ? load.maxTechMin : (r.mode === 'break' ? 300 : r.mode === 'normal' ? 180 : r.mode === 'heavy' ? 45 : r.mode === 'exam' ? 20 : 0);

    const techItems = items.filter((i) => i.isTechnical || i.category === 'technical');
    if (techItems.length > 0) {
      const doneTech = techItems.filter((i) => i.done);
      const doneTechMin = doneTech.reduce((sum, i) => sum + (i.min || 0), 0);
      let allowedSlots = Math.max(0, maxTech - doneTech.length);
      let allowedMin = Math.max(0, maxTechMin - doneTechMin);

      // Prioritize: revisit (protect spaced repetition recall) -> lesson (curriculum learning) -> problem (active DSA) -> module (project/systems & baseline) -> basics,
      // with one slot kept for a new problem so reviews never crowd out new DSA entirely.
      const rankOrder = { revisit: 0, lesson: 1, problem: 2, module: 3, basics: 4 };
      const openTech = reserveNewProblem(
        techItems
          .map((item, idx) => ({ item, idx }))
          .filter((x) => !x.item.done)
          .sort((a, b) => {
            const rA = rankOrder[a.item.type] ?? 10;
            const rB = rankOrder[b.item.type] ?? 10;
            return rA !== rB ? rA - rB : a.idx - b.idx;
          }),
        allowedSlots,
        items,
      );

      const keptTech = new Set(doneTech);
      const droppedTech = new Set();
      const seenTracks = new Set();

      for (const { item } of openTech) {
        const itemMin = Number(item.min) || 0;
        const isExtraTrackLesson = item.type === 'lesson' && item.trackId && seenTracks.has(item.trackId);
        const slotsNeeded = isExtraTrackLesson ? 0 : 1;
        if (allowedSlots >= slotsNeeded && itemMin <= allowedMin) {
          keptTech.add(item);
          allowedSlots -= slotsNeeded;
          allowedMin -= itemMin;
          if (item.type === 'lesson' && item.trackId) {
            seenTracks.add(item.trackId);
          }
        } else {
          droppedTech.add(item);
        }
      }

      if (droppedTech.size > 0) {
        restoreDroppedTech(d, droppedTech);
        const filtered = items.filter((i) => !droppedTech.has(i));
        items.length = 0;
        items.push(...filtered);
      }
    }

    // Expect each review on the list to be done on its day, so the next step of
    // the ladder (and the one after) shows up on later days too.
    for (const i of items) {
      if (i.type !== 'revisit' || i.done || !i._src) continue;
      const next = applyOutcome(i._src, 'clean', d);
      schedule(toDay(next.nextReview), { ...next, projected: true });
    }

    if (d >= from && d < from + count) {
      days.push({ day: d, mode: r.mode, resolved: r, classes, items, minutes: items.reduce((sum, i) => sum + (i.min || 0), 0) });
    }
    // With a horizon, keep walking only until every track is finished.
    if (horizon && d >= from + count - 1 && tracks.every((tr) => !tr.queue.length)) break;
  }

  const trackFinish = {};
  for (const tr of tracks) trackFinish[tr.t.id] = tr.queue.length ? null : tr.finish;
  return { days, trackFinish, trackWindows: Object.fromEntries(tracks.map((tr) => [tr.t.id, tr.win])) };
}

/** What was completed on a past day, reconstructed from completion dates. */
export function historyDay(day, state, ctx) {
  const iso = toISO(day);
  const items = [];
  for (const t of state.tracks || []) {
    const done = (t.lessons || []).filter((l) => (state.lessonDone || {})[l.id] === iso);
    for (const g of groupLessons(done)) pushItem(items, lessonItem(t, g, iso, state.lessonDone || {}), day);
  }
  const byId = new Map((state.problems || []).map((p) => [p.id, p]));
  for (const e of state.dsaLog || []) {
    if (e.date !== iso || !e.problemId) continue;
    const p = byId.get(e.problemId) || { title: e.title, url: '' };
    const label = { alone: 'solved on your own', clean: 'done', over: 'over target time', hints: 'needed hints', failed: "couldn't solve" }[e.outcome] || '';
    if (e.kind === 'first') pushItem(items, { key: `problem:${e.problemId}`, type: 'problem', category: 'technical', isTechnical: true, problemId: e.problemId, title: `Solve ${p.title}`, meta: label, url: p.url, done: true, scheduledDate: iso }, day);
    else pushItem(items, { key: `revisit:${e.problemId}`, type: 'revisit', category: 'technical', isTechnical: true, problemId: e.problemId, title: e.prev ? reviewTask(e.prev).title : `Review ${p.title}`, meta: label, url: p.url, done: true, scheduledDate: iso }, day);
  }
  for (const [mid, prog] of Object.entries(state.progress || {})) {
    for (const task of ['objective', 'exit']) {
      if ((prog.taskDates || {})[task] === iso) {
        if (mid === 'W1' && task === 'objective') {
          pushItem(items, {
            id: 'baseline:dsa',
            key: 'baseline:dsa',
            type: 'module',
            category: 'technical',
            isTechnical: true,
            moduleId: 'W1',
            task: 'objective',
            title: DSA_BASELINE_TITLE,
            desc: DSA_BASELINE_DESC,
            done: true,
            scheduledDate: iso,
          }, day);
          continue;
        }
        const mod = (state.modules || []).find((m) => m.id === mid);
        if (mod) {
          const isTechMod = ['dsa', 'project', 'cs', 'interview', 'systems'].includes(mod.track);
          pushItem(items, { key: `module:${mid}:${task}`, type: 'module', category: isTechMod ? 'technical' : (mod.track || 'roadmap'), isTechnical: isTechMod, moduleId: mid, task, title: `${mod.id} · ${mod.title}${task === 'exit' ? ' (exit task)' : ''}`, desc: task === 'exit' ? mod.exit : mod.objective, done: true, scheduledDate: iso }, day);
        }
      }
    }
  }
  for (const [key, v] of Object.entries(state.checks || {})) {
    if (v !== iso) continue;
    if (key === 'baseline:dsa' || key === 'kickoff:k2') {
      pushItem(items, {
        id: 'baseline:dsa',
        key: 'baseline:dsa',
        type: 'module',
        category: 'technical',
        isTechnical: true,
        moduleId: 'W1',
        task: 'objective',
        title: DSA_BASELINE_TITLE,
        desc: DSA_BASELINE_DESC,
        done: true,
        scheduledDate: iso,
      }, day);
    } else if (key.startsWith('kickoff:')) {
      const i = CHECKLISTS.kickoff.items.find((x) => `kickoff:${x.id}` === key);
      if (i) {
        const isTech = i.id === 'k2' || i.id === 'k4';
        pushItem(items, { key, type: 'kickoff', category: isTech ? 'technical' : 'career', isTechnical: isTech, title: i.text, done: true, scheduledDate: iso }, day);
      }
    } else if (key.startsWith(`revise:${iso}:`)) {
      const code = key.split(':').slice(2).join(':');
      const bm = code.match(/^basics:(\d+)$/);
      const bt = bm && BASICS.topics[Number(bm[1])];
      pushItem(items, { key, type: bt ? 'basics' : 'revise', category: bt ? 'technical' : 'academic', isTechnical: Boolean(bt), title: bt ? `${bt.name}: Revisit this topic` : `Revise ${code}`, done: true, scheduledDate: iso }, day);
    } else if (key.startsWith('academic:')) {
      const taskId = key.split(':')[1];
      const task = ((state.academic && state.academic.studyTasks) || []).find((t) => t.id === taskId);
      pushItem(items, {
        key,
        type: 'academic',
        category: 'academic',
        isTechnical: false,
        title: task ? task.title : 'Academic study task',
        desc: task ? task.desc : '',
        meta: task ? task.courseCode : 'Academics',
        done: true,
        scheduledDate: iso,
      }, day);
    } else if (key.startsWith('career:') || key.startsWith('app:')) {
      pushItem(items, { key, type: 'career', category: 'career', isTechnical: false, title: key.startsWith('career:') ? 'Checked new openings and deadlines' : 'Application next action', done: true, scheduledDate: iso }, day);
    }
  }
  return { day, mode: resolveDay(day, ctx).mode, items, minutes: 0, past: true, classes: classesOn(day, ctx) };
}