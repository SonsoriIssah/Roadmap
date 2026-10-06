import { h, card, cardHeader, checkbox, button, chip, progressBar, icon, toast } from '../ui.js';
import { MODES, RITUALS, CHECKLISTS, PHASES, TRACKS } from '../data/defaults.js';
import { fmtDay, fmtRange, relDays, weekStart, weekKey, fromMin, fmtDuration, WEEKDAYS_LONG, weekdayIndex, parts } from '../dates.js';
import { resolveDay, classesOn, planWeek, activeRituals, upcoming, dueReviews, moduleState, relatedCourses, decisionHints, eventsOn } from '../engine.js';
import { modeChip, modeReason, weekOverrideControl, sessionText, isSessionDone, toggleSession, banner, dayBar, moduleForDay, setModuleTask } from './common.js';

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function render(app) {
  const { today, ctx } = app;
  const r = resolveDay(today, ctx);
  const ws = weekStart(today);
  const plan = planWeek(ws, ctx);

  return h(
    'div',
    { class: 'stack' },
    header(app, today, r),
    weekCard(app, r, plan),
    ritualCards(app),
    hintCards(app),
    todayCard(app, plan),
    moduleCard(app),
    kickoffCard(app),
    revisitCard(app),
    upcomingCard(app),
    backupNudge(app),
  );
}

function header(app, today, r) {
  const { y, m, d } = parts(today);
  return h(
    'header',
    { class: 'page-head' },
    h('div', null, h('p', { class: 'eyebrow' }, WEEKDAYS_LONG[weekdayIndex(today)]), h('h1', null, `${d} ${MONTHS_LONG[m]} ${y}`)),
    modeChip(r.mode, MODES[r.mode].label),
  );
}

function weekCard(app, r, plan) {
  const { today } = app;
  const info = plan.info;
  const mode = info.dominant;
  const reason = modeReason(r, today);
  const next = nextMilestones(app, 3);
  return card(
    cardHeader('This week', null, fmtRange(info.start, info.start + 6)),
    h(
      'div',
      { class: 'mode-summary', dataset: { mode } },
      h('div', { class: 'mode-big' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), MODES[mode].label),
      h('div', { class: 'mode-meta' }, h('span', null, `Target ${MODES[mode].hours} of career prep`), h('span', { class: 'muted' }, ` · ${fmtDuration(plan.totalMin)} planned`)),
      h('p', { class: 'muted small' }, reason),
    ),
    h('div', { class: 'override' }, h('p', { class: 'small muted' }, 'Coursework heavier or lighter than the calendar says? Adjust this week:'), weekOverrideControl(app, info.start)),
    next.length ? h('div', { class: 'chips-row' }, next.map((n) => chip(`${n.label} ${relDays(n.day, today)}`, { tone: n.tone }))) : null,
  );
}

function nextMilestones(app, n) {
  const { today, ctx } = app;
  const out = [];
  for (const ev of ctx.cal) {
    if (ev.kind === 'semester' || ev.kind === 'milestone' || ev.kind === 'admin') continue;
    if (ev.s > today) out.push({ day: ev.s, label: shortTitle(ev), tone: ev.kind === 'exam' || ev.kind === 'midsem' ? 'critical' : ev.kind === 'break' ? 'good' : 'info' });
  }
  return out.sort((a, b) => a.day - b.day).slice(0, n);
}

function shortTitle(ev) {
  const map = { teaching: 'Teaching', midsem: 'Mid-sems', exam: 'Exams', break: ev.title.replace(/ break$/i, '') + ' break' };
  return map[ev.kind] || ev.title;
}

function ritualCards(app) {
  const list = activeRituals(app.today, app.ctx, app.state);
  if (!list.length) return null;
  return list.map((rt) => {
    const def = RITUALS[rt.type];
    const dismiss = () =>
      app.update((s) => {
        s.dismissed[rt.key] = true;
      });
    if (rt.type === 'noTimetable') {
      return banner('warning', 'No timetable for this teaching period', `${rt.detail || 'Classes have started'} — add your class schedule so study sessions avoid your lectures.`, [
        button('Add timetable', () => app.nav('schedule/timetable'), { kind: 'primary', size: 'sm' }),
        button('Not now', dismiss, { kind: 'ghost', size: 'sm' }),
      ]);
    }
    let detail = '';
    if (rt.type === 'exam' && rt.detail) detail = `${rt.detail.title} until ${fmtDay(rt.detail.e)}. New modules are paused.`;
    if (rt.type === 'preExam') detail = `${rt.detail.title} start ${relDays(rt.detail.s, app.today)}.`;
    if (rt.type === 'interview') detail = `${[rt.detail.app.company, rt.detail.app.role].filter(Boolean).join(' · ')} ${relDays(rt.detail.day, app.today)}.`;
    if (rt.type === 'semesterEnd') detail = `${rt.detail.title} ended ${relDays(rt.detail.e, app.today)}.`;
    const tone = { exam: 'critical', preExam: 'warning', interview: 'warning', semesterEnd: 'info', monthEnd: 'info', weekly: 'info' }[rt.type];
    const actions = [];
    if (rt.type === 'weekly') actions.push(button('Rate this week', () => app.nav('track/score'), { kind: 'primary', size: 'sm' }));
    if (rt.type === 'monthEnd') actions.push(button('Write review', () => app.nav('track/evidence'), { kind: 'primary', size: 'sm' }));
    if (rt.type === 'interview') actions.push(button('Open tracker', () => app.nav('track/apps'), { kind: 'primary', size: 'sm' }));
    actions.push(button('Dismiss', dismiss, { kind: 'ghost', size: 'sm' }));
    return banner(
      tone,
      `${def.title}${def.from ? ` · ${def.from}` : ''}`,
      h('div', null, detail && h('p', null, detail), h('ul', { class: 'tight' }, def.items.map((t) => h('li', null, t)))),
      actions,
    );
  });
}

function hintCards(app) {
  const hints = decisionHints(app.state.scorecards, app.today);
  if (!hints.length) return null;
  return hints.map((x) => banner(x.tone, 'From your scorecard', x.text, x.rule === 5 ? [button('Mark week heavy', () => app.update((s) => { s.weekOverrides[weekKey(app.today)] = 'heavy'; }), { kind: 'primary', size: 'sm' })] : null));
}

function todayCard(app, plan) {
  const { today, ctx } = app;
  const classes = classesOn(today, ctx);
  const ws = plan.info.start;
  const sessions = plan.sessions.filter((s) => s.day === today).map((s) => ({ ...s, done: isSessionDone(app, ws, s.idx) }));
  const items = [
    ...classes.map((c) => ({ t: c.s, node: classItem(c) })),
    ...sessions.map((s) => ({ t: s.s, node: sessionItem(app, ws, s) })),
  ].sort((a, b) => a.t - b.t);

  const missed = plan.sessions.filter((s) => s.day < today && !isSessionDone(app, ws, s.idx));
  const doneCount = plan.sessions.filter((s) => isSessionDone(app, ws, s.idx)).length;
  const dayEvents = eventsOn(today, ctx.cal).filter((e) => e.kind === 'milestone' || (e.kind === 'admin' && (e.s === today || e.e === today)));

  return card(
    cardHeader('Today', h('span', { class: 'small muted' }, `${doneCount}/${plan.sessions.length} sessions this week`)),
    dayEvents.length ? h('div', { class: 'chips-row' }, dayEvents.map((e) => chip(e.title, { tone: 'info' }))) : null,
    classes.length || sessions.length ? dayBar(classes, sessions, app.state.settings) : null,
    items.length
      ? h('ol', { class: 'agenda' }, items.map((i) => i.node))
      : h('p', { class: 'muted' }, plan.sessions.length ? 'Nothing planned today. Rest, or pick up a missed session below.' : `${MODES[plan.info.dominant].label}: no study sessions planned this week.`),
    missed.length
      ? h(
          'details',
          { class: 'missed' },
          h('summary', null, `${missed.length} earlier session${missed.length > 1 ? 's' : ''} not done this week`),
          h('ol', { class: 'agenda' }, missed.map((s) => sessionItem(app, ws, { ...s, done: false }, true))),
        )
      : null,
    plan.unplaced.length ? h('p', { class: 'small warn-text' }, `${plan.unplaced.length} session(s) did not fit your free time this week. Widen your study window in Settings.`) : null,
  );
}

function classItem(c) {
  return h(
    'li',
    { class: 'agenda-item class' },
    h('span', { class: 'agenda-time' }, fromMin(c.s), h('small', null, fromMin(c.e))),
    h('div', { class: 'agenda-body' }, h('strong', null, `${c.code} · ${c.title}`), h('span', { class: 'muted small' }, [c.venue, c.lecturer].filter(Boolean).join(' · '))),
  );
}

function sessionItem(app, ws, s, showDay = false) {
  const mod = moduleForDay(app, s.day);
  const t = sessionText(s.kind, mod, app);
  return h(
    'li',
    { class: ['agenda-item', 'study', `k-${s.kind}`, s.done && 'done'] },
    h('span', { class: 'agenda-time' }, showDay ? fmtDay(s.day).split(' ')[0] : fromMin(s.s), h('small', null, fmtDuration(s.min))),
    h('div', { class: 'agenda-body' }, checkbox(s.done, (v) => toggleSession(app, ws, s.idx, v), h('strong', null, t.title), { sub: t.desc })),
  );
}

function moduleCard(app) {
  const mod = app.current;
  if (!mod) {
    return card(cardHeader('Roadmap complete'), h('p', null, 'Every module is done or skipped. Run your retrospective and build the next plan from evidence.'), button('Open plan', () => app.nav('plan'), { kind: 'secondary' }));
  }
  const st = moduleState(mod, app.state.progress);
  const tasks = (app.state.progress[mod.id] || {}).tasks || {};
  const fc = app.fc.byId[mod.id];
  const courses = relatedCourses(mod, app.ctx, app.today);
  const setTask = (key, v) => setModuleTask(app, mod.id, key, v);
  const doneCount = app.state.modules.filter((m) => moduleState(m, app.state.progress).done).length;
  return card(
    cardHeader(`${mod.id} · ${mod.title}`, chip(TRACKS[mod.track] || mod.track), `${PHASES[mod.phase] ? `${PHASES[mod.phase].span} ${PHASES[mod.phase].name}` : 'Custom'}${fc ? ` · planned ${fmtRange(fc.start, fc.end)}` : ''}`),
    progressBar(st.fraction, 'Module progress'),
    h(
      'div',
      { class: 'tasks' },
      checkbox(!!tasks.objective, (v) => setTask('objective', v), h('span', null, h('span', { class: 'task-label' }, 'Objective'), mod.objective)),
      checkbox(!!tasks.exit, (v) => {
        setTask('exit', v);
        if (v && tasks.objective) toast(`${mod.id} complete. Forecast updated.`);
      }, h('span', null, h('span', { class: 'task-label' }, 'Exit task'), mod.exit)),
    ),
    courses.length ? h('p', { class: 'synergy' }, icon('book', { size: 16 }), ` Overlaps with ${courses.map((c) => c.code).join(', ')} — study them together.`) : null,
    h('div', { class: 'card-foot' }, h('span', { class: 'small muted' }, `${doneCount} of ${app.state.modules.length} modules done`), button('Full plan', () => app.nav('plan'), { kind: 'ghost', size: 'sm', iconName: 'chevR' })),
  );
}

function kickoffCard(app) {
  const list = CHECKLISTS.kickoff;
  const checks = app.state.checks;
  const done = list.items.filter((i) => checks[`kickoff:${i.id}`]).length;
  if (done === list.items.length || app.state.dismissed.kickoff) return null;
  return card(
    cardHeader(list.title, button('Hide', () => app.update((s) => { s.dismissed.kickoff = true; }), { kind: 'ghost', size: 'sm' }), `${done}/${list.items.length} · establish evidence before starting anything new`),
    h(
      'div',
      { class: 'tasks' },
      list.items.map((i, n) =>
        checkbox(!!checks[`kickoff:${i.id}`], (v) => app.update((s) => { s.checks[`kickoff:${i.id}`] = v; }), h('span', null, h('span', { class: 'task-label' }, `Day ${n + 1}`), i.text)),
      ),
    ),
  );
}

function revisitCard(app) {
  const due = dueReviews(app.state.dsaLog, app.today);
  if (!due.length) return null;
  return card(
    cardHeader('DSA revisits due', button('Open log', () => app.nav('track/dsa'), { kind: 'ghost', size: 'sm', iconName: 'chevR' })),
    h('ul', { class: 'list' }, due.slice(0, 4).map((p) => h('li', { class: 'list-row' }, h('span', null, p.title), chip(p.pattern || 'Other')))),
    due.length > 4 ? h('p', { class: 'small muted' }, `+${due.length - 4} more`) : null,
  );
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
