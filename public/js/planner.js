// Day-by-day task lists. Starting from today, the planner walks forward one
// day at a time and hands out work from queues (lessons, problems, first-week
// tasks), so tomorrow's list continues where today's leaves off and anything
// you skip simply rolls forward. Pure — no DOM or storage.

import { toISO, toDay, isISODate, weekKey, weekdayIndex, fmtDay } from './dates.js';
import { resolveDay, classesOn, timetableOn } from './engine.js';
import { CHECKLISTS, DEFAULT_SETTINGS } from './data/defaults.js';
import { orderNew, dueProblems, reviewTask, reviewGap, stageOf, targetMinutes, STAGE_LABEL } from './problems.js';
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

/** Highest priority first. Lower number = kept first when a day is over the cap. */
const RANK = { revisit: 0, problem: 1, lesson: 2, revise: 3, academic: 3, career: 4, kickoff: 5, module: 6, personal: 7 };
const rankOf = (i) => (i.basics ? 2.5 : RANK[i.type] ?? 99);
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
      category: 'learning',
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
    category: 'learning',
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
  const maxPerDay = Math.max(1, Math.floor(Number(s.maxPerDay)) || 3);

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
  for (const p of problems) {
    if (p.status === 'new' || !isISODate(p.nextReview)) continue;
    const d = toDay(p.nextReview);
    if (d > today) schedule(d, p);
  }
  let overflow = [];
  const nextLabel = (p) => (isISODate(p.nextReview) ? `Review ${fmtDay(toDay(p.nextReview))}: ${reviewTask(p).step}` : '');

  // --- First-week tasks ------------------------------------------------------
  const kick = state.dismissed && state.dismissed.kickoff ? [] : CHECKLISTS.kickoff.items;
  let kickQueue = kick.filter((i) => !checks[`kickoff:${i.id}`]);
  const kickToday = kick.filter((i) => doneOn(checks[`kickoff:${i.id}`], iso0));
  
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
        category: 'dsa',
        problemId: p.id,
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
        category: 'dsa',
        problemId: p.id,
        title: `Solve ${p.title}`,
        meta: [p.difficulty, p.pattern || p.topic, p.priority !== null && p.priority !== undefined ? `P${p.priority}` : ''].filter(Boolean).join(' · '),
        url: p.url,
        min: targetMinutes(p) + 10,
        done,
        next: done ? nextLabel(p) : '',
      });
    }

    // 4. Roadmap module step
    if (load.module > 0 && mod) {
      const prog = (state.progress || {})[mod.id] || {};
      const tasks = prog.tasks || {};
      const dates = prog.taskDates || {};
      let task = null;
      let done = false;
      if (isToday && dates.exit === iso0) [task, done] = ['exit', true];
      else if (isToday && dates.objective === iso0 && !tasks.exit) [task, done] = ['objective', true];
      else if (!tasks.objective) task = 'objective';
      else if (!tasks.exit) task = 'exit';
      if (task) {
        items.push({ key: `module:${mod.id}:${task}`, type: 'module', category: mod.track || 'project', moduleId: mod.id, task, title: `${mod.id} · ${mod.title}${task === 'exit' ? ' (exit task)' : ''}`, desc: task === 'exit' ? mod.exit : mod.objective, meta: mod.track === 'dsa' ? 'Your problems today count toward this' : '', min: load.module, done });
      }
    }

    // 5. First-week tasks
    if (load.kickoff > 0 || (isToday && kickToday.length)) {
      const chosen = isToday ? [...kickToday] : [];
      while (kickQueue.length && chosen.length < load.kickoff + (isToday ? kickToday.length : 0)) chosen.push(kickQueue.shift());
      for (const i of chosen) items.push({ key: `kickoff:${i.id}`, type: 'kickoff', category: 'kickoff', title: i.text, meta: 'First-week task', min: 45, done: doneOn(checks[`kickoff:${i.id}`], iso) });
    }

    // 6. Coursework revision and university study
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
        items.push({
          key: `revise:${iso}:${c.code}`,
          type: 'revise',
          category: 'academic',
          courseCode: c.code,
          title: `Revise ${c.code} · ${c.title.replace(/\s*\(combined\)\s*$/i, '')}`,
          desc: javaish ? "Rewrite today's lecture examples in code, then add one variation of your own." : "Go over today's notes and write three questions an exam could ask.",
          meta: 'Coursework',
          min: load.lecture,
          done: doneOn(checks[`revise:${iso}:${c.code}`], iso),
        });
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
          items.push({
            key: `revise:${iso}:${c.code}`,
            type: 'revise',
            category: 'academic',
            courseCode: c.code,
            title: `Revise ${c.code} · ${c.title}`,
            desc,
            meta: r.mode === 'exam' ? 'Exam prep' : 'Revision',
            min: load.rotateMin,
            done: doneOn(checks[`revise:${iso}:${c.code}`], iso),
          });
        }
      }
    }

    // 6c. Scheduled university study sessions & academic deadlines
    if (inSem1 && state.academic && Array.isArray(state.academic.studyTasks)) {
      for (const t of state.academic.studyTasks) {
        if (t.date === iso) {
          items.push({
            key: `academic:${t.id}`,
            type: 'academic',
            category: 'academic',
            taskId: t.id,
            courseCode: t.courseCode || '',
            title: t.title,
            desc: t.desc || '',
            meta: [t.courseCode, t.topic || t.meta || 'Study session'].filter(Boolean).join(' · '),
            min: Number(t.min) || 45,
            done: doneOn(checks[`academic:${t.id}`], iso),
          });
        }
      }
    }

    // 6d. Fundamentals revisit on Upsoma (rotates one topic a day)
    if (basicsOn && r.mode !== 'off' && r.mode !== 'exam') {
      const n = BASICS.topics.length;
      const idx = isToday && basicsDoneToday ? Number(basicsDoneToday[0].split(':').pop()) : (basicsBase + (d - today)) % n;
      const t = BASICS.topics[idx];
      if (t) {
        const key = `revise:${iso}:basics:${idx}`;
        items.push({
          key,
          type: 'basics',
          category: 'personal',
          basics: true,
          title: `${t.name}: Revisit this topic`,
          desc: t.area === 'python'
            ? 'Revisit it on Upsoma, then close the tab and write a short example from memory.'
            : 'Revisit it on Upsoma, then explain it aloud in two minutes with one example from your own projects.',
          meta: t.area === 'python' ? 'Python basics · Upsoma' : 'Software engineering · Upsoma',
          url: BASICS.url,
          min: 30,
          done: doneOn(checks[key], iso),
        });
      }
    }
    // 7. Applications
    if (r.mode !== 'off') {
      for (const a of state.applications || []) {
        if (['rejected', 'offer'].includes(a.status) || !isISODate(a.nextActionDate) || !a.nextAction) continue;
        const ad = toDay(a.nextActionDate);
        const key = `app:${a.id}:${a.nextActionDate}`;
        const doneDate = checks[key];
        if (isToday ? ad <= d && (!doneDate || doneOn(doneDate, iso)) : ad === d && !doneDate) {
          items.push({ key, type: 'career', category: 'career', appId: a.id, title: `${a.nextAction}`, meta: [a.company, a.role].filter(Boolean).join(' · ') + (ad < d ? ' · overdue' : ''), min: 20, done: doneOn(doneDate, iso) });
        }
      }
      if (weekdayIndex(d) === 5 && r.mode !== 'exam') {
        const key = `career:${weekKey(d)}`;
        items.push({ key, type: 'career', category: 'career', title: 'Check new openings and deadlines', meta: 'Careers pages, then update the tracker', min: 30, done: doneOn(checks[key], iso) });
      }
    }

    // 8. Cap: at most 3 open items for the 'personal' activities category only.
    // Do not apply this limit to academic studies, DSA, projects, career, or learning tasks.
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
    for (const g of groupLessons(done)) items.push(lessonItem(t, g, iso, state.lessonDone || {}));
  }
  const byId = new Map((state.problems || []).map((p) => [p.id, p]));
  for (const e of state.dsaLog || []) {
    if (e.date !== iso || !e.problemId) continue;
    const p = byId.get(e.problemId) || { title: e.title, url: '' };
    const label = { alone: 'solved on your own', clean: 'done', over: 'over target time', hints: 'needed hints', failed: "couldn't solve" }[e.outcome] || '';
    if (e.kind === 'first') items.push({ key: `problem:${e.problemId}`, type: 'problem', problemId: e.problemId, title: `Solve ${p.title}`, meta: label, url: p.url, done: true });
    else items.push({ key: `revisit:${e.problemId}`, type: 'revisit', problemId: e.problemId, title: e.prev ? reviewTask(e.prev).title : `Review ${p.title}`, meta: label, url: p.url, done: true });
  }
  for (const [mid, prog] of Object.entries(state.progress || {})) {
    for (const task of ['objective', 'exit']) {
      if ((prog.taskDates || {})[task] === iso) {
        const mod = (state.modules || []).find((m) => m.id === mid);
        if (mod) items.push({ key: `module:${mid}:${task}`, type: 'module', moduleId: mid, task, title: `${mod.id} · ${mod.title}${task === 'exit' ? ' (exit task)' : ''}`, desc: task === 'exit' ? mod.exit : mod.objective, done: true });
      }
    }
  }
  for (const [key, v] of Object.entries(state.checks || {})) {
    if (v !== iso) continue;
    if (key.startsWith('kickoff:')) {
      const i = CHECKLISTS.kickoff.items.find((x) => `kickoff:${x.id}` === key);
      if (i) items.push({ key, type: 'kickoff', title: i.text, done: true });
    } else if (key.startsWith(`revise:${iso}:`)) {
      const code = key.split(':').slice(2).join(':');
      const bm = code.match(/^basics:(\d+)$/);
      const bt = bm && BASICS.topics[Number(bm[1])];
      items.push({ key, type: bt ? 'basics' : 'revise', category: bt ? 'personal' : 'academic', title: bt ? `${bt.name}: Revisit this topic` : `Revise ${code}`, done: true });
    } else if (key.startsWith('academic:')) {
      const taskId = key.split(':')[1];
      const task = ((state.academic && state.academic.studyTasks) || []).find((t) => t.id === taskId);
      items.push({
        key,
        type: 'academic',
        category: 'academic',
        title: task ? task.title : 'Academic study task',
        desc: task ? task.desc : '',
        meta: task ? task.courseCode : 'Academics',
        done: true,
      });
    } else if (key.startsWith('career:') || key.startsWith('app:')) {
      items.push({ key, type: 'career', title: key.startsWith('career:') ? 'Checked new openings and deadlines' : 'Application next action', done: true });
    }
  }
  return { day, mode: resolveDay(day, ctx).mode, items, minutes: 0, past: true, classes: classesOn(day, ctx) };
}