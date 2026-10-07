import { h, card, cardHeader, button, iconButton, chip, segmented, field, input, select, textarea, openSheet, confirmSheet, formData, toast, empty } from '../ui.js';
import { MODES, KINDS, KIND_ORDER } from '../data/defaults.js';
import { fmtDay, fmtRange, fmtMonth, fromMin, fmtDuration, weekStart, toDay, toISO, isISODate, isTime, toMin, WEEKDAYS, WEEKDAYS_LONG, relDays } from '../dates.js';
import { weekInfo, resolveDay, timetableOn, parseTimetables } from '../engine.js';
import { historyDay } from '../planner.js';
import { planFor, taskList } from './tasks.js';
import { parseTimetableText, timetableToText, parseCalendarText, calendarToText, uid } from '../parse.js';
import { modeChip, modeReason, weekOverrideControl, banner, modeStrip } from './common.js';

export function render(app, sub) {
  const tab = ['week', 'timetable', 'calendar'].includes(sub) ? sub : 'week';
  return h(
    'div',
    { class: 'stack' },
    h('header', { class: 'page-head' }, h('h1', null, 'Schedule')),
    segmented(
      [
        { value: 'week', label: 'Week' },
        { value: 'timetable', label: 'Timetable' },
        { value: 'calendar', label: 'Calendar' },
      ],
      tab,
      (v) => app.nav(`schedule/${v}`),
      { label: 'Schedule section' },
    ),
    tab === 'week' ? weekView(app) : tab === 'timetable' ? timetableView(app) : calendarView(app),
  );
}

// ---------------------------------------------------------------------------
// Week: every day's numbered list
// ---------------------------------------------------------------------------
function weekView(app) {
  const offset = app.ui.weekOffset || 0;
  const ws = weekStart(app.today) + offset * 7;
  const info = weekInfo(ws, app.ctx);
  const go = (n) => {
    app.ui.weekOffset = n;
    app.rerender();
  };
  // Future days come from the planner (which walks forward from today).
  const planned = ws + 6 >= app.today ? planFor(app, Math.max(ws, app.today), ws + 7 - Math.max(ws, app.today)).days : [];
  const days = [];
  for (let d = ws; d < ws + 7; d++) days.push(d < app.today ? historyDay(d, app.state, app.ctx) : planned.find((x) => x.day === d));
  const totalMin = days.filter((x) => x && !x.past).reduce((sum, x) => sum + x.minutes, 0);

  return h(
    'div',
    { class: 'stack' },
    card(
      h(
        'div',
        { class: 'week-nav' },
        iconButton('chevL', () => go(offset - 1), 'Previous week'),
        h('div', { class: 'week-nav-label' }, h('strong', null, fmtRange(ws, ws + 6, { year: true })), h('span', { class: 'small muted' }, offset === 0 ? 'This week' : offset === 1 ? 'Next week' : offset === -1 ? 'Last week' : relDays(ws, weekStart(app.today)))),
        iconButton('chevR', () => go(offset + 1), 'Next week'),
      ),
      h('div', { class: 'mode-summary', dataset: { mode: info.dominant } }, h('div', { class: 'mode-big' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), MODES[info.dominant].label), h('div', { class: 'mode-meta' }, `${MODES[info.dominant].hours} career prep target${totalMin ? ` · ${fmtDuration(totalMin)} planned` : ''}`)),
      weekOverrideControl(app, ws),
      offset !== 0 ? h('div', { class: 'row-actions' }, button('Back to this week', () => go(0), { kind: 'ghost', size: 'sm' })) : null,
    ),
    days.map((d) => d && dayCard(app, d, ws)),
  );
}

function dayCard(app, d, ws) {
  const isToday = d.day === app.today;
  return h(
    'section',
    { class: ['card', 'day-card', isToday && 'is-today', d.past && 'is-past'] },
    h(
      'div',
      { class: 'day-head' },
      h('div', null, h('strong', null, WEEKDAYS_LONG[d.day - ws]), h('span', { class: 'muted small' }, ` ${fmtDay(d.day, { weekday: false })}`), isToday ? h('span', { class: 'badge' }, 'Today') : null),
      h('div', { class: 'inline' }, !d.past && d.minutes ? h('span', { class: 'small muted' }, fmtDuration(d.minutes)) : null, modeChip(d.mode)),
    ),
    d.classes.length ? h('div', { class: 'lectures' }, h('span', { class: 'small muted' }, 'Lectures: '), d.classes.map((c) => chip(`${fromMin(c.s)} ${c.code}`, { title: `${c.title} · ${c.venue || ''}` }))) : null,
    d.past ? (d.items.length ? h('div', null, h('p', { class: 'small muted' }, 'Done that day:'), taskList(app, d)) : h('p', { class: 'small muted' }, 'Nothing recorded.')) : taskList(app, d, { interactive: isToday }),
  );
}

// ---------------------------------------------------------------------------
// Timetable
// ---------------------------------------------------------------------------
function timetableView(app) {
  const tts = app.state.timetables;
  const parsed = parseTimetables(tts);
  const active = timetableOn(app.today, app.ctx);
  const nextTeach = app.ctx.cal.find((e) => e.kind === 'teaching' && e.e >= app.today && !parsed.some((t) => t.fromDay <= e.s && e.s <= t.toDay));

  return h(
    'div',
    { class: 'stack' },
    h('p', { class: 'small muted' }, 'Each timetable covers a date range, so every semester can have its own. Lectures only count on teaching days — not during mid-sems, exams or breaks. Each lecture adds a “Revise …” item to that day’s list.'),
    nextTeach ? banner('info', `No timetable yet for ${nextTeach.title}`, `Starts ${fmtDay(nextTeach.s, { year: true })}. Add one when your new schedule is published (copying the old one is a quick start).`, [button('Add timetable', () => editTimetableMeta(app, null, nextTeach), { kind: 'primary', size: 'sm' })]) : null,
    tts.length ? tts.map((t) => timetableCard(app, t, active && active.id === t.id)) : empty('No timetables yet.'),
    h('div', { class: 'row-actions' }, button('New timetable', () => editTimetableMeta(app, null), { kind: 'secondary', iconName: 'plus' })),
  );
}

function timetableCard(app, t, isActive) {
  const sessions = [...(t.sessions || [])].sort((a, b) => a.day - b.day || (a.start < b.start ? -1 : 1));
  const byDay = {};
  for (const c of sessions) (byDay[c.day] = byDay[c.day] || []).push(c);
  const range = isISODate(t.from) && isISODate(t.to) ? fmtRange(toDay(t.from), toDay(t.to), { year: true }) : 'Invalid dates';
  return card(
    cardHeader(t.name || 'Timetable', isActive ? chip('Active now', { tone: 'good' }) : null, `${range} · ${sessions.length} classes`),
    Object.keys(byDay).length
      ? h(
          'div',
          { class: 'tt-days' },
          Object.keys(byDay).map((day) =>
            h(
              'div',
              { class: 'tt-day' },
              h('h3', { class: 'mini-title' }, WEEKDAYS_LONG[day]),
              h(
                'ul',
                { class: 'list' },
                byDay[day].map((c) =>
                  h(
                    'li',
                    { class: 'list-row' },
                    h('span', { class: 'tt-time' }, `${c.start}–${c.end}`),
                    h('span', { class: 'grow' }, h('strong', null, c.code), ' ', c.title, h('span', { class: 'small muted block' }, [c.lecturer, c.venue].filter(Boolean).join(' · '))),
                    iconButton('edit', () => editClass(app, t.id, c), `Edit ${c.code}`),
                  ),
                ),
              ),
            ),
          ),
        )
      : h('p', { class: 'muted' }, 'No classes yet.'),
    h(
      'div',
      { class: 'row-actions wrap' },
      button('Add class', () => editClass(app, t.id, null), { kind: 'secondary', size: 'sm', iconName: 'plus' }),
      button('Edit as text', () => bulkTimetable(app, t), { kind: 'ghost', size: 'sm', iconName: 'text' }),
      button('Details', () => editTimetableMeta(app, t), { kind: 'ghost', size: 'sm', iconName: 'edit' }),
      button('Duplicate', () => {
        app.update((s) => {
          s.timetables.push({ ...JSON.parse(JSON.stringify(t)), id: uid('t'), name: `${t.name} (copy)` });
        });
        toast('Copied. Edit its details to set the new dates.');
      }, { kind: 'ghost', size: 'sm', iconName: 'copy' }),
    ),
  );
}

function editTimetableMeta(app, t, forPeriod) {
  const isNew = !t;
  const base = t || { name: forPeriod ? `${forPeriod.title}` : '', from: forPeriod ? toISO(forPeriod.s) : '', to: forPeriod ? toISO(forPeriod.e) : '' };
  const copyOpts = [{ value: '', label: 'Start empty' }, ...app.state.timetables.map((x) => ({ value: x.id, label: `Copy classes from ${x.name}` }))];
  openSheet({
    title: isNew ? 'New timetable' : 'Timetable details',
    submitLabel: isNew ? 'Create' : 'Save',
    extraActions: isNew
      ? null
      : (close) =>
          button('Delete', async () => {
            close();
            if (await confirmSheet(`Delete “${t.name}” and its ${t.sessions.length} classes?`, { confirmLabel: 'Delete' })) {
              app.update((s) => {
                s.timetables = s.timetables.filter((x) => x.id !== t.id);
              });
              toast('Timetable deleted');
            }
          }, { kind: 'ghost-danger', size: 'sm', iconName: 'trash' }),
    body: h(
      'div',
      { class: 'form-grid' },
      field('Name', input({ name: 'name', value: base.name, placeholder: 'Group 1 · Second Semester 2026/27' })),
      h('div', { class: 'form-row' }, field('From', input({ name: 'from', type: 'date', value: base.from })), field('To', input({ name: 'to', type: 'date', value: base.to }))),
      isNew && app.state.timetables.length ? field('Classes', select(copyOpts, app.state.timetables.length ? app.state.timetables[app.state.timetables.length - 1].id : '', { name: 'copyFrom' })) : null,
    ),
    onSubmit: (form) => {
      const d = formData(form);
      if (!isISODate(d.from) || !isISODate(d.to) || d.to < d.from) {
        toast('Choose a valid date range');
        return false;
      }
      app.update((s) => {
        if (isNew) {
          const src = s.timetables.find((x) => x.id === d.copyFrom);
          s.timetables.push({ id: uid('t'), name: d.name || 'Timetable', from: d.from, to: d.to, sessions: src ? src.sessions.map((c) => ({ ...c, id: uid('s') })) : [] });
        } else {
          Object.assign(s.timetables.find((x) => x.id === t.id), { name: d.name || 'Timetable', from: d.from, to: d.to });
        }
      });
      toast(isNew ? 'Timetable created' : 'Saved');
    },
  });
}

function editClass(app, ttId, c) {
  const isNew = !c;
  const v = c || { day: 0, start: '08:00', end: '09:55', code: '', title: '', lecturer: '', venue: '' };
  openSheet({
    title: isNew ? 'Add class' : `Edit ${c.code}`,
    submitLabel: isNew ? 'Add' : 'Save',
    extraActions: isNew
      ? null
      : (close) =>
          button('Delete', () => {
            app.update((s) => {
              const t = s.timetables.find((x) => x.id === ttId);
              t.sessions = t.sessions.filter((x) => x.id !== c.id);
            });
            close();
            toast('Class removed');
          }, { kind: 'ghost-danger', size: 'sm', iconName: 'trash' }),
    body: h(
      'div',
      { class: 'form-grid' },
      h('div', { class: 'form-row three' }, field('Day', select(WEEKDAYS.map((d, i) => ({ value: String(i), label: d })), String(v.day), { name: 'day' })), field('Start', input({ name: 'start', type: 'time', value: v.start, step: 300 })), field('End', input({ name: 'end', type: 'time', value: v.end, step: 300 }))),
      h('div', { class: 'form-row' }, field('Code', input({ name: 'code', value: v.code, placeholder: 'CSM 281' })), field('Venue', input({ name: 'venue', value: v.venue }))),
      field('Title', input({ name: 'title', value: v.title })),
      field('Lecturer', input({ name: 'lecturer', value: v.lecturer })),
    ),
    onSubmit: (form) => {
      const d = formData(form);
      if (!isTime(d.start) || !isTime(d.end) || toMin(d.end) <= toMin(d.start)) {
        toast('End time must be after start time');
        return false;
      }
      const rec = { id: c ? c.id : uid('s'), day: Number(d.day), start: d.start, end: d.end, code: d.code, title: d.title, lecturer: d.lecturer, venue: d.venue };
      app.update((s) => {
        const t = s.timetables.find((x) => x.id === ttId);
        const i = t.sessions.findIndex((x) => x.id === rec.id);
        if (i >= 0) t.sessions[i] = rec;
        else t.sessions.push(rec);
      });
      toast('Saved. Your daily lists now include revising these lectures.');
    },
  });
}

function bulkTimetable(app, t) {
  const errBox = h('div', { class: 'errors' });
  openSheet({
    title: 'Edit timetable as text',
    submitLabel: 'Replace classes',
    body: h(
      'div',
      { class: 'form-grid' },
      h('p', { class: 'small muted' }, 'One class per line: day | start-end | code | title | lecturer | venue. Paste a whole new schedule here when it changes.'),
      textarea({ name: 'text', rows: 14, class: 'input mono', value: timetableToText(t.sessions), spellcheck: 'false', autocapitalize: 'off' }),
      errBox,
    ),
    onSubmit: (form) => {
      const { sessions, errors } = parseTimetableText(form.elements.text.value);
      if (errors.length) {
        errBox.replaceChildren(banner('critical', `${errors.length} line(s) need fixing`, h('ul', { class: 'tight' }, errors.slice(0, 6).map((e) => h('li', null, `Line ${e.line}: ${e.message}`)))));
        return false;
      }
      app.update((s) => {
        s.timetables.find((x) => x.id === t.id).sessions = sessions;
      });
      toast(`${sessions.length} classes saved`);
    },
  });
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------
function calendarView(app) {
  const events = [...app.state.calendar].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : (a.end < b.end ? 1 : -1)));
  const groups = [];
  for (const e of events) {
    const key = isISODate(e.start) ? fmtMonth(toDay(e.start)) : 'Invalid';
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) groups.push((g = { key, items: [] }));
    g.items.push(e);
  }
  const r = resolveDay(app.today, app.ctx);
  const first = events.find((e) => isISODate(e.start));
  const last = [...events].reverse().find((e) => isISODate(e.end));

  return h(
    'div',
    { class: 'stack' },
    card(
      cardHeader('How the calendar drives your plan'),
      h('p', { class: 'small' }, 'Teaching periods are normal weeks, mid-sems and exams pause new modules, breaks carry more. Overlaps resolve as exams › mid-sems › breaks › teaching. Edit anything here and the forecast, week plans and alerts update immediately.'),
      h('p', { class: 'small muted' }, `Today: ${MODES[r.mode].label} — ${modeReason(r, app.today)}.`),
      first && last ? modeStrip(app, Math.min(app.today, toDay(first.start)), toDay(last.end)) : null,
    ),
    h('div', { class: 'row-actions wrap' }, button('Add event', () => editEvent(app, null), { kind: 'secondary', size: 'sm', iconName: 'plus' }), button('Edit as text', () => bulkCalendar(app), { kind: 'ghost', size: 'sm', iconName: 'text' })),
    groups.map((g) =>
      card(
        h('h2', { class: 'card-title' }, g.key),
        h(
          'ul',
          { class: 'list' },
          g.items.map((e) => {
            const valid = isISODate(e.start) && isISODate(e.end);
            const past = valid && toDay(e.end) < app.today;
            const k = KINDS[e.kind];
            return h(
              'li',
              { class: ['list-row', 'clickable', past && 'past'], onclick: () => editEvent(app, e) },
              h('span', { class: 'grow' }, h('span', { class: 'cal-title' }, e.title), h('span', { class: 'small muted block' }, valid ? fmtRange(toDay(e.start), toDay(e.end)) : 'Invalid dates')),
              k && k.mode ? modeChip(k.mode, k.short) : chip(k ? k.short : e.kind),
            );
          }),
        ),
      ),
    ),
  );
}

function editEvent(app, e) {
  const isNew = !e;
  const v = e || { title: '', start: toISO(app.today), end: toISO(app.today), kind: 'milestone' };
  openSheet({
    title: isNew ? 'Add calendar event' : 'Edit event',
    submitLabel: isNew ? 'Add' : 'Save',
    extraActions: isNew
      ? null
      : (close) =>
          button('Delete', () => {
            app.update((s) => {
              s.calendar = s.calendar.filter((x) => x.id !== e.id);
            });
            close();
            toast('Event deleted');
          }, { kind: 'ghost-danger', size: 'sm', iconName: 'trash' }),
    body: h(
      'div',
      { class: 'form-grid' },
      field('Title', input({ name: 'title', value: v.title, placeholder: 'Mid-semester examinations' })),
      h('div', { class: 'form-row' }, field('Start', input({ name: 'start', type: 'date', value: v.start })), field('End', input({ name: 'end', type: 'date', value: v.end }))),
      field(
        'Kind',
        select(KIND_ORDER.map((k) => ({ value: k, label: `${KINDS[k].label}${KINDS[k].mode ? ` → ${MODES[KINDS[k].mode].short} mode` : ''}` })), v.kind, { name: 'kind' }),
        'Kinds with a mode change your weekly capacity; the others are reminders.',
      ),
    ),
    onSubmit: (form) => {
      const d = formData(form);
      if (!d.title || !isISODate(d.start) || !isISODate(d.end) || d.end < d.start) {
        toast('Add a title and a valid date range');
        return false;
      }
      app.update((s) => {
        if (isNew) s.calendar.push({ id: uid('c'), ...d });
        else Object.assign(s.calendar.find((x) => x.id === e.id), d);
      });
      toast('Calendar updated. Forecast recalculated.');
    },
  });
}

function bulkCalendar(app) {
  const errBox = h('div', { class: 'errors' });
  openSheet({
    title: 'Edit calendar as text',
    submitLabel: 'Replace calendar',
    body: h(
      'div',
      { class: 'form-grid' },
      h('p', { class: 'small muted' }, `One event per line: start | end | kind | title. Kinds: ${KIND_ORDER.join(', ')} (aliases like "exams", "holiday" work). Use this when the university publishes a revised calendar.`),
      textarea({ name: 'text', rows: 16, class: 'input mono', value: calendarToText(app.state.calendar), spellcheck: 'false', autocapitalize: 'off' }),
      errBox,
    ),
    onSubmit: (form) => {
      const { events, errors } = parseCalendarText(form.elements.text.value);
      if (errors.length) {
        errBox.replaceChildren(banner('critical', `${errors.length} line(s) need fixing`, h('ul', { class: 'tight' }, errors.slice(0, 6).map((x) => h('li', null, `Line ${x.line}: ${x.message}`)))));
        return false;
      }
      app.update((s) => {
        // Keep ids of events that still exist so dismissed alerts stay dismissed.
        const pool = [...s.calendar];
        s.calendar = events.map((ev) => {
          const i = pool.findIndex((o) => o.title === ev.title && o.kind === ev.kind);
          if (i < 0) return ev;
          const [old] = pool.splice(i, 1);
          return { ...ev, id: old.id };
        });
      });
      toast(`${events.length} events saved`);
    },
  });
}
