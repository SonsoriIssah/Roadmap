import { h, card, cardHeader, button, iconButton, chip, segmented, field, textarea, icon, empty, checkbox, progressBar } from '../ui.js';
import { SCORE_AREAS, CHECKLISTS, APP_STATUSES } from '../data/defaults.js';
import { fmtDay, fmtRange, fmtMonth, weekStart, weekKey, toDay, toISO, isISODate, relDays, monthKey } from '../dates.js';
import { decisionHints, scoreTotal, dateConflicts } from '../engine.js';
import { dueProblems, upcomingReviews, patternStats, orderNew, problemsToCSV, reviewTask, stageOf, STAGE_LABEL } from '../problems.js';
import { banner, openAppEditor, eligibilityCount, statusTone } from './common.js';
import { openProblemImport, openManualProblem } from './tasks.js';

export function render(app, sub) {
  const tab = ['score', 'dsa', 'apps', 'evidence'].includes(sub) ? sub : 'score';
  return h(
    'div',
    { class: 'stack' },
    h('header', { class: 'page-head' }, h('h1', null, 'Track')),
    segmented(
      [
        { value: 'score', label: 'Score' },
        { value: 'dsa', label: 'Problems' },
        { value: 'apps', label: 'Applications' },
        { value: 'evidence', label: 'Evidence' },
      ],
      tab,
      (v) => app.nav(`track/${v}`),
      { label: 'Track section' },
    ),
    tab === 'score' ? scorecard(app) : tab === 'dsa' ? problemsTab(app) : tab === 'apps' ? applications(app) : evidence(app),
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
// Problems: your imported sheet, revisits and pattern stats
// ---------------------------------------------------------------------------
function problemsTab(app) {
  const bank = app.state.problems;
  const due = dueProblems(bank, app.today);
  const stats = patternStats(bank);
  const firsts = app.state.dsaLog.filter((e) => e.kind === 'first');
  const solo = firsts.filter((e) => e.independent).length;
  const count = (st) => bank.filter((p) => p.status === st).length;
  const filter = app.ui.problemFilter || 'next';
  const nextOrder = orderNew(bank, app.current && app.current.track === 'dsa' ? app.current.patterns : [], app.state.settings.problemOrder);
  const upcoming = upcomingReviews(bank, app.today);
  const lists = {
    next: nextOrder,
    due,
    upcoming,
    solved: bank.filter((p) => p.status === 'solved'),
  };
  const guessed = bank.some((p) => p.stageGuessed);
  const shown = lists[filter] || [];
  const limit = app.ui.problemAll ? shown.length : 25;

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([problemsToCSV(bank)], { type: 'text/csv' }));
    const a = h('a', { href: url, download: `dsa-progress-${toISO(app.realToday)}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return h(
    'div',
    { class: 'stack' },
    card(
      cardHeader('Problem bank', button(bank.length ? 'Re-import' : 'Import sheet', () => openProblemImport(app), { kind: 'primary', size: 'sm', iconName: 'upload' }), app.state.meta.problemSource ? `From ${app.state.meta.problemSource}` : 'Import your Excel / Google Sheets tracker'),
      bank.length
        ? h('div', { class: 'stats' }, stat(String(count('new')), 'not started'), stat(String(count('solved')), 'solved'), stat(firsts.length ? `${Math.round((solo / firsts.length) * 100)}%` : '—', 'solved alone'))
        : h('p', { class: 'small' }, 'Your daily list picks problems from here: the roadmap topic first, then your sheet’s priority (P0 → P1 → P2) and order. Solved problems come back for spaced revisits.'),
      h('div', { class: 'row-actions wrap' }, button('Add one problem', () => openManualProblem(app), { kind: 'ghost', size: 'sm', iconName: 'plus' }), bank.length ? button('Export progress CSV', exportCsv, { kind: 'ghost', size: 'sm', iconName: 'download' }) : null),
    ),
    guessed ? banner('info', 'Re-import your sheet once', 'Reviews now follow your tracker’s ladder (Solved → Reimplemented → Timed → Mastered). Re-import so each problem’s exact stage comes across; what you ticked in the app is kept.', [button('Re-import', () => openProblemImport(app), { kind: 'primary', size: 'sm', iconName: 'upload' })]) : null,
    card(
      h('p', { class: 'small' }, h('strong', null, 'How reviews work: '), 'tick a problem on your daily list and it counts as solved — its next review is booked straight away (3 days later: reimplement from blank). Each review moves it up your ladder: timed redo → explain aloud → Mastered (every 21 days). Use “How did it go?” for hints, failed attempts or confidence.'),
    ),
    bank.length
      ? card(
          segmented(
            [
              { value: 'next', label: 'Up next' },
              { value: 'due', label: `Due (${due.length})` },
              { value: 'upcoming', label: `Upcoming (${upcoming.length})` },
              { value: 'solved', label: 'Solved' },
            ],
            filter,
            (v) => {
              app.ui.problemFilter = v;
              app.ui.problemAll = false;
              app.rerender();
            },
            { small: true, label: 'Problem filter' },
          ),
          shown.length
            ? h(
                'ul',
                { class: 'list' },
                shown.slice(0, limit).map((p, i) =>
                  h(
                    'li',
                    { class: 'list-row' },
                    h('span', { class: ['result-dot', p.status === 'solved' ? 'ok' : p.status === 'attempted' ? 'miss' : 'new'] }),
                    h(
                      'span',
                      { class: 'grow' },
                      p.url ? h('a', { href: p.url, target: '_blank', rel: 'noopener' }, filter === 'next' ? `${i + 1}. ${p.title}` : p.title) : p.title,
                      h('span', { class: 'small muted block' }, [p.status !== 'new' ? STAGE_LABEL[stageOf(p)] : '', p.difficulty, p.pattern || p.topic, p.priority !== null && p.priority !== undefined ? `P${p.priority}` : ''].filter(Boolean).join(' · ')),
                      p.status !== 'new' && isISODate(p.nextReview) ? h('span', { class: 'small block review-when' }, `${toDay(p.nextReview) <= app.today ? 'Due' : 'Review'} ${relDays(toDay(p.nextReview), app.today)} (${fmtDay(toDay(p.nextReview), { weekday: true })}): ${reviewTask(p).step}`) : null,
                    ),
                  ),
                ),
              )
            : h('p', { class: 'small muted' }, filter === 'due' ? 'Nothing due today. Reviews are added to your daily list on their day.' : filter === 'upcoming' ? 'No reviews booked yet. Tick a problem on your daily list and its review is added here.' : 'None.'),
          shown.length > limit ? button(`Show all ${shown.length}`, () => { app.ui.problemAll = true; app.rerender(); }, { kind: 'ghost', size: 'sm' }) : null,
        )
      : empty('No problems yet. Import your tracker — from Google Sheets use File → Download → Microsoft Excel (.xlsx).', button('Import sheet', () => openProblemImport(app), { kind: 'secondary', size: 'sm' })),
    stats.length
      ? card(
          cardHeader('By pattern', null, 'Most unsolved attempts first — use this for “weakest patterns”'),
          h(
            'ul',
            { class: 'list' },
            stats.map((st) => h('li', { class: 'list-row' }, h('span', { class: 'grow' }, st.pattern, st.attempted ? h('span', { class: 'small warn-text' }, ` · ${st.attempted} unsolved`) : null), h('span', { class: 'small muted' }, `${st.solved}/${st.total}`), h('span', { class: 'pattern-bar' }, h('span', { style: { width: `${Math.round(st.rate * 100)}%` } })))),
          ),
        )
      : null,
  );
}

function stat(value, label) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, value), h('span', { class: 'stat-label' }, label));
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
