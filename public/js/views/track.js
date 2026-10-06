import { h, card, cardHeader, button, iconButton, chip, segmented, field, input, select, textarea, openSheet, formData, toast, icon, empty, checkbox, progressBar } from '../ui.js';
import { SCORE_AREAS, DSA_PATTERNS, CHECKLISTS, APP_STATUSES } from '../data/defaults.js';
import { fmtDay, fmtRange, fmtMonth, weekStart, weekKey, toDay, toISO, isISODate, relDays, monthKey } from '../dates.js';
import { decisionHints, scoreTotal, dueReviews, patternStats, firstInterval, nextInterval, dateConflicts } from '../engine.js';
import { uid } from '../parse.js';
import { banner, openAppEditor, eligibilityCount, statusTone } from './common.js';

export function render(app, sub) {
  const tab = ['score', 'dsa', 'apps', 'evidence'].includes(sub) ? sub : 'score';
  return h(
    'div',
    { class: 'stack' },
    h('header', { class: 'page-head' }, h('h1', null, 'Track')),
    segmented(
      [
        { value: 'score', label: 'Score' },
        { value: 'dsa', label: 'DSA log' },
        { value: 'apps', label: 'Applications' },
        { value: 'evidence', label: 'Evidence' },
      ],
      tab,
      (v) => app.nav(`track/${v}`),
      { label: 'Track section' },
    ),
    tab === 'score' ? scorecard(app) : tab === 'dsa' ? dsaLog(app) : tab === 'apps' ? applications(app) : evidence(app),
  );
}

// ---------------------------------------------------------------------------
// Scorecard
// ---------------------------------------------------------------------------
function scorecard(app) {
  const offset = app.ui.scoreOffset || 0;
  const ws = weekStart(app.today) + offset * 7;
  const key = weekKey(ws);
  const cardData = app.state.scorecards[key] || {};
  const total = scoreTotal(cardData);
  const set = (area, v) =>
    app.update((s) => {
      s.scorecards[key] = { ...(s.scorecards[key] || {}), [area]: v };
    });
  const go = (n) => {
    app.ui.scoreOffset = n;
    app.rerender();
  };

  const hints = decisionHints(app.state.scorecards, app.today);
  return h(
    'div',
    { class: 'stack' },
    card(
      h('div', { class: 'week-nav' }, iconButton('chevL', () => go(offset - 1), 'Previous week'), h('div', { class: 'week-nav-label' }, h('strong', null, fmtRange(ws, ws + 6)), h('span', { class: 'small muted' }, offset === 0 ? 'This week' : relDays(ws, weekStart(app.today)))), iconButton('chevR', () => go(offset + 1), 'Next week', { disabled: offset >= 0 })),
      h('div', { class: 'score-total' }, h('span', { class: 'stat-value' }, `${total}`), h('span', { class: 'muted' }, ' / 28')),
      h('p', { class: 'small muted' }, '0 none · 1 limited · 2 partial · 3 met target · 4 exceeded. In exam weeks, rate academics and sustainability first.'),
      h(
        'div',
        { class: 'score-list' },
        SCORE_AREAS.map((a) =>
          h(
            'div',
            { class: 'score-row' },
            h('div', null, h('strong', null, a.label), h('span', { class: 'small muted block' }, a.hint)),
            h(
              'div',
              { class: 'score-btns', role: 'radiogroup', 'aria-label': a.label },
              [0, 1, 2, 3, 4].map((v) => h('button', { type: 'button', role: 'radio', 'aria-checked': cardData[a.id] === v ? 'true' : 'false', class: ['score-btn', cardData[a.id] === v && 'active'], onclick: () => set(a.id, v) }, String(v))),
            ),
          ),
        ),
      ),
      field('What improved, what stayed weak', textarea({ rows: 2, value: cardData.note || '', onchange: (e) => app.update((s) => { s.scorecards[key] = { ...(s.scorecards[key] || {}), note: e.target.value }; }) })),
    ),
    hints.map((x) => banner(x.tone, 'Decision rule', x.text)),
    history(app),
  );
}

function history(app) {
  const ws0 = weekStart(app.today);
  const weeks = [];
  for (let i = 11; i >= 0; i--) weeks.push(ws0 - i * 7);
  const any = weeks.some((w) => app.state.scorecards[weekKey(w)]);
  if (!any) return null;
  return card(
    cardHeader('Last 12 weeks', null, 'Total score per week (out of 28)'),
    h(
      'div',
      { class: 'bars', role: 'list' },
      weeks.map((w) => {
        const c = app.state.scorecards[weekKey(w)];
        const t = c ? scoreTotal(c) : null;
        return h(
          'div',
          { class: 'bar-col', role: 'listitem', title: `${fmtRange(w, w + 6)}: ${t === null ? 'not rated' : `${t}/28`}` },
          h('span', { class: 'bar-val' }, t === null ? '' : String(t)),
          h('span', { class: ['bar', t === null && 'empty'], style: { height: `${t === null ? 4 : Math.max(4, (t / 28) * 100)}%` } }),
          h('span', { class: 'bar-label' }, fmtDay(w, { weekday: false }).split(' ')[0]),
        );
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// DSA log
// ---------------------------------------------------------------------------
function dsaLog(app) {
  const log = app.state.dsaLog;
  const due = dueReviews(log, app.today);
  const stats = patternStats(log);
  const recent = [...log].sort((a, b) => (a.date < b.date ? 1 : -1));
  const independent = log.filter((p) => p.independent).length;

  return h(
    'div',
    { class: 'stack' },
    card(
      cardHeader('DSA log', button('Log attempt', () => logAttempt(app), { kind: 'primary', size: 'sm', iconName: 'plus' }), 'Record every attempt — misses matter most'),
      h('div', { class: 'stats' }, h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, String(log.length)), h('span', { class: 'stat-label' }, 'attempts')), h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, log.length ? `${Math.round((independent / log.length) * 100)}%` : '—'), h('span', { class: 'stat-label' }, 'independent')), h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, String(due.length)), h('span', { class: 'stat-label' }, 'due revisits'))),
    ),
    due.length
      ? card(
          cardHeader('Due for revisit', null, 'Re-solve from scratch, then record how it went'),
          h(
            'ul',
            { class: 'list' },
            due.map((p) =>
              h(
                'li',
                { class: 'list-row wrap' },
                h('span', { class: 'grow' }, p.url ? h('a', { href: p.url, target: '_blank', rel: 'noopener' }, p.title) : p.title, h('span', { class: 'small muted block' }, `${p.pattern || 'Other'}${p.insight ? ` · missing insight: ${p.insight}` : ''}`)),
                h('div', { class: 'row-actions' }, button('Clean', () => review(app, p, true), { kind: 'primary', size: 'sm', iconName: 'check' }), button('Struggled', () => review(app, p, false), { kind: 'secondary', size: 'sm' })),
              ),
            ),
          ),
        )
      : null,
    stats.length
      ? card(
          cardHeader('By pattern', null, 'Weakest first — use this for the “weakest patterns” module'),
          h(
            'ul',
            { class: 'list' },
            stats.map((s) => h('li', { class: 'list-row' }, h('span', { class: 'grow' }, s.pattern), h('span', { class: 'small muted' }, `${s.independent}/${s.attempts}`), h('span', { class: 'pattern-bar' }, h('span', { style: { width: `${Math.round(s.rate * 100)}%` } })))),
          ),
        )
      : null,
    recent.length
      ? card(
          cardHeader('All attempts'),
          h(
            'ul',
            { class: 'list' },
            recent.slice(0, app.ui.dsaAll ? recent.length : 15).map((p) =>
              h(
                'li',
                { class: 'list-row' },
                h('span', { class: ['result-dot', p.independent ? 'ok' : 'miss'], title: p.independent ? 'Solved independently' : 'Needed help or failed' }),
                h('span', { class: 'grow' }, p.title, h('span', { class: 'small muted block' }, [fmtDay(toDay(p.date), { weekday: false }), p.pattern, p.minutes ? `${p.minutes} min` : null, p.hints ? `${p.hints} hint${p.hints > 1 ? 's' : ''}` : null, p.nextReview ? `revisit ${relDays(toDay(p.nextReview), app.today)}` : 'retired'].filter(Boolean).join(' · '))),
                iconButton('edit', () => logAttempt(app, p), 'Edit attempt'),
              ),
            ),
          ),
          recent.length > 15 && !app.ui.dsaAll ? button(`Show all ${recent.length}`, () => { app.ui.dsaAll = true; app.rerender(); }, { kind: 'ghost', size: 'sm' }) : null,
        )
      : empty('No attempts yet. Start with the Week 1 baseline: two unseen problems, no hints.'),
  );
}

function logAttempt(app, existing) {
  const isNew = !existing;
  const p = existing || { date: toISO(app.today), title: '', url: '', pattern: DSA_PATTERNS[0], difficulty: 'medium', minutes: '', hints: 0, independent: false, insight: '' };
  openSheet({
    title: isNew ? 'Log attempt' : 'Edit attempt',
    submitLabel: isNew ? 'Log' : 'Save',
    extraActions: isNew
      ? null
      : (close) =>
          button('Delete', () => {
            app.update((s) => {
              s.dsaLog = s.dsaLog.filter((x) => x.id !== p.id);
            });
            close();
          }, { kind: 'ghost-danger', size: 'sm', iconName: 'trash' }),
    body: h(
      'div',
      { class: 'form-grid' },
      field('Problem', input({ name: 'title', value: p.title, placeholder: 'Longest substring without repeating characters' })),
      field('Link', input({ name: 'url', type: 'url', value: p.url || '', placeholder: 'https://', inputmode: 'url' })),
      h('div', { class: 'form-row' }, field('Pattern', select(DSA_PATTERNS, p.pattern, { name: 'pattern' })), field('Difficulty', select(['easy', 'medium', 'hard'], p.difficulty, { name: 'difficulty' }))),
      h('div', { class: 'form-row three' }, field('Date', input({ name: 'date', type: 'date', value: p.date })), field('Minutes', input({ name: 'minutes', type: 'number', min: '0', value: String(p.minutes || ''), inputmode: 'numeric' })), field('Hints', input({ name: 'hints', type: 'number', min: '0', value: String(p.hints || 0), inputmode: 'numeric' }))),
      h('label', { class: 'check-inline' }, h('input', { type: 'checkbox', name: 'independent', checked: !!p.independent }), ' Solved independently and explained complexity'),
      field('Missing insight', textarea({ name: 'insight', rows: 2, value: p.insight || '', placeholder: 'What would have unlocked it?' })),
    ),
    onSubmit: (form) => {
      const d = formData(form);
      if (!d.title) {
        toast('Name the problem');
        return false;
      }
      if (!isISODate(d.date)) d.date = toISO(app.today);
      const rec = { ...p, ...d, minutes: Number(d.minutes) || 0, hints: Number(d.hints) || 0, independent: !!d.independent };
      if (isNew) {
        rec.id = uid('p');
        rec.interval = firstInterval(rec.independent);
        rec.nextReview = toISO(toDay(rec.date) + rec.interval);
        rec.history = [];
      }
      app.update((s) => {
        const i = s.dsaLog.findIndex((x) => x.id === rec.id);
        if (i >= 0) s.dsaLog[i] = rec;
        else s.dsaLog.push(rec);
      });
      if (isNew) toast(`Logged. Revisit ${relDays(toDay(rec.nextReview), app.today)}.`);
    },
  });
}

function review(app, p, clean) {
  const next = nextInterval(p.interval, clean);
  app.update((s) => {
    const t = s.dsaLog.find((x) => x.id === p.id);
    t.history = [...(t.history || []), { date: toISO(app.today), clean }];
    t.interval = next;
    t.nextReview = next === null ? null : toISO(app.today + next);
  });
  toast(next === null ? 'Retired — you know this one.' : `Next revisit ${relDays(app.today + next, app.today)}.`);
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------
function applications(app) {
  const apps = [...app.state.applications];
  const rank = { interview: 0, OA: 1, applied: 2, researching: 3, offer: 4, rejected: 5 };
  const dateOf = (a) => [a.interviewDate, a.deadline, a.nextActionDate].filter(isISODate).sort()[0] || '9999';
  apps.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || (dateOf(a) < dateOf(b) ? -1 : 1));
  const filter = app.ui.appFilter || 'active';
  const shown = apps.filter((a) => (filter === 'active' ? !['rejected'].includes(a.status) : true));
  const counts = APP_STATUSES.map((s) => [s, apps.filter((a) => a.status === s).length]).filter(([, n]) => n);

  return h(
    'div',
    { class: 'stack' },
    card(
      cardHeader('Applications', button('Add', () => openAppEditor(app, null), { kind: 'primary', size: 'sm', iconName: 'plus' }), 'One row per role, not per company'),
      counts.length ? h('div', { class: 'chips-row' }, counts.map(([s, n]) => chip(`${n} ${s}`, { tone: statusTone(s) }))) : null,
      apps.length ? segmented([{ value: 'active', label: 'Active' }, { value: 'all', label: 'All' }], filter, (v) => { app.ui.appFilter = v; app.rerender(); }, { small: true, label: 'Filter' }) : null,
    ),
    shown.length
      ? shown.map((a) => appCard(app, a))
      : empty('No applications yet. Add live roles now — don’t wait for a stronger portfolio. The Playbook tab lists your 22 target companies.', button('Open company playbook', () => app.nav('plan/playbook'), { kind: 'secondary', size: 'sm' })),
  );
}

function appCard(app, a) {
  const conflicts = dateConflicts(a.internshipStart, a.internshipEnd, app.ctx).filter((c) => c.severity === 'critical');
  const elig = eligibilityCount(a);
  const dates = [];
  if (isISODate(a.deadline)) dates.push(`Deadline ${fmtDay(toDay(a.deadline), { weekday: false })} (${relDays(toDay(a.deadline), app.today)})`);
  if (isISODate(a.interviewDate)) dates.push(`${a.status === 'OA' ? 'OA' : 'Interview'} ${fmtDay(toDay(a.interviewDate), { weekday: false })}`);
  return h(
    'section',
    { class: 'card clickable app-card', onclick: () => openAppEditor(app, a), role: 'button', tabindex: 0, onkeydown: (e) => { if (e.key === 'Enter') openAppEditor(app, a); } },
    h('div', { class: 'card-head' }, h('div', null, h('h2', { class: 'card-title' }, a.company || 'Untitled'), h('p', { class: 'card-sub' }, [a.role, a.location].filter(Boolean).join(' · ') || 'Add role details')), chip(a.status, { tone: statusTone(a.status) })),
    dates.length ? h('p', { class: 'small' }, dates.join(' · ')) : null,
    a.nextAction ? h('p', { class: 'small' }, h('strong', null, 'Next: '), a.nextAction, isISODate(a.nextActionDate) ? h('span', { class: 'muted' }, ` · ${relDays(toDay(a.nextActionDate), app.today)}`) : null) : null,
    h('div', { class: 'app-foot' }, h('span', { class: 'small muted' }, `Eligibility ${elig}/6`), progressBar(elig / 6, 'Eligibility checks')),
    conflicts.length ? h('p', { class: 'small warn-text' }, icon('alert', { size: 14 }), ` Internship dates overlap ${conflicts.map((c) => c.event.title).join(', ')}`) : null,
  );
}

// ---------------------------------------------------------------------------
// Evidence: checklists and monthly reviews
// ---------------------------------------------------------------------------
function evidence(app) {
  const lists = ['resume', 'ledger', 'aggregation', 'studypair'];
  const mk = monthKey(app.today);
  const noteKey = `month:${mk}`;
  const pastMonths = Object.keys(app.state.notes).filter((k) => k.startsWith('month:') && k !== noteKey && app.state.notes[k]).sort().reverse();
  return h(
    'div',
    { class: 'stack' },
    card(
      cardHeader(`Monthly review · ${fmtMonth(app.today)}`, null, 'What improved, what remains weak, which applications progressed, what must change'),
      textarea({ rows: 4, value: app.state.notes[noteKey] || '', placeholder: 'Improved: …\nStill weak: …\nApplications: …\nChange next month: …', onchange: (e) => app.update((s) => { s.notes[noteKey] = e.target.value; }) }),
      pastMonths.length ? h('details', { class: 'missed' }, h('summary', null, `${pastMonths.length} earlier review${pastMonths.length > 1 ? 's' : ''}`), pastMonths.map((k) => h('div', { class: 'past-note' }, h('strong', null, fmtMonth(toDay(`${k.slice(6)}-01`))), h('p', { class: 'pre' }, app.state.notes[k])))) : null,
    ),
    lists.map((id) => {
      const list = CHECKLISTS[id];
      const done = list.items.filter((i) => app.state.checks[`${id}:${i.id}`]).length;
      return card(
        cardHeader(list.title, h('span', { class: 'small muted' }, `${done}/${list.items.length}`), id === 'resume' ? null : 'Tick only when you can answer without notes'),
        progressBar(done / list.items.length, list.title),
        h('div', { class: 'tasks' }, list.items.map((i) => checkbox(!!app.state.checks[`${id}:${i.id}`], (v) => app.update((s) => { s.checks[`${id}:${i.id}`] = v; }), i.text))),
      );
    }),
  );
}
