import { h, card, cardHeader, checkbox, button, iconButton, chip, progressBar, segmented, textarea, icon, toast, confirmSheet } from '../ui.js';
import { PHASES, TRACKS, RITUALS, PLAYBOOK, ELIGIBILITY_CHECKS } from '../data/defaults.js';
import { fmtDay, fmtRange, toDay, isISODate } from '../dates.js';
import { moduleState, relatedCourses } from '../engine.js';
import { modeStrip, openModuleEditor, openAppEditor, setModuleTask, setModuleStatus } from './common.js';
import { planFor, trackSummary, openChapterImport, openLessonsEditor, openNewTrack } from './tasks.js';
import { fmtTimestamp, lessonMinutes } from '../learn.js';
import { toISO } from '../dates.js';

export function render(app, sub) {
  const tab = ['playbook', 'learn'].includes(sub) ? sub : 'roadmap';
  return h(
    'div',
    { class: 'stack' },
    h('header', { class: 'page-head' }, h('h1', null, 'Plan')),
    segmented(
      [
        { value: 'roadmap', label: 'Roadmap' },
        { value: 'learn', label: 'Learn' },
        { value: 'playbook', label: 'Playbook' },
      ],
      tab,
      (v) => app.nav(`plan/${v}`),
      { label: 'Plan section' },
    ),
    tab === 'roadmap' ? roadmap(app) : tab === 'learn' ? learn(app) : playbook(app),
  );
}

// ---------------------------------------------------------------------------
// Roadmap
// ---------------------------------------------------------------------------
function roadmap(app) {
  const { state, fc, today } = app;
  const mods = state.modules;
  const done = mods.filter((m) => moduleState(m, state.progress).done).length;
  const skipped = mods.filter((m) => moduleState(m, state.progress).skipped).length;
  const target = isISODate(state.settings.targetEnd) ? toDay(state.settings.targetEnd) : null;

  let verdict;
  if (!fc.finish && fc.unscheduled.length) verdict = h('p', { class: 'warn-text' }, `${fc.unscheduled.length} module(s) don't fit in the next three years at your current pace. Check pace settings.`);
  else if (fc.finish && target) {
    const slack = target - fc.finish;
    verdict = h(
      'p',
      { class: slack >= 0 ? 'ok-text' : 'warn-text' },
      icon(slack >= 0 ? 'check' : 'alert', { size: 16 }),
      slack >= 0 ? ` ${slack} days of slack before your ${fmtDay(target, { weekday: false })} target.` : ` ${-slack} days past your ${fmtDay(target, { weekday: false })} target. Skip optional modules or use breaks.`,
    );
  }

  const markers = target ? [{ day: target, label: 'Target end' }] : [];
  const stripEnd = Math.max(target || 0, fc.finish || 0, today + 7 * 30);

  const summary = card(
    cardHeader('Forecast', null, 'Recomputed from today, your calendar and your progress'),
    h(
      'div',
      { class: 'stats' },
      stat(`${done}`, `of ${mods.length} done`),
      stat(fc.finish ? fmtDay(fc.finish, { weekday: false }) : '—', 'projected finish'),
      stat(app.current ? app.current.id : '✓', 'current module'),
    ),
    progressBar((done + skipped) / Math.max(1, mods.length), 'Roadmap progress'),
    verdict,
    h('h3', { class: 'mini-title' }, 'Weeks ahead'),
    modeStrip(app, today, stripEnd, { markers }),
    h('p', { class: 'small muted' }, 'Tap a week to open it. Exam weeks pause new modules; breaks carry about two.'),
  );

  const groups = {};
  for (const m of mods) (groups[m.phase] = groups[m.phase] || []).push(m);
  const phaseKeys = [...Object.keys(PHASES).filter((k) => groups[k]), ...Object.keys(groups).filter((k) => !PHASES[k])];

  return h(
    'div',
    { class: 'stack' },
    summary,
    phaseKeys.map((pk) => phaseSection(app, pk, groups[pk])),
    h('div', { class: 'row-actions' }, button('Add module', () => openModuleEditor(app), { kind: 'secondary', iconName: 'plus' })),
    ritualsCard(),
  );
}

function stat(value, label) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, value), h('span', { class: 'stat-label' }, label));
}

function phaseSection(app, pk, mods) {
  const ph = PHASES[pk] || { name: 'Custom', span: '', exit: '' };
  const doneN = mods.filter((m) => moduleState(m, app.state.progress).done).length;
  return h(
    'section',
    { class: 'card phase' },
    h('div', { class: 'card-head' }, h('div', null, h('p', { class: 'eyebrow' }, `${ph.span} · ${doneN}/${mods.length}`), h('h2', { class: 'card-title' }, ph.name), ph.exit && h('p', { class: 'card-sub' }, `Exit: ${ph.exit}`))),
    h('ol', { class: 'modules' }, mods.map((m) => moduleRow(app, m))),
  );
}

function moduleRow(app, m) {
  const { state, fc } = app;
  const st = moduleState(m, state.progress);
  const p = state.progress[m.id] || {};
  const range = fc.byId[m.id];
  const isCurrent = app.current && app.current.id === m.id;
  const open = app.ui.openModule === m.id;
  const status = st.done ? 'done' : st.skipped ? 'skipped' : isCurrent ? 'current' : 'todo';
  const when = st.done ? (p.completedOn ? `Done ${fmtDay(toDay(p.completedOn), { weekday: false })}` : 'Done') : st.skipped ? 'Skipped' : range ? fmtRange(range.start, range.end) : '—';

  const toggle = () => {
    app.ui.openModule = open ? null : m.id;
    app.rerender();
  };

  return h(
    'li',
    { class: ['module', `st-${status}`, open && 'open'] },
    h(
      'button',
      { type: 'button', class: 'module-row', onclick: toggle, 'aria-expanded': open ? 'true' : 'false' },
      h('span', { class: 'module-status', 'aria-hidden': 'true' }, st.done ? icon('check', { size: 14 }) : st.fraction > 0 ? h('span', { class: 'half' }) : null),
      h('span', { class: 'module-id' }, m.id),
      h('span', { class: 'module-title' }, m.title, isCurrent ? h('span', { class: 'badge' }, 'Now') : null),
      h('span', { class: 'module-when' }, when),
    ),
    open ? moduleDetail(app, m, st) : null,
  );
}

function moduleDetail(app, m, st) {
  const tasks = (app.state.progress[m.id] || {}).tasks || {};
  const idx = app.state.modules.findIndex((x) => x.id === m.id);
  const courses = relatedCourses(m, app.ctx, app.fc.byId[m.id] ? app.fc.byId[m.id].start : app.today);
  const move = (dir) =>
    app.update((s) => {
      const j = idx + dir;
      if (j < 0 || j >= s.modules.length) return;
      [s.modules[idx], s.modules[j]] = [s.modules[j], s.modules[idx]];
    });
  const noteKey = `module:${m.id}`;
  return h(
    'div',
    { class: 'module-detail' },
    h('div', { class: 'chips-row' }, chip(TRACKS[m.track] || m.track), Number(m.weight) !== 1 ? chip(`${m.weight} wk`) : null, courses.map((c) => chip(`Course: ${c.code}`, { tone: 'good', title: c.title }))),
    h(
      'div',
      { class: 'tasks' },
      checkbox(!!tasks.objective, (v) => setModuleTask(app, m.id, 'objective', v), h('span', null, h('span', { class: 'task-label' }, 'Objective'), m.objective || '—')),
      checkbox(!!tasks.exit, (v) => setModuleTask(app, m.id, 'exit', v), h('span', null, h('span', { class: 'task-label' }, 'Exit task'), m.exit || '—')),
    ),
    h(
      'label',
      { class: 'field' },
      h('span', { class: 'field-label' }, 'Evidence and notes'),
      textarea({
        rows: 3,
        value: app.state.notes[noteKey] || '',
        placeholder: 'Scores, links, what was hard, what to revisit…',
        onchange: (e) => app.update((s) => { s.notes[noteKey] = e.target.value; }),
      }),
    ),
    h(
      'div',
      { class: 'row-actions' },
      st.done || st.skipped
        ? button('Reopen', () => setModuleStatus(app, m.id, null), { kind: 'secondary', size: 'sm' })
        : [button('Mark done', () => { setModuleStatus(app, m.id, 'done'); toast(`${m.id} done. Forecast updated.`); }, { kind: 'primary', size: 'sm', iconName: 'check' }), button('Skip', () => setModuleStatus(app, m.id, 'skipped'), { kind: 'ghost', size: 'sm' })],
      h('span', { class: 'spacer' }),
      iconButton('up', () => move(-1), 'Move earlier', { disabled: idx === 0 }),
      iconButton('down', () => move(1), 'Move later', { disabled: idx === app.state.modules.length - 1 }),
      iconButton('edit', () => openModuleEditor(app, m), 'Edit module'),
      iconButton('trash', async () => {
        if (await confirmSheet(`Remove ${m.id} · ${m.title} from your roadmap?`, { confirmLabel: 'Remove' })) {
          app.update((s) => {
            s.modules = s.modules.filter((x) => x.id !== m.id);
          });
          toast('Module removed');
        }
      }, 'Remove module'),
    ),
  );
}

function ritualsCard() {
  return card(
    cardHeader('Triggered by your calendar', null, 'These weeks of the original plan appear on Today when their moment comes, instead of on fixed dates.'),
    h(
      'ul',
      { class: 'list' },
      ['exam', 'preExam', 'interview', 'semesterEnd', 'monthEnd', 'weekly'].map((k) => {
        const r = RITUALS[k];
        const when = {
          exam: 'During mid-sems and exams',
          preExam: 'The week before any exams',
          interview: 'Two weeks before an OA or interview',
          semesterEnd: 'After each semester’s exams',
          monthEnd: 'Last days of each month',
          weekly: 'Weekends, until the scorecard is filled',
        }[k];
        return h('li', { class: 'list-row stacked' }, h('strong', null, `${r.title}`, h('span', { class: 'muted small' }, ` · ${r.from}`)), h('span', { class: 'small muted' }, when));
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Learn: tracks like "Java in 3 weeks"
// ---------------------------------------------------------------------------
function learn(app) {
  const res = planFor(app, app.today, 1, { horizon: 180 });
  return h(
    'div',
    { class: 'stack' },
    h('p', { class: 'small muted' }, 'Lessons are spread over the weeks you choose. Free days carry more, days with a matching lecture (CSM 281 for Java) carry about double, exam days none. Miss a day and the rest is re-spread automatically.'),
    (app.state.tracks || []).map((t) => trackCard(app, t, res)),
    h('div', { class: 'row-actions' }, button('New track', () => openNewTrack(app), { kind: 'secondary', iconName: 'plus' })),
  );
}

function trackCard(app, t, res) {
  const sum = trackSummary(app, t, res.trackFinish[t.id], res.trackWindows[t.id]);
  const set = (patch) =>
    app.update((s) => {
      Object.assign(s.tracks.find((x) => x.id === t.id), patch);
    });
  const weeks = Number(t.weeks) || 3;
  const doneMap = app.state.lessonDone;
  const open = app.ui.openTrack === t.id;
  return card(
    cardHeader(
      t.name,
      h('label', { class: 'check-inline small' }, h('input', { type: 'checkbox', checked: t.active !== false, onchange: (e) => set({ active: e.target.checked }) }), ' Active'),
      `${sum.done}/${sum.total} lessons · ${sum.status}`,
    ),
    progressBar(sum.total ? sum.done / sum.total : 0, `${t.name} progress`),
    sum.late ? h('p', { class: 'small warn-text' }, icon('alert', { size: 14 }), ' At your daily limits this finishes late. Add a week, or raise “Learning (max)” in Settings.') : null,
    h(
      'div',
      { class: 'form-row' },
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Finish in (weeks)'), segmented(['2', '3', '4'].map((v) => ({ value: v, label: v })), String(weeks), (v) => set({ weeks: Number(v) }), { small: true, label: 'Weeks' })),
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Starting'), h('input', { class: 'input', type: 'date', value: t.start || '', onchange: (e) => isISODate(e.target.value) && set({ start: e.target.value }) })),
    ),
    h('p', { class: 'small muted' }, t.url ? h('span', null, 'Video: ', h('a', { href: t.url, target: '_blank', rel: 'noopener' }, t.resource || t.url)) : t.lessons.some((l) => l.video) ? `Lessons ${t.lessons.filter((l) => l.video && !Number.isFinite(l.start)).length ? 'marked “Study in …” are placeholders for a video course: paste its chapter list to get exact timestamps.' : 'use your video chapters.'}` : null),
    h(
      'div',
      { class: 'row-actions wrap' },
      button('Paste video chapters', () => openChapterImport(app, t), { kind: 'secondary', size: 'sm', iconName: 'link' }),
      button('Edit lessons', () => openLessonsEditor(app, t), { kind: 'ghost', size: 'sm', iconName: 'text' }),
      button(open ? 'Hide lessons' : `Show ${t.lessons.length} lessons`, () => { app.ui.openTrack = open ? null : t.id; app.rerender(); }, { kind: 'ghost', size: 'sm' }),
    ),
    open
      ? h(
          'div',
          { class: 'tasks' },
          t.lessons.map((l, i) =>
            checkbox(
              !!doneMap[l.id],
              (v) =>
                app.update((s) => {
                  if (v) s.lessonDone[l.id] = toISO(app.today);
                  else delete s.lessonDone[l.id];
                }),
              h('span', null, h('span', { class: 'task-label' }, `${i + 1} · ${Number.isFinite(l.start) ? `${fmtTimestamp(l.start)}–${fmtTimestamp(l.end)}` : `${lessonMinutes(l)} min`}`), l.title),
              { sub: l.practice ? `Practice: ${l.practice}` : null },
            ),
          ),
        )
      : null,
  );
}

// ---------------------------------------------------------------------------
// Playbook
// ---------------------------------------------------------------------------
function playbook(app) {
  const P = PLAYBOOK;
  const section = (title, body, open = false) => h('details', { class: 'card disclosure', open }, h('summary', null, h('span', null, title), icon('chevD', { size: 18 })), h('div', { class: 'disclosure-body' }, body));
  const pairs = (rows, ordered = true) => h(ordered ? 'ol' : 'ul', { class: 'pairs' }, rows.map(([a, b]) => h('li', null, h('strong', null, a), h('span', null, b))));
  const tracked = new Set(app.state.applications.map((a) => (a.company || '').toLowerCase()));

  return h(
    'div',
    { class: 'stack' },
    section('Five highest-impact actions', h('ol', { class: 'tight' }, P.topActions.map((t) => h('li', null, t))), true),
    section('Strategic priorities', pairs(P.priorities)),
    section('Monthly decision rules', h('ul', { class: 'pairs' }, P.decisionRules.map(([a, b]) => h('li', null, h('strong', null, `If ${a.charAt(0).toLowerCase()}${a.slice(1)}`), h('span', null, b))))),
    section('DSA mastery criteria', h('div', null, pairs(P.dsaStages), h('p', { class: 'small muted' }, 'Advance when you can implement and explain a pattern independently — not after watching a tutorial.'))),
    section('Core CS syllabus', pairs(P.syllabus)),
    section(
      'Company playbook',
      h(
        'div',
        { class: 'stack-sm' },
        P.archetypes.map((a) =>
          h(
            'div',
            { class: 'archetype' },
            h('div', { class: 'archetype-head' }, h('strong', null, `${a.id}. ${a.name}`), chip(a.priority, { tone: a.priority.startsWith('High') ? 'good' : 'info' })),
            h('p', { class: 'small' }, a.focus),
            h(
              'ul',
              { class: 'company-list' },
              P.companies
                .filter((c) => c[1] === a.id)
                .map(([name, , prep]) =>
                  h(
                    'li',
                    null,
                    h('div', null, h('strong', null, name), h('span', { class: 'small muted' }, prep)),
                    tracked.has(name.toLowerCase())
                      ? chip('Tracked', { tone: 'good' })
                      : button('Track', () => openAppEditor(app, null, { company: name, prep }), { kind: 'ghost', size: 'sm', iconName: 'plus' }),
                  ),
                ),
            ),
          ),
        ),
        h('p', { class: 'small muted' }, 'A preparation strategy, not a list of verified openings. Check each role’s official page for dates, eligibility and sponsorship.'),
      ),
    ),
    section('Eligibility — check before investing', h('div', null, h('ol', { class: 'tight' }, ELIGIBILITY_CHECKS.map((c) => h('li', null, c.text))), h('p', { class: 'small muted' }, 'Each application in the tracker has these as checkboxes, and its internship dates are checked against your exam periods automatically.'))),
    section('Recruitment calendar', pairs(P.recruitment)),
    section('Networking strategy', h('ul', { class: 'tight' }, P.networking.map((t) => h('li', null, t)))),
  );
}
