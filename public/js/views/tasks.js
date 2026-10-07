// The numbered daily task list, and the sheets it opens (problem outcomes,
// importing your problem sheet, pasting video chapters, editing lessons).

import { h, button, field, input, select, textarea, openSheet, toast, icon, segmented } from '../ui.js';
import { toISO, toDay, fmtDuration, fmtDay, isISODate } from '../dates.js';
import { planDays } from '../planner.js';
import { applyOutcome, outcomeChoices, reviewTask, stageOf, targetMinutes, STAGE_LABEL, candidateSheets, rowsToProblems, mergeProblems } from '../problems.js';
import { readSpreadsheetFile } from '../xlsx.js';
import { parseChapters, importChapters, parseTimestamp, lessonsToText, parseLessonsText } from '../learn.js';
import { uid } from '../parse.js';
import { setModuleTask, banner } from './common.js';

/** Plan `count` days from `from` (≥ today), using the app's forecast. */
export function planFor(app, from, count, opts = {}) {
  return planDays(Math.max(from, app.today), count, app.state, app.ctx, app.today, { fc: app.fc, current: app.current, ...opts });
}

const TYPE_LABEL = { lesson: 'Learn', problem: 'DSA', revisit: 'Revisit', module: 'Roadmap', kickoff: 'First week', revise: 'Coursework', career: 'Career' };

/** Render a day's items as a numbered (i, ii, iii…) list. */
export function taskList(app, day, { interactive = false } = {}) {
  if (!day.items.length) {
    return h('p', { class: 'muted small' }, day.mode === 'off' ? 'Off — nothing planned.' : 'Nothing planned for this day.');
  }
  return h(
    'ol',
    { class: 'todo' },
    day.items.map((item) => {
      const tick = interactive
        ? h('input', {
            type: 'checkbox',
            class: 'todo-check',
            checked: item.done,
            'aria-label': item.done ? `Mark not done: ${item.title}` : `Mark done: ${item.title}`,
            onchange: (e) => {
              e.target.checked = item.done; // the store decides; some items open a sheet first
              toggleItem(app, item, !item.done);
            },
          })
        : item.done
          ? h('span', { class: 'todo-done', 'aria-label': 'Done' }, icon('check', { size: 14 }))
          : h('span', { class: 'todo-blank', 'aria-hidden': 'true' });
      return h(
        'li',
        { class: ['todo-item', `t-${item.type}`, item.done && 'done'] },
        tick,
        h(
          'div',
          { class: 'todo-body' },
          h('div', { class: 'todo-title' }, item.title),
          item.action ? h('div', { class: 'todo-action' }, item.url ? h('a', { href: item.url, target: '_blank', rel: 'noopener' }, item.action, ' ↗') : item.action) : null,
          item.desc ? h('div', { class: 'todo-desc' }, item.desc) : null,
          item.practice && item.practice.length ? h('ul', { class: 'todo-practice' }, item.practice.map((p) => h('li', null, h('span', { class: 'muted' }, 'Practice: '), p))) : null,
          item.next
            ? h(
                'div',
                { class: 'todo-next' },
                icon('calendar', { size: 14 }),
                h('span', null, item.next),
                interactive ? h('button', { type: 'button', class: 'linkish', onclick: () => openOutcome(app, item.problemId, item.type === 'revisit') }, 'How did it go?') : null,
              )
            : null,
          h(
            'div',
            { class: 'todo-meta' },
            h('span', { class: 'todo-tag' }, TYPE_LABEL[item.type] || item.type),
            item.meta ? h('span', null, item.meta) : null,
            item.min ? h('span', null, fmtDuration(item.min)) : null,
            item.url && !item.action ? h('a', { href: item.url, target: '_blank', rel: 'noopener', class: 'todo-link' }, 'Open ↗') : null,
            interactive && item.type === 'module' && !item.done ? h('button', { type: 'button', class: 'linkish', onclick: () => app.nav('plan') }, 'Plan') : null,
          ),
        ),
      );
    }),
  );
}

// ---------------------------------------------------------------------------
// Ticking items
// ---------------------------------------------------------------------------

export function toggleItem(app, item, done) {
  const iso = toISO(app.today);
  switch (item.type) {
    case 'lesson':
      app.update((s) => {
        for (const id of item.lessonIds) {
          if (done) s.lessonDone[id] = iso;
          else delete s.lessonDone[id];
        }
      });
      if (done) toast('Lesson done. Tomorrow continues from the next one.');
      break;
    case 'problem':
    case 'revisit':
      // Ticked = solved (or the review step done). The review is booked at
      // once; "How did it go?" adjusts it for hints, failures or confidence.
      if (done) {
        const p = recordOutcome(app, item.problemId, item.type === 'revisit' ? 'clean' : 'alone', item.type === 'revisit');
        if (p) toast(`${reviewSummary(p)}`, { action: 'How did it go?', onAction: () => openOutcome(app, item.problemId, item.type === 'revisit'), duration: 6000 });
      } else undoAttempt(app, item.problemId);
      break;
    case 'module':
      setModuleTask(app, item.moduleId, item.task, done);
      if (done) toast(item.task === 'exit' ? `${item.moduleId} complete. Forecast updated.` : 'Objective done. The exit task is next.');
      break;
    default:
      app.update((s) => {
        if (done) s.checks[item.key] = iso;
        else delete s.checks[item.key];
      });
  }
}

function reviewSummary(p) {
  if (!isISODate(p.nextReview)) return 'Recorded.';
  return `${STAGE_LABEL[stageOf(p)]} · review ${fmtDay(toDay(p.nextReview))}: ${reviewTask(p).step}`;
}

/** Today's log entry for a problem (the attempt being adjusted), if any. */
function todaysEntry(s, problemId, iso) {
  for (let i = s.dsaLog.length - 1; i >= 0; i--) {
    const e = s.dsaLog[i];
    if (e.problemId === problemId && e.date === iso && e.prev) return i;
  }
  return -1;
}

/**
 * Apply an outcome for today. Re-recording replaces today's earlier outcome
 * (it starts again from the problem as it was this morning).
 */
function recordOutcome(app, problemId, outcome, isRevisit, opts = {}) {
  let result = null;
  app.update((s) => {
    const iso = toISO(app.today);
    const pi = s.problems.findIndex((x) => x.id === problemId);
    if (pi < 0) return;
    const li = todaysEntry(s, problemId, iso);
    const base = li >= 0 ? s.dsaLog[li].prev : s.problems[pi];
    const next = applyOutcome(base, outcome, app.today, opts);
    s.problems[pi] = next;
    const entry = { id: li >= 0 ? s.dsaLog[li].id : uid('l'), problemId, title: base.title, pattern: base.pattern || base.topic || '', date: iso, kind: isRevisit ? 'revisit' : 'first', outcome, independent: next.independent, minutes: Number(opts.minutes) || 0, confidence: opts.confidence || null, prev: base };
    if (li >= 0) s.dsaLog[li] = entry;
    else s.dsaLog.push(entry);
    result = next;
  });
  return result;
}

function openOutcome(app, problemId, isRevisit) {
  const iso = toISO(app.today);
  const li = todaysEntry(app.state, problemId, iso);
  const current = app.state.problems.find((x) => x.id === problemId);
  if (!current) return;
  const base = li >= 0 ? app.state.dsaLog[li].prev : current;
  const logged = li >= 0 ? app.state.dsaLog[li] : null;
  let minutes = logged && logged.minutes ? String(logged.minutes) : '';
  let confidence = logged && logged.confidence ? logged.confidence : null;
  const confRow = h('div');
  const renderConf = () =>
    confRow.replaceChildren(
      segmented(['1', '2', '3', '4', '5'].map((v) => ({ value: v, label: v })), confidence ? String(confidence) : '', (v) => { confidence = Number(v); renderConf(); }, { small: true, label: 'Confidence' }),
    );
  renderConf();
  const t = targetMinutes(base);
  openSheet({
    title: isRevisit ? reviewTask(base).title : base.title,
    body: (close) =>
      h(
        'div',
        { class: 'form-grid' },
        h('p', { class: 'small muted' }, [base.difficulty, base.pattern || base.topic, `target ${t} min`].filter(Boolean).join(' · ')),
        h('div', { class: 'form-row' }, field('Minutes taken', input({ type: 'number', min: '0', inputmode: 'numeric', value: minutes, oninput: (e) => (minutes = e.target.value) })), h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Confidence (1–5)'), confRow)),
        h('p', { class: 'small muted' }, 'Same rules as your tracker: low confidence brings it back in 2 days; 3 → 5 days, 4 → 10, 5 → 14.'),
        h(
          'div',
          { class: 'choice-list' },
          outcomeChoices(base, isRevisit).map(([key, label, hint], i) =>
            button(`${label} — ${hint}`, () => {
              const p = recordOutcome(app, problemId, key, isRevisit, { minutes: Number(minutes) || null, confidence });
              close();
              if (p) toast(reviewSummary(p));
            }, { kind: i === 0 ? 'primary' : 'secondary' }),
          ),
        ),
      ),
  });
}

function undoAttempt(app, problemId) {
  app.update((s) => {
    const iso = toISO(app.today);
    const idx = [...s.dsaLog].reverse().findIndex((e) => e.problemId === problemId && e.date === iso && e.prev);
    const i = idx < 0 ? -1 : s.dsaLog.length - 1 - idx;
    const pi = s.problems.findIndex((x) => x.id === problemId);
    if (i >= 0 && pi >= 0) {
      s.problems[pi] = s.dsaLog[i].prev;
      s.dsaLog.splice(i, 1);
    }
  });
}

// ---------------------------------------------------------------------------
// Import your problem sheet (.xlsx / .csv)
// ---------------------------------------------------------------------------

export function openProblemImport(app) {
  const fileInput = h('input', { type: 'file', accept: '.xlsx,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv', class: 'visually-hidden' });
  const area = h('div', { class: 'stack-sm' });
  let state = null;
  let replace = !app.state.problems.length;
  let pick = 0;

  const renderPreview = () => {
    if (!state) return;
    const cand = state.cands[pick];
    const rows = rowsToProblems(cand.sheet, cand.table);
    const counts = { new: 0, attempted: 0, solved: 0 };
    rows.forEach((r) => counts[r.status]++);
    const cols = Object.keys(cand.table.cols).filter((c) => c !== 'notes').join(', ');
    area.replaceChildren(
      state.cands.length > 1 ? field('Sheet', h('select', { class: 'input', onchange: (e) => { pick = Number(e.target.value); renderPreview(); } }, state.cands.map((c, i) => h('option', { value: String(i), selected: i === pick }, `${c.sheet.name} — ${c.count} problems`)))) : null,
      h('p', { class: 'small' }, h('strong', null, `${rows.length} problems`), ` · ${counts.solved} solved · ${counts.attempted} attempted · ${counts.new} not started`),
      h('p', { class: 'small muted' }, `Columns found: ${cols}`),
      h('ol', { class: 'tight small' }, rows.slice(0, 5).map((r) => h('li', null, r.title, h('span', { class: 'muted' }, ` · ${[r.pattern || r.topic, r.difficulty, r.priority !== null ? `P${r.priority}` : ''].filter(Boolean).join(' · ')}`)))),
      app.state.problems.length
        ? segmented([{ value: 'merge', label: 'Merge (keep app progress)' }, { value: 'replace', label: 'Replace all' }], replace ? 'replace' : 'merge', (v) => { replace = v === 'replace'; renderPreview(); }, { small: true, label: 'Import mode' })
        : null,
    );
  };

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    area.replaceChildren(h('p', { class: 'small muted' }, `Reading ${file.name}…`));
    try {
      const sheets = await readSpreadsheetFile(file);
      const cands = candidateSheets(sheets);
      if (!cands.length) throw new Error('No problem list found. The sheet needs a column called Problem, Question, Title or Name.');
      state = { cands, name: file.name };
      pick = 0;
      renderPreview();
    } catch (err) {
      state = null;
      area.replaceChildren(banner('critical', 'Could not read that file', err.message || String(err)));
    }
  });

  openSheet({
    title: 'Import your DSA sheet',
    submitLabel: 'Import',
    body: h(
      'div',
      { class: 'form-grid' },
      h('p', { class: 'small' }, 'Use your Excel file, or in Google Sheets: File → Download → Microsoft Excel (.xlsx). Problem names, links (including “Open ↗” links), patterns, priority, status and next-review dates are read. Re-import any time to sync statuses.'),
      button('Choose .xlsx or .csv file', () => fileInput.click(), { kind: 'secondary', iconName: 'upload' }),
      fileInput,
      area,
    ),
    onSubmit: () => {
      if (!state) {
        toast('Choose a file first');
        return false;
      }
      const cand = state.cands[pick];
      const rows = rowsToProblems(cand.sheet, cand.table);
      let res;
      app.update((s) => {
        res = mergeProblems(s.problems, rows, { replace, today: app.today, makeId: () => uid('p') });
        s.problems = res.problems;
        s.meta.problemSource = `${state.name} · ${cand.sheet.name}`;
      });
      toast(`Imported ${rows.length} problems (${res.added} new, ${res.updated} updated)`);
    },
  });
}

export function openManualProblem(app) {
  openSheet({
    title: 'Add a problem',
    submitLabel: 'Add',
    body: h(
      'div',
      { class: 'form-grid' },
      field('Problem', input({ name: 'title', placeholder: 'Merge Intervals' })),
      field('Link', input({ name: 'url', type: 'url', inputmode: 'url', placeholder: 'https://' })),
      h('div', { class: 'form-row' }, field('Pattern', input({ name: 'pattern', placeholder: 'Intervals' })), field('Difficulty', select(['Easy', 'Medium', 'Hard'], 'Medium', { name: 'difficulty' }))),
      field('Priority', select([{ value: '0', label: 'P0' }, { value: '1', label: 'P1' }, { value: '2', label: 'P2' }], '1', { name: 'priority' })),
    ),
    onSubmit: (form) => {
      const title = form.elements.title.value.trim();
      if (!title) {
        toast('Name the problem');
        return false;
      }
      app.update((s) => {
        s.problems.push({ id: uid('p'), title, url: form.elements.url.value.trim(), pattern: form.elements.pattern.value.trim(), difficulty: form.elements.difficulty.value, priority: Number(form.elements.priority.value), status: 'new', order: s.problems.length, source: 'manual' });
      });
      toast('Added to your problem bank');
    },
  });
}

// ---------------------------------------------------------------------------
// Learning tracks: video chapters and lesson editing
// ---------------------------------------------------------------------------

export function openChapterImport(app, track) {
  const errBox = h('div', { class: 'errors' });
  openSheet({
    title: 'Paste video chapters',
    submitLabel: 'Use these chapters',
    body: h(
      'div',
      { class: 'form-grid' },
      h('p', { class: 'small' }, 'Paste the video’s chapter list from its description (lines like “26:02 Variables”), or the whole transcript from YouTube’s “Show transcript” — chapter titles are picked out automatically. Your daily list will then say exactly which minutes to watch.'),
      field('Video link', input({ name: 'url', type: 'url', inputmode: 'url', value: track.url || '', placeholder: 'https://www.youtube.com/watch?v=…' })),
      h('div', { class: 'form-row' }, field('Short name', input({ name: 'resource', value: track.resource || '', placeholder: 'Mosh' }), 'Shown as “Watch Mosh 26:02 → 34:32”.'), field('Video length', input({ name: 'videoLength', placeholder: '3:30:00' }), 'Sets the last chapter’s end.')),
      field('Chapters', textarea({ name: 'chapters', rows: 10, class: 'input mono', placeholder: '0:00 Introduction\n1:48 Installing Java\n…\n26:02 Variables', spellcheck: 'false', autocapitalize: 'off' })),
      h('label', { class: 'check-inline' }, h('input', { type: 'checkbox', name: 'replaceAll' }), ' Replace every lesson (otherwise only the video chapters are replaced; methods, OOP, collections and the rest stay)'),
      errBox,
    ),
    onSubmit: (form) => {
      const total = parseTimestamp(form.elements.videoLength.value.trim() || '') || null;
      const chapters = parseChapters(form.elements.chapters.value, total);
      if (chapters.length < 2) {
        errBox.replaceChildren(banner('critical', 'No chapters found', 'Each line should start with a timestamp, e.g. “1:13:00 Creating Variables”.'));
        return false;
      }
      app.update((s) => {
        const i = s.tracks.findIndex((t) => t.id === track.id);
        s.tracks[i] = importChapters(s.tracks[i], chapters, { url: form.elements.url.value.trim(), resource: form.elements.resource.value.trim(), replaceAll: form.elements.replaceAll.checked, makeId: () => uid('v') });
      });
      toast(`${chapters.length} chapters added. Your daily lists now show exact timestamps.`);
    },
  });
}

export function openLessonsEditor(app, track) {
  const errBox = h('div', { class: 'errors' });
  openSheet({
    title: `${track.name} lessons`,
    submitLabel: 'Save lessons',
    body: h(
      'div',
      { class: 'form-grid' },
      h('p', { class: 'small muted' }, 'One lesson per line: title | minutes or video range (1:13:00-2:15:00) | practice task. Reorder by moving lines.'),
      textarea({ name: 'text', rows: 16, class: 'input mono', value: lessonsToText(track.lessons), spellcheck: 'false', autocapitalize: 'off' }),
      errBox,
    ),
    onSubmit: (form) => {
      const { lessons, errors } = parseLessonsText(form.elements.text.value, () => uid('j'), track.lessons);
      if (errors.length) {
        errBox.replaceChildren(banner('critical', `${errors.length} line(s) need fixing`, h('ul', { class: 'tight' }, errors.slice(0, 6).map((x) => h('li', null, `Line ${x.line}: ${x.message}`)))));
        return false;
      }
      app.update((s) => {
        s.tracks.find((t) => t.id === track.id).lessons = lessons;
      });
      toast(`${lessons.length} lessons saved`);
    },
  });
}

export function openNewTrack(app) {
  openSheet({
    title: 'New learning track',
    submitLabel: 'Create',
    body: h(
      'div',
      { class: 'form-grid' },
      field('Name', input({ name: 'name', placeholder: 'Spring Boot' })),
      h('div', { class: 'form-row' }, field('Start', input({ name: 'start', type: 'date', value: toISO(app.today) })), field('Weeks', input({ name: 'weeks', type: 'number', min: '1', max: '26', value: '3', inputmode: 'numeric' }))),
      field('Related course keywords', input({ name: 'keywords', placeholder: 'database, sql' }), 'Days with a matching lecture get more of this track.'),
    ),
    onSubmit: (form) => {
      const name = form.elements.name.value.trim();
      if (!name || !isISODate(form.elements.start.value)) {
        toast('Add a name and start date');
        return false;
      }
      app.update((s) => {
        s.tracks.push({ id: uid('track'), name, start: form.elements.start.value, weeks: Math.max(1, Number(form.elements.weeks.value) || 3), active: true, keywords: form.elements.keywords.value.split(',').map((k) => k.trim()).filter(Boolean), resource: '', url: '', lessons: [] });
      });
      toast('Track created. Add lessons with “Edit lessons” or paste video chapters.');
    },
  });
}

export function trackSummary(app, track, finish, win) {
  const done = track.lessons.filter((l) => app.state.lessonDone[l.id]).length;
  const total = track.lessons.length;
  const target = win ? win.end : null;
  let status = '';
  if (done === total && total) status = 'Complete';
  else if (finish && target) status = finish <= target ? `On track: done ${fmtDay(finish, { weekday: false })} (target ${fmtDay(target, { weekday: false })})` : `Behind: done ${fmtDay(finish, { weekday: false })}, ${finish - target} days after target`;
  else if (target) status = `Target ${fmtDay(target, { weekday: false })}`;
  return { done, total, status, late: finish && target && finish > target };
}

