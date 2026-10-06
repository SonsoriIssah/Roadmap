// App state: one JSON document kept in localStorage, with export/import for
// backups and moving between devices.

import {
  DATA_VERSION, DEFAULT_SETTINGS, DEFAULT_CALENDAR, DEFAULT_TIMETABLES, DEFAULT_MODULES, MODES,
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
export function normalise(raw) {
  const base = defaultState();
  if (!isObj(raw)) return base;
  const settings = { ...base.settings, ...obj(raw.settings) };
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
  const known = ['settings', 'calendar', 'timetables', 'modules', 'progress', 'applications', 'dsaLog', 'scorecards'];
  if (!known.some((k) => k in data)) throw new Error('That file does not contain a Roadmap backup.');
  return normalise(data);
}
