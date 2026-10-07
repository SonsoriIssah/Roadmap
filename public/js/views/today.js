import { h, card, cardHeader, button, chip, progressBar, toast } from '../ui.js';
import { MODES, RITUALS } from '../data/defaults.js';
import { fmtDay, fmtRange, relDays, weekKey, weekStart, fromMin, fmtDuration, WEEKDAYS_LONG, weekdayIndex, parts, toISO, toDay, isISODate } from '../dates.js';
import { reviewTask, stageOf, STAGE_LABEL } from '../problems.js';
import { resolveDay, activeRituals, upcoming, decisionHints } from '../engine.js';
import { modeChip, modeReason, weekOverrideControl, banner } from './common.js';
import { planFor, taskList, openProblemImport, trackSummary } from './tasks.js';

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function render(app) {
  const { today, ctx } = app;
  const r = resolveDay(today, ctx);
  const res = planFor(app, today, 2, { horizon: 90 });
  const [day, tomorrow] = res.days;

  return h(
    'div',
    { class: 'stack' },
    header(today, r),
    ritualCards(app),
    hintCards(app),
    yesterdayCard(app),
    todayCard(app, day),
    importPrompt(app),
    tomorrowCard(app, tomorrow),
    weekCard(app, r),
    trackCards(app, res),
    upcomingCard(app),
    backupNudge(app),
  );
}

function header(today, r) {
  const { y, m, d } = parts(today);
  return h(
    'header',
    { class: 'page-head' },
    h('div', null, h('p', { class: 'eyebrow' }, WEEKDAYS_LONG[weekdayIndex(today)]), h('h1', null, `${d} ${MONTHS_LONG[m]} ${y}`)),
    modeChip(r.mode, MODES[r.mode].label),
  );
}

function todayCard(app, day) {
  const done = day.items.filter((i) => i.done).length;
  const left = day.items.filter((i) => !i.done).reduce((s, i) => s + (i.min || 0), 0);
  const iso = toISO(app.today);
  const listed = new Set(day.items.filter((i) => i.type === 'problem').map((i) => i.problemId));
  const moreProblems = app.state.problems.some((p) => p.status === 'new' && !listed.has(p.id));
  const more = (key) => {
    if (key === 'problems' && !moreProblems) return toast(app.state.problems.length ? 'Every problem in your bank is already started. Import more or add one in Track → Problems.' : 'Import your DSA sheet first (Track → Problems).');
    app.update((s) => {
      const e = (s.extra[iso] = s.extra[iso] || {});
      e[key] = (Number(e[key]) || 0) + 1;
    });
  };
  return card(
    cardHeader("Today's list", h('span', { class: 'small muted' }, `${done}/${day.items.length} done`), day.items.length ? `${fmtDuration(day.minutes)} planned · ${fmtDuration(left)} left` : null),
    day.items.length ? progressBar(done / day.items.length, "Today's progress") : null,
    day.classes.length
      ? h('div', { class: 'lectures' }, h('span', { class: 'small muted' }, 'Lectures: '), day.classes.map((c) => chip(`${fromMin(c.s)} ${c.code}`, { title: `${c.title} · ${c.venue || ''}` })))
      : null,
    taskList(app, day, { interactive: true }),
    day.mode !== 'off' && day.mode !== 'exam'
      ? h('div', { class: 'row-actions wrap' }, h('span', { class: 'small muted' }, 'Finished early?'), button('+1 problem', () => more('problems'), { kind: 'ghost', size: 'sm' }), (app.state.tracks || []).some((t) => t.active !== false) ? button('+ next lesson', () => more('lessons'), { kind: 'ghost', size: 'sm' }) : null)
      : null,
  );
}

/** The day-after check: what you ticked yesterday and when each comes back. */
function yesterdayCard(app) {
  const y = toISO(app.today - 1);
  const entries = app.state.dsaLog.filter((e) => e.date === y && e.problemId);
  if (!entries.length || app.state.dismissed[`yesterday:${y}`]) return null;
  const byId = new Map(app.state.problems.map((p) => [p.id, p]));
  const latest = new Map();
  for (const e of entries) latest.set(e.problemId, e);
  const rows = [...latest.values()].map((e) => ({ e, p: byId.get(e.problemId) })).filter((x) => x.p);
  const solved = rows.filter((x) => ['alone', 'clean', 'over'].includes(x.e.outcome)).length;
  return card(
    cardHeader('Yesterday', button('Hide', () => app.update((s) => { s.dismissed[`yesterday:${y}`] = true; }), { kind: 'ghost', size: 'sm' }), `${solved} of ${rows.length} problems solved — reviews booked`),
    h(
      'ul',
      { class: 'list' },
      rows.map(({ p }) =>
        h(
          'li',
          { class: 'list-row stacked' },
          h('span', null, p.title, h('span', { class: 'small muted' }, ` · ${STAGE_LABEL[stageOf(p)]}`)),
          isISODate(p.nextReview) ? h('span', { class: 'small review-when' }, `Review ${fmtDay(toDay(p.nextReview))} (${relDays(toDay(p.nextReview), app.today)}): ${reviewTask(p).step}`) : null,
        ),
      ),
    ),
  );
}

function tomorrowCard(app, day) {
  if (!day) return null;
  return h(
    'details',
    { class: 'card disclosure' },
    h('summary', null, h('span', null, `Tomorrow · ${fmtDay(day.day)} · ${day.items.length} items`), modeChip(day.mode)),
    h('div', { class: 'disclosure-body' }, taskList(app, day)),
  );
}

function importPrompt(app) {
  if (app.state.problems.length) return null;
  return banner('info', 'Import your DSA sheet', 'Your list says “Solve …” with real problem names once your sheet is imported. From Google Sheets: File → Download → Microsoft Excel (.xlsx).', [
    button('Import sheet', () => openProblemImport(app), { kind: 'primary', size: 'sm', iconName: 'upload' }),
  ]);
}

function weekCard(app, r) {
  const ws = weekStart(app.today);
  return card(
    cardHeader('This week', null, fmtRange(ws, ws + 6)),
    h('div', { class: 'mode-summary', dataset: { mode: r.mode } }, h('div', { class: 'mode-big' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), MODES[r.mode].label), h('p', { class: 'muted small' }, modeReason(r, app.today))),
    h('div', { class: 'override' }, h('p', { class: 'small muted' }, 'Busier or freer than the calendar says? Adjust this week:'), weekOverrideControl(app, ws)),
  );
}

function trackCards(app, res) {
  return (app.state.tracks || [])
    .filter((t) => t.active !== false && t.lessons.length)
    .map((t) => {
      const sum = trackSummary(app, t, res.trackFinish[t.id], res.trackWindows[t.id]);
      return h(
        'section',
        { class: 'card clickable', onclick: () => app.nav('plan/learn'), role: 'button', tabindex: 0 },
        h('div', { class: 'card-head' }, h('div', null, h('h2', { class: 'card-title' }, `${t.name} · ${sum.done}/${sum.total} lessons`), h('p', { class: ['card-sub', sum.late && 'warn-text'] }, sum.status))),
        progressBar(sum.total ? sum.done / sum.total : 0, `${t.name} progress`),
      );
    });
}

function ritualCards(app) {
  const list = activeRituals(app.today, app.ctx, app.state).filter((rt) => rt.type !== 'weekly' || weekdayIndex(app.today) === 6);
  if (!list.length) return null;
  return list.map((rt) => {
    const def = RITUALS[rt.type];
    const dismiss = () =>
      app.update((s) => {
        s.dismissed[rt.key] = true;
      });
    if (rt.type === 'noTimetable') {
      return banner('warning', 'No timetable for this teaching period', `${rt.detail || 'Classes have started'} — add your class schedule so your list includes revising each day's lectures.`, [
        button('Add timetable', () => app.nav('schedule/timetable'), { kind: 'primary', size: 'sm' }),
        button('Not now', dismiss, { kind: 'ghost', size: 'sm' }),
      ]);
    }
    let detail = '';
    if (rt.type === 'exam' && rt.detail) detail = `${rt.detail.title} until ${fmtDay(rt.detail.e)}. New topics are paused; your list is course revision.`;
    if (rt.type === 'preExam') detail = `${rt.detail.title} start ${relDays(rt.detail.s, app.today)}.`;
    if (rt.type === 'interview') detail = `${[rt.detail.app.company, rt.detail.app.role].filter(Boolean).join(' · ')} ${relDays(rt.detail.day, app.today)}.`;
    if (rt.type === 'semesterEnd') detail = `${rt.detail.title} ended ${relDays(rt.detail.e, app.today)}.`;
    const tone = { exam: 'critical', preExam: 'warning', interview: 'warning', semesterEnd: 'info', monthEnd: 'info', weekly: 'info' }[rt.type];
    const actions = [];
    if (rt.type === 'weekly') actions.push(button('Rate this week', () => app.nav('track/score'), { kind: 'primary', size: 'sm' }));
    if (rt.type === 'monthEnd') actions.push(button('Write review', () => app.nav('track/evidence'), { kind: 'primary', size: 'sm' }));
    if (rt.type === 'interview') actions.push(button('Open tracker', () => app.nav('track/apps'), { kind: 'primary', size: 'sm' }));
    actions.push(button('Dismiss', dismiss, { kind: 'ghost', size: 'sm' }));
    return banner(tone, `${def.title}${def.from ? ` · ${def.from}` : ''}`, h('div', null, detail && h('p', null, detail), h('ul', { class: 'tight' }, def.items.map((t) => h('li', null, t)))), actions);
  });
}

function hintCards(app) {
  const hints = decisionHints(app.state.scorecards, app.today);
  if (!hints.length) return null;
  return hints.map((x) => banner(x.tone, 'From your scorecard', x.text, x.rule === 5 ? [button('Mark week heavy', () => app.update((s) => { s.weekOverrides[weekKey(app.today)] = 'heavy'; }), { kind: 'primary', size: 'sm' })] : null));
}

function upcomingCard(app) {
  const items = upcoming(app.today, app.ctx, app.state, 30);
  if (!items.length) return null;
  return card(
    cardHeader('Coming up', null, 'Next 30 days'),
    h(
      'ul',
      { class: 'list' },
      items.slice(0, 8).map((i) =>
        h(
          'li',
          { class: ['list-row', i.type === 'app' && 'clickable'], onclick: i.type === 'app' ? () => app.nav('track/apps') : null },
          h('span', { class: ['date-pill', `tone-${i.tone}`] }, i.overdue ? 'Overdue' : relDays(i.day, app.today)),
          h('span', { class: 'grow' }, i.label, i.endDay ? h('span', { class: 'muted small' }, ` · until ${fmtDay(i.endDay)}`) : null),
        ),
      ),
    ),
  );
}

function backupNudge(app) {
  const meta = app.state.meta || {};
  const last = meta.lastBackupAt ? Date.parse(meta.lastBackupAt) : null;
  const created = meta.createdAt ? Date.parse(meta.createdAt) : Date.now();
  const days = (Date.now() - (last || created)) / 86400000;
  if (days < (last ? 30 : 14)) return null;
  return banner('info', last ? `Last backup ${Math.floor(days)} days ago` : 'Back up your progress', 'Your data lives only on this device. Export a backup file now and then.', [button('Back up', () => app.nav('settings'), { kind: 'secondary', size: 'sm', iconName: 'download' })]);
}
