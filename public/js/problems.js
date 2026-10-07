// Problem bank: importing your DSA sheet, choosing what to solve next,
// and spaced revisits. Pure functions — no DOM, no storage.

import { isISODate, toDay, toISO } from './dates.js';

// ---------------------------------------------------------------------------
// Sheet detection
// ---------------------------------------------------------------------------

const ROLE_PATTERNS = [
  ['title', /^(problem|question|title|name)\b/],
  ['url', /(link|url)\b/],
  ['lc', /^(lc|leetcode)\s*(#|no\.?|number)/],
  ['pattern', /^pattern\b/],
  ['topic', /^(topic|category|topics)\b/],
  ['difficulty', /^(difficulty|level)\b/],
  ['priority', /^priority\b/],
  ['status', /^(status|current status|progress)\b/],
  ['nextReview', /^next review/],
  ['firstAttempt', /^first attempt/],
  ['lastAttempt', /^(last attempt|last attempted)/],
  ['confidence', /^confidence/],
  ['timeTaken', /^time taken/],
  ['notes', /^(notes?|key insight|mistake)/],
];

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

/** Find the header row and which column holds which field. */
export function detectTable(rows) {
  let best = null;
  const limit = Math.min(rows.length, 15);
  for (let r = 0; r < limit; r++) {
    const row = rows[r] || [];
    const cols = {};
    row.forEach((cell, c) => {
      const h = clean(cell).toLowerCase();
      if (!h) return;
      for (const [role, re] of ROLE_PATTERNS) {
        if (cols[role] === undefined && re.test(h)) {
          cols[role] = c;
          break;
        }
      }
    });
    const score = Object.keys(cols).length;
    if (score >= 2 && (!best || score > best.score)) best = { headerRow: r, cols, score };
  }
  if (!best) return null;

  // Some trackers leave the problem-name column header blank: pick the first
  // blank-headed column whose values are mostly plain text (not links).
  if (best.cols.title === undefined) {
    const header = rows[best.headerRow] || [];
    const data = rows.slice(best.headerRow + 1).filter((r) => r && r.some((c) => clean(c)));
    const width = Math.max(header.length, ...data.map((r) => r.length));
    for (let c = 0; c < width; c++) {
      if (clean(header[c])) continue;
      const vals = data.map((r) => clean(r[c]));
      const text = vals.filter((v) => v && !/^https?:\/\//i.test(v) && !/^-?\d+(\.\d+)?$/.test(v));
      if (data.length && text.length / data.length >= 0.6) {
        best.cols.title = c;
        break;
      }
    }
  }
  if (best.cols.title === undefined) return null;
  return { headerRow: best.headerRow, cols: best.cols };
}

/** Rank the sheets in a workbook that look like problem lists. */
export function candidateSheets(sheets) {
  const out = [];
  for (const s of sheets) {
    const t = detectTable(s.rows);
    if (!t) continue;
    const count = s.rows.slice(t.headerRow + 1).filter((r) => r && clean(r[t.cols.title])).length;
    if (count < 1) continue;
    let score = count + Object.keys(t.cols).length * 5;
    if (t.cols.url !== undefined || Object.keys(s.links || {}).length) score += 20;
    if (t.cols.status !== undefined) score += 10;
    if (/problem|tracker|master|dsa|leetcode|questions/i.test(s.name)) score += 15;
    if (/next|dashboard|timed|log|summary|review/i.test(s.name)) score -= 40;
    out.push({ sheet: s, table: t, count, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

export function slugify(title) {
  return clean(title)
    .toLowerCase()
    .replace(/\(premium\)/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function problemKey(title) {
  return clean(title).toLowerCase().replace(/\(premium\)/g, '').replace(/[^a-z0-9]+/g, '');
}

/**
 * Review stages, following your tracker's status ladder:
 * Attempted → Hint Needed → Solved → Reimplemented → Timed → Mastered.
 */
export const STAGES = ['new', 'attempted', 'hint', 'solved', 'reimplemented', 'timed', 'mastered'];
export const STAGE_LABEL = { new: 'Not Started', attempted: 'Attempted', hint: 'Hint Needed', solved: 'Solved', reimplemented: 'Reimplemented', timed: 'Timed', mastered: 'Mastered' };

export function mapStage(raw) {
  const s = clean(raw).toLowerCase();
  if (!s || /not\s*(started|done|attempted)|^todo|^to do|^new$|^no$|^false$|^-$|^—$/.test(s)) return 'new';
  if (/master/.test(s)) return 'mastered';
  if (/timed/.test(s)) return 'timed';
  if (/reimplement|rewr/.test(s)) return 'reimplemented';
  if (/hint/.test(s)) return 'hint';
  if (/solved|done|complete|^yes$|^true$|✓|✔/.test(s)) return 'solved';
  if (/attempt|progress|stuck|review|learning|started/.test(s)) return 'attempted';
  return 'new';
}

/** The simple three-way status used for choosing problems. */
export function statusOfStage(stage) {
  if (!stage || stage === 'new') return 'new';
  return stage === 'attempted' || stage === 'hint' ? 'attempted' : 'solved';
}

export function mapStatus(raw) {
  return statusOfStage(mapStage(raw));
}

export function mapPriority(raw) {
  const s = clean(raw).toLowerCase();
  const m = /p\s*(\d)/.exec(s);
  if (m) return Number(m[1]);
  if (/high|must/.test(s)) return 0;
  if (/med/.test(s)) return 1;
  if (/low/.test(s)) return 2;
  return null;
}

export function mapDifficulty(raw) {
  const s = clean(raw).toLowerCase();
  if (s.startsWith('e')) return 'Easy';
  if (s.startsWith('m')) return 'Medium';
  if (s.startsWith('h')) return 'Hard';
  return '';
}

/** ISO date from "2026-10-16", an Excel serial number, or "Oct 16, 2026". */
export function mapDate(raw) {
  const s = clean(raw);
  if (!s) return null;
  if (isISODate(s.slice(0, 10))) return s.slice(0, 10);
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const serial = Math.floor(Number(s));
    if (serial > 30000 && serial < 80000) return toISO(serial - 25569); // Excel epoch → Unix days
  }
  const t = Date.parse(s);
  if (Number.isFinite(t) && /\d{4}/.test(s)) {
    const d = new Date(t);
    return toISO(Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000));
  }
  return null;
}

/** Turn a detected sheet into problem records. */
export function rowsToProblems(sheet, table) {
  const { headerRow, cols } = table;
  const get = (row, role) => (cols[role] === undefined ? '' : clean(row[cols[role]]));
  const link = (r, role) => (cols[role] === undefined ? null : sheet.links && sheet.links[`${r},${cols[role]}`]);
  const out = [];
  for (let r = headerRow + 1; r < sheet.rows.length; r++) {
    const row = sheet.rows[r];
    if (!row) continue;
    const title = get(row, 'title');
    if (!title || /^(total|summary)\b/i.test(title)) continue;
    let url = link(r, 'url') || link(r, 'title') || '';
    const urlText = get(row, 'url');
    if (!url && /^https?:\/\//i.test(urlText)) url = urlText;
    // No link in the sheet: a LeetCode number means the slug is reliable;
    // otherwise fall back to a search so the link never 404s.
    if (!url && /^\d+$/.test(get(row, 'lc')) && slugify(title)) url = `https://leetcode.com/problems/${slugify(title)}/`;
    if (!url) url = `https://leetcode.com/problemset/?search=${encodeURIComponent(title.replace(/\(premium\)/i, '').trim())}`;
    out.push({
      title,
      url,
      lc: get(row, 'lc'),
      pattern: get(row, 'pattern'),
      topic: get(row, 'topic'),
      difficulty: mapDifficulty(get(row, 'difficulty')),
      priority: mapPriority(get(row, 'priority')),
      stage: mapStage(get(row, 'status')),
      status: mapStatus(get(row, 'status')),
      nextReview: mapDate(get(row, 'nextReview')),
      firstAttempt: mapDate(get(row, 'firstAttempt')),
      lastAttempt: mapDate(get(row, 'lastAttempt')),
      confidence: /^[1-5]$/.test(get(row, 'confidence')) ? Number(get(row, 'confidence')) : null,
      timeTaken: Number(get(row, 'timeTaken')) || null,
      notes: get(row, 'notes'),
      order: out.length,
    });
  }
  return out;
}

/**
 * Merge imported rows into the bank. Progress recorded in the app wins over
 * the sheet unless the sheet shows a later attempt.
 */
export function mergeProblems(bank, rows, { replace = false, today, makeId }) {
  const byKey = new Map();
  if (!replace) for (const p of bank) byKey.set(problemKey(p.title), { ...p });
  const seen = new Set();
  let added = 0;
  let updated = 0;
  rows.forEach((row, i) => {
    const key = problemKey(row.title);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const prev = byKey.get(key);
    const meta = { title: row.title, url: row.url, lc: row.lc, pattern: row.pattern, topic: row.topic, difficulty: row.difficulty, priority: row.priority, notes: row.notes, order: i, source: 'sheet' };
    if (prev) {
      // Keep what you ticked in the app unless the sheet has a later attempt.
      const touched = isISODate(prev.lastAt);
      const appAhead = touched && prev.status !== 'new' && (!row.lastAttempt || prev.lastAt >= row.lastAttempt);
      const progress = appAhead ? {} : sheetProgress(row, today);
      byKey.set(key, { ...prev, ...meta, ...progress });
      updated++;
    } else {
      byKey.set(key, { id: makeId(), ...meta, ...sheetProgress(row, today) });
      added++;
    }
  });
  // Keep manual problems and earlier sheet rows not in this import, after the sheet's rows.
  const list = [...byKey.values()].sort((a, b) => {
    const ia = seen.has(problemKey(a.title)) ? 0 : 1;
    const ib = seen.has(problemKey(b.title)) ? 0 : 1;
    return ia - ib || (a.order ?? 1e9) - (b.order ?? 1e9);
  });
  list.forEach((p, i) => (p.order = i));
  return { problems: list, added, updated };
}

function sheetProgress(row, today) {
  const stage = row.stage || (row.status === 'solved' ? 'solved' : row.status);
  if (stage === 'new') return { stage: 'new', status: 'new', interval: null, nextReview: null, firstAt: null, lastAt: null, stageGuessed: false };
  const last = row.lastAttempt || row.firstAttempt || null;
  const gap = reviewGap(stage, { confidence: row.confidence });
  // No review date in the sheet: schedule one from the last attempt by the same rules.
  const next = row.nextReview || toISO((last ? toDay(last) : today) + gap);
  return {
    stage,
    status: statusOfStage(stage),
    interval: gap,
    nextReview: next,
    firstAt: row.firstAttempt || last || 'imported',
    lastAt: last || 'imported',
    confidence: row.confidence || null,
    minutes: row.timeTaken || null,
    stageGuessed: false,
  };
}

// ---------------------------------------------------------------------------
// Choosing problems
// ---------------------------------------------------------------------------

export function matchesFocus(p, patterns) {
  if (!patterns || !patterns.length) return false;
  const hay = `${p.pattern} ${p.topic}`.toLowerCase();
  return patterns.some((k) => hay.includes(String(k).toLowerCase()));
}

/**
 * Order untouched problems: within P0/P1, the roadmap's current topic first;
 * then priority; then your sheet's order. P2 and lower come last.
 */
export function orderNew(problems, focusPatterns, mode = 'roadmap') {
  const pr = (p) => (p.priority === null || p.priority === undefined ? 1.5 : p.priority);
  return problems
    .filter((p) => p.status === 'new')
    .map((p) => ({ p, late: pr(p) >= 2 ? 1 : 0, focus: mode === 'roadmap' && matchesFocus(p, focusPatterns) ? 0 : 1 }))
    .sort((a, b) => a.late - b.late || a.focus - b.focus || pr(a.p) - pr(b.p) || (a.p.order ?? 0) - (b.p.order ?? 0))
    .map((x) => x.p);
}

// Reviews -------------------------------------------------------------------
// The same rules as your tracker's Guide sheet: the next review is the last
// attempt plus the first gap that applies.

export const TARGET_MIN = { Easy: 15, Medium: 25, Hard: 40 };

export function targetMinutes(p) {
  return TARGET_MIN[p.difficulty] || 25;
}

export function reviewGap(stage, { confidence = null, overTarget = false } = {}) {
  if (stage === 'mastered') return 21;
  if (stage === 'attempted') return 1;
  if (stage === 'hint') return 2;
  if (confidence && confidence <= 2) return 2;
  if (overTarget) return 3;
  if (stage === 'solved') return 3; // not yet reimplemented from blank
  if (confidence === 3) return 5;
  if (confidence === 4) return 10;
  if (confidence === 5) return 14;
  return stage === 'timed' ? 10 : 5;
}

const NEXT_STAGE = { new: 'solved', attempted: 'solved', hint: 'solved', solved: 'reimplemented', reimplemented: 'timed', timed: 'mastered', mastered: 'mastered' };

export function stageOf(p) {
  if (p.stage && STAGES.includes(p.stage)) return p.stage;
  if (p.status === 'attempted') return 'attempted';
  if (p.status === 'solved') return 'solved';
  return 'new';
}

/** Choices offered by "How did it go?", depending on where the problem is. */
export function outcomeChoices(p, isReview) {
  const stage = stageOf(p);
  if (!isReview) {
    return [
      ['alone', 'Solved on my own', 'review in 3 days: reimplement from blank'],
      ['hints', 'Needed hints', 'review in 2 days'],
      ['failed', "Couldn't solve it", 'try again tomorrow'],
    ];
  }
  const t = reviewTask(p);
  const first = [['clean', `Done — ${t.short}`, `next: ${STAGE_LABEL[NEXT_STAGE[stage]]}`]];
  if (stage === 'reimplemented') first.push(['over', 'Solved, but over the target time', 'redo in 3 days']);
  return [...first, ['hints', 'Needed hints', 'back to Hint Needed, 2 days'], ['failed', "Couldn't solve it", 'back to Attempted, tomorrow']];
}

/**
 * Record an attempt or a review and schedule the next review.
 * outcome: alone | clean | over | hints | failed
 */
export function applyOutcome(p, outcome, day, { confidence = null, minutes = null } = {}) {
  const prevStage = stageOf(p);
  let stage;
  let overTarget = false;
  if (outcome === 'failed') stage = 'attempted';
  else if (outcome === 'hints') stage = 'hint';
  else if (outcome === 'over') {
    stage = prevStage === 'new' ? 'solved' : prevStage;
    overTarget = true;
  } else stage = prevStage === 'new' ? 'solved' : NEXT_STAGE[prevStage];
  const gap = reviewGap(stage, { confidence, overTarget });
  const iso = toISO(day);
  return {
    ...p,
    stage,
    status: statusOfStage(stage),
    interval: gap,
    nextReview: toISO(day + gap),
    firstAt: isISODate(p.firstAt) ? p.firstAt : iso,
    lastAt: iso,
    confidence: confidence || p.confidence || null,
    minutes: minutes || null,
    independent: outcome === 'alone' || outcome === 'clean' || outcome === 'over',
    stageGuessed: false,
  };
}

/** What a review asks you to do at each stage. */
export function reviewTask(p) {
  const stage = stageOf(p);
  const t = targetMinutes(p);
  switch (stage) {
    case 'attempted':
      return { title: `Retry ${p.title}`, step: 'retry it', short: 'solved it this time', desc: 'Solve it without help today.', min: 30 };
    case 'hint':
      return { title: `Re-solve ${p.title} without hints`, step: 're-solve without hints', short: 'solved without hints', desc: 'Fresh editor, no hints, no old code.', min: 25 };
    case 'solved':
      return { title: `Reimplement ${p.title} from a blank editor`, step: 'reimplement from blank', short: 'reimplemented from blank', desc: 'No notes, no peeking at your old solution.', min: 20 };
    case 'reimplemented':
      return { title: `Timed redo: ${p.title} in under ${t} min`, step: `timed redo under ${t} min`, short: `under ${t} min`, desc: 'Start a timer; say the approach before coding.', min: t };
    case 'timed':
      return { title: `Explain ${p.title} aloud, then code it`, step: 'explain aloud, then code it', short: 'explained and coded it', desc: 'Pattern, approach, complexity and edge cases, out loud. Then it counts as Mastered.', min: 20 };
    default:
      return { title: `Review ${p.title} from memory`, step: 'review from memory', short: 'solved from memory', desc: 'Spaced review — mastered problems come back every 21 days.', min: 15 };
  }
}

export function isDue(p, day) {
  return p.status !== 'new' && isISODate(p.nextReview) && toDay(p.nextReview) <= day;
}

export function dueProblems(problems, day) {
  return problems.filter((p) => isDue(p, day)).sort((a, b) => (a.nextReview < b.nextReview ? -1 : a.nextReview > b.nextReview ? 1 : (a.order ?? 0) - (b.order ?? 0)));
}

export function upcomingReviews(problems, day) {
  return problems
    .filter((p) => p.status !== 'new' && isISODate(p.nextReview) && toDay(p.nextReview) > day)
    .sort((a, b) => (a.nextReview < b.nextReview ? -1 : a.nextReview > b.nextReview ? 1 : (a.order ?? 0) - (b.order ?? 0)));
}

export function patternStats(problems) {
  const stats = {};
  for (const p of problems) {
    const k = p.pattern || p.topic || 'Other';
    stats[k] = stats[k] || { pattern: k, total: 0, solved: 0, attempted: 0 };
    stats[k].total++;
    if (p.status === 'solved') stats[k].solved++;
    if (p.status === 'attempted') stats[k].attempted++;
  }
  return Object.values(stats)
    .map((s) => ({ ...s, rate: s.total ? s.solved / s.total : 0 }))
    .sort((a, b) => b.attempted - a.attempted || a.rate - b.rate || b.total - a.total);
}

/** CSV you can paste back into your sheet. */
export function problemsToCSV(problems) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [['Problem', 'Link', 'Pattern', 'Difficulty', 'Priority', 'Status', 'First Attempt', 'Last Attempt', 'Time Taken (min)', 'Confidence (1–5)', 'Next Review'].join(',')];
  for (const p of problems) {
    const date = (d) => (isISODate(d) ? d : '');
    lines.push([p.title, p.url, p.pattern || p.topic, p.difficulty, p.priority === null || p.priority === undefined ? '' : `P${p.priority}`, STAGE_LABEL[stageOf(p)], date(p.firstAt), date(p.lastAt), p.minutes || '', p.confidence || '', date(p.nextReview)].map(esc).join(','));
  }
  return lines.join('\n');
}
