// Pieces shared by several views.

import { h, chip, segmented, openSheet, field, input, select, textarea, formData, toast, icon, checkbox, button } from '../ui.js';
import { MODES, MODE_ORDER, SESSION_KINDS, TRACKS, PHASES, APP_STATUSES, ELIGIBILITY_CHECKS } from '../data/defaults.js';
import { fmtDay, fmtRange, relDays, weekKey, weekStart, fromMin, toDay, isISODate, toISO } from '../dates.js';
import { weekInfo, dateConflicts, dueReviews } from '../engine.js';
import { uid } from '../parse.js';

export function modeChip(mode, text) {
  return chip(text || (MODES[mode] ? MODES[mode].short : mode), { mode });
}

/** Why a day has the mode it has, in words. */
export function modeReason(r, today) {
  if (r.source === 'override') return 'Set manually for this week';
  if (r.source === 'preExam') return `${r.exam.title} start ${relDays(r.exam.s, today)}`;
  if (r.source === 'calendar') return r.period.title;
  return 'Outside every calendar period, so your default mode applies';
}

export function weekOverrideControl(app, ws) {
  const key = weekKey(ws);
  const cur = app.state.weekOverrides[key] || 'auto';
  const opts = [{ value: 'auto', label: 'Auto' }, ...MODE_ORDER.map((m) => ({ value: m, label: MODES[m].short, mode: m }))];
  return segmented(
    opts,
    cur,
    (v) => {
      app.update((s) => {
        if (v === 'auto') delete s.weekOverrides[key];
        else s.weekOverrides[key] = v;
      });
      toast(v === 'auto' ? 'Week follows the calendar again' : `Week set to ${MODES[v].label}. Forecast updated.`);
    },
    { label: 'Week mode', small: true },
  );
}

/** Module the forecast places on a given day (or the current one for today/past). */
export function moduleForDay(app, day) {
  if (day <= app.today) return app.current;
  const byId = app.fc.byId;
  for (const m of app.state.modules) {
    const r = byId[m.id];
    if (r && r.start <= day && day <= r.end) return m;
  }
  return app.current;
}

export function sessionText(kind, mod, app) {
  const label = SESSION_KINDS[kind] ? SESSION_KINDS[kind].label : kind;
  switch (kind) {
    case 'primary':
      return mod ? { title: `${mod.id} · ${mod.title}`, desc: mod.objective } : { title: label, desc: 'Roadmap complete. Plan the next quarter from your evidence.' };
    case 'revision':
      return { title: label, desc: mod ? mod.exit : 'Re-solve an older problem without notes.' };
    case 'dsa': {
      const due = dueReviews(app.state.dsaLog, app.today).length;
      return { title: label, desc: due ? `${due} problem${due > 1 ? 's' : ''} due for revisit in your DSA log.` : 'One unseen problem in a pattern you have covered, or revisit an old miss.' };
    }
    case 'project':
      return { title: label, desc: 'LedgerCore / aggregation API: failure tests, reproducible metrics, documentation.' };
    case 'career':
      return { title: label, desc: 'Check new openings and deadlines, update the tracker, take one next action.' };
    case 'recall':
      return { title: label, desc: 'Re-solve one old problem from memory. No new topics; exams come first.' };
    default:
      return { title: label, desc: '' };
  }
}

export function setModuleTask(app, id, key, value) {
  app.update((s) => {
    const p = (s.progress[id] = s.progress[id] || {});
    p.tasks = { ...(p.tasks || {}), [key]: value };
    if (p.tasks.objective && p.tasks.exit) {
      p.status = 'done';
      p.completedOn = p.completedOn || toISO(app.today);
    } else if (p.status === 'done') {
      delete p.status;
      delete p.completedOn;
    }
  });
}

export function setModuleStatus(app, id, status) {
  app.update((s) => {
    const p = (s.progress[id] = s.progress[id] || {});
    if (status === 'done') {
      p.status = 'done';
      p.tasks = { objective: true, exit: true };
      p.completedOn = toISO(app.today);
    } else if (status === 'skipped') {
      p.status = 'skipped';
    } else {
      delete p.status;
      delete p.completedOn;
      p.tasks = {};
    }
  });
}

export function isSessionDone(app, ws, idx) {
  const rec = app.state.sessionsDone[weekKey(ws)];
  return !!(rec && rec[idx]);
}

export function toggleSession(app, ws, idx, done) {
  app.update((s) => {
    const k = weekKey(ws);
    s.sessionsDone[k] = s.sessionsDone[k] || {};
    if (done) s.sessionsDone[k][idx] = true;
    else delete s.sessionsDone[k][idx];
  });
}

export function banner(tone, title, body, actions) {
  return h(
    'div',
    { class: ['banner', `tone-${tone}`], role: tone === 'critical' ? 'alert' : null },
    h('div', { class: 'banner-icon' }, icon(tone === 'info' || tone === 'good' ? 'info' : 'alert', { size: 18 })),
    h('div', { class: 'banner-body' }, h('strong', null, title), body && h('div', { class: 'banner-text' }, body), actions && h('div', { class: 'banner-actions' }, actions)),
  );
}

// ---------------------------------------------------------------------------
// Visual time bar for one day: classes (grey) and study sessions (accent).
// ---------------------------------------------------------------------------
export function dayBar(classes, sessions, settings) {
  const start = 360;
  const end = 1380;
  const span = end - start;
  const pos = (m) => `${((Math.max(start, Math.min(end, m)) - start) / span) * 100}%`;
  const width = (a, b) => `${((Math.min(end, b) - Math.max(start, a)) / span) * 100}%`;
  const ticks = [480, 720, 960, 1200];
  return h(
    'div',
    { class: 'daybar', 'aria-hidden': 'true' },
    ticks.map((t) => h('span', { class: 'daybar-tick', style: { left: pos(t) } }, h('i', null, fromMin(t).slice(0, 2)))),
    classes.map((c) => h('span', { class: 'daybar-block class', style: { left: pos(c.s), width: width(c.s, c.e) } })),
    sessions.map((s) => h('span', { class: ['daybar-block', 'study', `k-${s.kind}`, s.done && 'done'], style: { left: pos(s.s), width: width(s.s, s.e) } })),
  );
}

// ---------------------------------------------------------------------------
// Week-mode strip: one cell per week, coloured by dominant mode.
// ---------------------------------------------------------------------------
export function modeStrip(app, fromDay, toDayNum, { markers = [] } = {}) {
  const cells = [];
  const ws0 = weekStart(fromDay);
  const curWs = weekStart(app.today);
  let lastMonth = null;
  for (let ws = ws0; ws <= toDayNum; ws += 7) {
    const info = weekInfo(ws, app.ctx);
    const date = new Date(ws * 86400000);
    const month = date.getUTCMonth();
    const showMonth = month !== lastMonth;
    lastMonth = month;
    const mk = markers.find((m) => m.day >= ws && m.day < ws + 7);
    cells.push(
      h(
        'button',
        {
          type: 'button',
          class: ['strip-cell', ws === curWs && 'current', mk && 'marked'],
          dataset: { mode: info.dominant },
          title: `${fmtRange(ws, ws + 6)} · ${MODES[info.dominant].label}${info.override ? ' (manual)' : ''}${mk ? ` · ${mk.label}` : ''}`,
          'aria-label': `Week of ${fmtDay(ws)}: ${MODES[info.dominant].label}`,
          onclick: () => {
            app.ui.weekOffset = (ws - curWs) / 7;
            app.nav('schedule/week');
          },
        },
        showMonth && h('span', { class: 'strip-month' }, date.toLocaleString('en', { month: 'short', timeZone: 'UTC' })),
      ),
    );
  }
  return h(
    'div',
    { class: 'strip-wrap' },
    h('div', { class: 'strip', role: 'group', 'aria-label': 'Weeks coloured by workload mode' }, cells),
    h(
      'div',
      { class: 'legend' },
      ['normal', 'heavy', 'exam', 'break'].map((m) => h('span', { class: 'legend-item', dataset: { mode: m } }, h('span', { class: 'swatch' }), `${MODES[m].short} · ${MODES[m].hours}`)),
    ),
  );
}

// ---------------------------------------------------------------------------
// Module editor
// ---------------------------------------------------------------------------
export function openModuleEditor(app, mod) {
  const isNew = !mod;
  const m = mod || { id: '', title: '', objective: '', exit: '', track: 'dsa', phase: 'p4', weight: 1, keywords: [] };
  openSheet({
    title: isNew ? 'Add module' : `Edit ${m.id}`,
    submitLabel: isNew ? 'Add' : 'Save',
    body: h(
      'div',
      { class: 'form-grid' },
      field('Title', input({ name: 'title', value: m.title, required: true, placeholder: 'e.g. Tries and prefix search' })),
      field('Primary objective', textarea({ name: 'objective', value: m.objective })),
      field('Revision / exit task', textarea({ name: 'exit', value: m.exit, rows: 2 })),
      h(
        'div',
        { class: 'form-row' },
        field('Track', select(Object.entries(TRACKS).map(([value, label]) => ({ value, label })), m.track, { name: 'track' })),
        field('Phase', select(Object.entries(PHASES).map(([value, p]) => ({ value, label: `${p.span} ${p.name}` })), m.phase, { name: 'phase' })),
      ),
      h(
        'div',
        { class: 'form-row' },
        field('Size (weeks)', input({ name: 'weight', type: 'number', min: '0.25', step: '0.25', value: String(m.weight || 1), inputmode: 'decimal' }), 'Weeks of a normal teaching week.'),
        field('Course keywords', input({ name: 'keywords', value: (m.keywords || []).join(', '), placeholder: 'database, java' }), 'Links this module to matching courses.'),
      ),
    ),
    onSubmit: (form) => {
      const d = formData(form);
      if (!d.title) {
        toast('Give the module a title');
        return false;
      }
      const weight = Math.max(0.25, Number(d.weight) || 1);
      const keywords = d.keywords.split(',').map((k) => k.trim()).filter(Boolean);
      app.update((s) => {
        if (isNew) {
          let n = s.modules.length + 1;
          const ids = new Set(s.modules.map((x) => x.id));
          while (ids.has(`C${n}`)) n++;
          s.modules.push({ id: `C${n}`, title: d.title, objective: d.objective, exit: d.exit, track: d.track, phase: d.phase, weight, keywords, custom: true });
        } else {
          const t = s.modules.find((x) => x.id === m.id);
          Object.assign(t, { title: d.title, objective: d.objective, exit: d.exit, track: d.track, phase: d.phase, weight, keywords });
        }
      });
      toast(isNew ? 'Module added to the end of your roadmap' : 'Module saved');
    },
  });
}

// ---------------------------------------------------------------------------
// Application editor (with eligibility checklist and date-conflict check)
// ---------------------------------------------------------------------------
export function openAppEditor(app, existing, prefill = {}) {
  const isNew = !existing;
  const a = existing || { id: uid('a'), status: 'researching', checklist: {}, ...prefill };
  const checks = { ...(a.checklist || {}) };
  const conflictBox = h('div', { class: 'conflicts' });

  const renderConflicts = (form) => {
    const s = form.elements.internshipStart.value;
    const e = form.elements.internshipEnd.value;
    const list = dateConflicts(s, e, app.ctx);
    conflictBox.replaceChildren(
      ...(list.length
        ? list.map((c) =>
            banner(
              c.severity,
              `Overlaps ${c.event.title}`,
              `${c.overlapDays} day${c.overlapDays > 1 ? 's' : ''} overlap (${fmtRange(c.event.s, c.event.e, { year: true })}). ${c.severity === 'critical' ? 'Ask about a later start or a formal university accommodation before accepting.' : 'You would miss teaching weeks.'}`,
            ),
          )
        : isISODate(s) && isISODate(e)
          ? [h('p', { class: 'ok-text' }, icon('check', { size: 16 }), ' No clash with teaching or exams in your calendar.')]
          : []),
    );
  };

  const dateInput = (name, value) => input({ name, type: 'date', value: value || '' });

  const { form } = openSheet({
    title: isNew ? 'Add application' : `${a.company || 'Application'}`,
    submitLabel: isNew ? 'Add' : 'Save',
    extraActions: isNew
      ? null
      : (close) =>
          button('Delete', () => {
            app.update((s) => {
              s.applications = s.applications.filter((x) => x.id !== a.id);
            });
            close();
            toast('Application deleted');
          }, { kind: 'ghost-danger', size: 'sm', iconName: 'trash' }),
    body: () => {
      const body = h(
        'div',
        { class: 'form-grid' },
        h('div', { class: 'form-row' }, field('Company', input({ name: 'company', value: a.company || '', required: true })), field('Role', input({ name: 'role', value: a.role || '', placeholder: 'Software Engineering Intern' }))),
        h('div', { class: 'form-row' }, field('Status', select(APP_STATUSES, a.status, { name: 'status' })), field('Requisition ID', input({ name: 'reqId', value: a.reqId || '' }))),
        field('Job link', input({ name: 'url', type: 'url', value: a.url || '', placeholder: 'https://', inputmode: 'url' })),
        h('div', { class: 'form-row' }, field('Location', input({ name: 'location', value: a.location || '', placeholder: 'London · hybrid' })), field('Deadline', dateInput('deadline', a.deadline), 'Leave empty if rolling.')),
        h('div', { class: 'form-row' }, field('Next action', input({ name: 'nextAction', value: a.nextAction || '', placeholder: 'Ask alumni for referral' })), field('Next action date', dateInput('nextActionDate', a.nextActionDate))),
        field('OA / interview date', dateInput('interviewDate', a.interviewDate), 'Turns on interview mode two weeks before.'),
        h('fieldset', { class: 'fieldset' }, h('legend', null, 'Internship dates'), h('div', { class: 'form-row' }, field('Start', dateInput('internshipStart', a.internshipStart)), field('End', dateInput('internshipEnd', a.internshipEnd))), conflictBox),
        h(
          'fieldset',
          { class: 'fieldset' },
          h('legend', null, 'Eligibility checks'),
          ELIGIBILITY_CHECKS.map((c) =>
            checkbox(!!checks[c.id], (v) => {
              checks[c.id] = v;
            }, c.text),
          ),
        ),
        field('Work authorisation wording', textarea({ name: 'workAuth', value: a.workAuth || '', rows: 2, placeholder: 'Copy the exact wording and open questions' })),
        field('Preparation', textarea({ name: 'prep', value: a.prep || '', rows: 2, placeholder: 'DSA topics, role-specific knowledge, stories' })),
        field('Notes', textarea({ name: 'notes', value: a.notes || '', rows: 2 })),
      );
      return body;
    },
    onSubmit: (form) => {
      const d = formData(form);
      if (!d.company) {
        toast('Company is required');
        return false;
      }
      const rec = { ...a, ...d, checklist: checks, updatedAt: toISO(app.today) };
      app.update((s) => {
        const i = s.applications.findIndex((x) => x.id === a.id);
        if (i >= 0) s.applications[i] = rec;
        else s.applications.push(rec);
      });
      toast(isNew ? 'Application added' : 'Application saved');
    },
  });

  ['internshipStart', 'internshipEnd'].forEach((n) => form.elements[n].addEventListener('change', () => renderConflicts(form)));
  renderConflicts(form);
}

export function eligibilityCount(a) {
  const c = a.checklist || {};
  return ELIGIBILITY_CHECKS.filter((x) => c[x.id]).length;
}

export function statusTone(status) {
  return { researching: 'info', applied: 'info', OA: 'warning', interview: 'warning', rejected: 'muted', offer: 'good' }[status] || 'info';
}

export { toDay };
