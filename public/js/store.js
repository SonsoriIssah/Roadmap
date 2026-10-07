// App state: one JSON document kept in localStorage, with export/import for
// backups and moving between devices.

import {
  DATA_VERSION, DEFAULT_SETTINGS, DEFAULT_CALENDAR, DEFAULT_TIMETABLES, DEFAULT_MODULES, DEFAULT_TRACKS, MODES, MODULE_PATTERNS,
  JAVA_VIDEO, JAVA_STUDY_LESSONS, OLD_JAVA_PLACEHOLDERS, moshLessons,
} from './data/defaults.js';

export const STORAGE_KEY = 'roadmap.state.v1';

const clone = (v) => JSON.parse(JSON.stringify(v));
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (isObj(v) ? v : {});

export function defaultState() {
  return {
    version: DATA_VERSION,
    settings: clone(DEFAULT_SETTINGS),
    calendar: clone(DEFAULT_CALENDAR),
    timetables: clone(DEFAULT_TIMETABLES),
    modules: clone(DEFAULT_MODULES),
    tracks: clone(DEFAULT_TRACKS),
    problems: [],
    lessonDone: {},
    extra: {},
    progress: {},
    weekOverrides: {},
    sessionsDone: {},
    scorecards: {},
    dsaLog: [],
    applications: [],
    checks: {},
    notes: {},
    dismissed: {},
    meta: { createdAt: new Date().toISOString(), lastBackupAt: null },
  };
}

/**
 * Accept anything (old saves, imported files, partial objects) and return a
 * complete, well-typed state. Unknown keys are dropped; missing keys get defaults.
 */
export function normalise(input) {
  const base = defaultState();
  if (!isObj(input)) return base;
  const raw = migrate(input);
  const settings = { ...base.settings, ...obj(raw.settings) };
  for (const k of ['studyStart', 'studyEnd', 'bufferMin', 'preferredTime', 'maxSessionsPerDay']) delete settings[k];
  settings.daily = {};
  for (const mode of Object.keys(base.settings.daily)) {
    const user = obj(obj(raw.settings && raw.settings.daily)[mode]);
    settings.daily[mode] = {};
    for (const [k, def] of Object.entries(base.settings.daily[mode])) {
      const n = Number(user[k]);
      settings.daily[mode][k] = Number.isFinite(n) && n >= 0 ? n : def;
    }
  }
  if (!['roadmap', 'sheet'].includes(settings.problemOrder)) settings.problemOrder = base.settings.problemOrder;
  settings.pace = { ...base.settings.pace, ...obj(raw.settings && raw.settings.pace) };
  for (const k of Object.keys(settings.pace)) {
    const n = Number(settings.pace[k]);
    settings.pace[k] = Number.isFinite(n) && n >= 0 ? n : base.settings.pace[k] ?? 0;
  }
  if (!MODES[settings.defaultMode]) settings.defaultMode = base.settings.defaultMode;

  const overrides = {};
  for (const [k, v] of Object.entries(obj(raw.weekOverrides))) if (MODES[v]) overrides[k] = v;

  return {
    version: DATA_VERSION,
    settings,
    calendar: Array.isArray(raw.calendar) ? raw.calendar.filter(isObj) : base.calendar,
    timetables: Array.isArray(raw.timetables)
      ? raw.timetables.filter(isObj).map((t) => ({ ...t, sessions: arr(t.sessions).filter(isObj) }))
      : base.timetables,
    modules: Array.isArray(raw.modules) && raw.modules.length ? raw.modules.filter((m) => isObj(m) && m.id) : base.modules,
    tracks: Array.isArray(raw.tracks) ? raw.tracks.filter((t) => isObj(t) && t.id).map((t) => ({ ...t, lessons: arr(t.lessons).filter((l) => isObj(l) && l.id) })) : base.tracks,
    problems: arr(raw.problems).filter((p) => isObj(p) && p.id && p.title),
    lessonDone: obj(raw.lessonDone),
    extra: obj(raw.extra),
    progress: obj(raw.progress),
    weekOverrides: overrides,
    sessionsDone: obj(raw.sessionsDone),
    scorecards: obj(raw.scorecards),
    dsaLog: arr(raw.dsaLog).filter(isObj),
    applications: arr(raw.applications).filter(isObj),
    checks: obj(raw.checks),
    notes: obj(raw.notes),
    dismissed: obj(raw.dismissed),
    meta: { ...base.meta, ...obj(raw.meta) },
  };
}

/** Upgrade data saved by older versions of the app. */
export function migrate(raw) {
  const v = Number(raw.version) || 1;
  if (v >= DATA_VERSION) return raw;
  const out = clone(raw);
  if (v < 2) {
    // Free time before the semester, so early October is planned as a break.
    if (Array.isArray(out.calendar) && out.calendar.some((e) => e && e.id === 'c-teach1') && !out.calendar.some((e) => e && e.id === 'c-pre')) {
      out.calendar.unshift(clone(DEFAULT_CALENDAR.find((e) => e.id === 'c-pre')));
    }
    // Roadmap topics now pick problems from your sheet.
    if (Array.isArray(out.modules)) {
      for (const m of out.modules) if (m && MODULE_PATTERNS[m.id] && !Array.isArray(m.patterns)) m.patterns = [...MODULE_PATTERNS[m.id]];
    }
    // Problems logged in the old DSA log become part of the problem bank.
    if (Array.isArray(out.dsaLog) && !Array.isArray(out.problems)) {
      out.problems = [];
      out.dsaLog.forEach((e, i) => {
        if (!e || !e.title) return;
        const id = `p-m${i}-${String(e.id || i)}`;
        out.problems.push({
          id,
          title: e.title,
          url: e.url || '',
          pattern: e.pattern || '',
          difficulty: e.difficulty ? e.difficulty[0].toUpperCase() + e.difficulty.slice(1) : '',
          priority: null,
          status: e.independent ? 'solved' : 'attempted',
          interval: e.interval === undefined ? null : e.interval,
          nextReview: e.nextReview || null,
          firstAt: e.date || null,
          lastAt: (e.history && e.history.length && e.history[e.history.length - 1].date) || e.date || null,
          source: 'manual',
          order: 10000 + i,
        });
        e.problemId = id;
      });
    }
  }
  if (v < 3) {
    // The Java track moved to Mosh's course: swap the untouched topic
    // placeholders for its chapters and carry over lessons already ticked.
    const java = Array.isArray(out.tracks) ? out.tracks.find((t) => t && t.id === 'java') : null;
    const lessons = java && Array.isArray(java.lessons) ? java.lessons : [];
    const isPlaceholder = (l) => l && l.video && !Number.isFinite(l.start);
    if (lessons.some(isPlaceholder) && !lessons.some((l) => l && Number.isFinite(l.start))) {
      const next = [];
      let inserted = false;
      for (const l of lessons) {
        if (isPlaceholder(l)) {
          if (!inserted) next.push(...moshLessons(), ...clone(JAVA_STUDY_LESSONS.filter((x) => x.id === 'j7' || x.id === 'j8')));
          inserted = true;
        } else next.push(l);
      }
      java.lessons = next;
      if (!java.url) Object.assign(java, JAVA_VIDEO);
      out.lessonDone = obj(out.lessonDone);
      for (const [oldId, newIds] of Object.entries(OLD_JAVA_PLACEHOLDERS)) {
        const date = out.lessonDone[oldId];
        if (date) for (const id of newIds) if (!out.lessonDone[id]) out.lessonDone[id] = date;
      }
    }
  }
  out.version = DATA_VERSION;
  return out;
}

function safeGet(storage) {
  try {
    return storage ? storage.getItem(STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export function loadState(storage) {
  const raw = safeGet(storage);
  if (!raw) return { state: defaultState(), fresh: true };
  try {
    return { state: normalise(JSON.parse(raw)), fresh: false };
  } catch {
    return { state: defaultState(), fresh: true, corrupt: raw };
  }
}

export function saveState(state, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function createStore(storage) {
  const loaded = loadState(storage);
  let state = loaded.state;
  const listeners = new Set();
  let persisted = saveState(state, storage);

  return {
    fresh: loaded.fresh,
    corrupt: loaded.corrupt,
    get: () => state,
    get persisted() {
      return persisted;
    },
    /** Mutate a draft copy; listeners re-render afterwards. */
    update(fn) {
      const draft = clone(state);
      const res = fn(draft);
      state = normalise(res && isObj(res) ? res : draft);
      persisted = saveState(state, storage);
      listeners.forEach((l) => l(state));
    },
    replace(next) {
      state = normalise(next);
      persisted = saveState(state, storage);
      listeners.forEach((l) => l(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function exportJSON(state) {
  return JSON.stringify({ app: 'roadmap', exportedAt: new Date().toISOString(), ...state }, null, 2);
}

/** Parse an exported file. Throws with a readable message on bad input. */
export function importJSON(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isObj(data)) throw new Error('That file does not contain a Roadmap backup.');
  const known = ['settings', 'calendar', 'timetables', 'modules', 'progress', 'applications', 'dsaLog', 'scorecards', 'problems', 'tracks'];
  if (!known.some((k) => k in data)) throw new Error('That file does not contain a Roadmap backup.');
  return normalise(data);
}
