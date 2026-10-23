// Sync between your devices through a secret GitHub Gist — no server of our own.
// Each device remembers the copy it last synced (the base) and merges three
// ways: what changed here, what changed on the other device, and the base.
// Lists of items with ids are merged item by item, so a problem solved on the
// phone and a lesson ticked on the laptop are both kept. When both devices
// changed the same thing, the more recent edit wins.

import { normalise } from './store.js';

export const SYNC_FILE = 'roadmap-state.json';
const SYNC_DESC = 'Roadmap app sync data (managed by the app)';
const CONFIG_KEY = 'roadmap.sync.v1';
const BASE_KEY = 'roadmap.sync.base.v1';
const API = 'https://api.github.com';
export const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Roadmap%20sync';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** JSON with sorted keys, so equal data compares equal whatever the key order. */
function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (isObj(v)) return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  return v === undefined ? 'undefined' : JSON.stringify(v);
}
export const same = (a, b) => stable(a) === stable(b);

// ---------------------------------------------------------------------------
// Merging
// ---------------------------------------------------------------------------

// Items in these lists only make sense whole (a problem's stage and its next
// review belong together), so a conflict keeps one side's item entirely.
const ATOMIC_ITEMS = new Set(['problems', 'dsaLog']);
// Settings that describe this device, not your plan.
const DEVICE_ONLY_SETTINGS = ['previewDate'];

const keyOf = (item) => (isObj(item) ? item.id ?? item.code : undefined);
const keyed = (...lists) => lists.every((l) => l === undefined || (Array.isArray(l) && l.every((i) => keyOf(i) !== undefined)));

function merge3(base, local, remote, path, prefer) {
  if (same(local, remote)) return local;
  if (same(local, base)) return remote;
  if (same(remote, base)) return local;
  // Both sides changed it.
  if (isObj(local) && isObj(remote) && !(path.length === 2 && ATOMIC_ITEMS.has(path[0]))) {
    const b = isObj(base) ? base : {};
    const out = {};
    for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      const v = merge3(b[k], local[k], remote[k], [...path, k], prefer);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  if (Array.isArray(local) && Array.isArray(remote) && keyed(base, local, remote)) {
    const index = (l) => new Map((l || []).map((i) => [String(keyOf(i)), i]));
    const [b, l, r] = [index(base), index(local), index(remote)];
    const order = [...l.keys(), ...[...r.keys()].filter((k) => !l.has(k))];
    const out = [];
    for (const k of order) {
      const v = merge3(b.get(k), l.get(k), r.get(k), [...path, k], prefer);
      if (v !== undefined) out.push(v);
    }
    return out;
  }
  return prefer(path, local, remote) === 'remote' ? remote : local;
}

/**
 * Merge two copies of the app state. `base` is the copy both last agreed on
 * (null on a device's first sync, which then keeps everything from both).
 */
export function mergeStates(base, local, remote) {
  const editedL = (local.meta && local.meta.edited) || {};
  const editedR = (remote.meta && remote.meta.edited) || {};
  // A device that has never been used takes the other device's data as it is.
  // (Saves from before sync have no edit times, so also check for progress.)
  if (!base && !Object.keys(editedL).length && !hasProgress(local)) return keepDeviceSettings(remote, local);

  const newer = (section) => ((editedR[section] || '') > (editedL[section] || '') ? 'remote' : 'local');
  const prefer = (path, l, r) => {
    if (path[0] === 'problems' && isObj(l) && isObj(r)) {
      const at = (p) => String(p.lastAt || p.firstAt || '');
      if (at(l) !== at(r)) return at(r) > at(l) ? 'remote' : 'local';
    }
    return newer(path[0]);
  };

  const out = {};
  const b = base || {};
  for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    if (k === 'meta' || k === 'version') continue;
    const v = merge3(b[k], local[k], remote[k], [k], prefer);
    if (v !== undefined) out[k] = v;
  }
  const edited = { ...editedL };
  for (const [k, t] of Object.entries(editedR)) if (!edited[k] || t > edited[k]) edited[k] = t;
  const latest = (k) => [local.meta && local.meta[k], remote.meta && remote.meta[k]].filter(Boolean).sort().pop() || null;
  out.meta = { ...remote.meta, ...local.meta, edited, lastBackupAt: latest('lastBackupAt') };
  out.version = Math.max(Number(local.version) || 0, Number(remote.version) || 0);
  return keepDeviceSettings(out, local);
}

const count = (v) => (Array.isArray(v) ? v.length : isObj(v) ? Object.keys(v).length : 0);
function hasProgress(s) {
  return ['problems', 'dsaLog', 'lessonDone', 'checks', 'applications', 'progress', 'scorecards'].some((k) => count(s[k]) > 0);
}

function keepDeviceSettings(state, local) {
  const settings = { ...state.settings };
  for (const k of DEVICE_ONLY_SETTINGS) settings[k] = local.settings ? local.settings[k] ?? null : null;
  return { ...state, settings };
}

/** The copy that goes to the gist: no device-only settings. */
export function shareable(state) {
  const settings = { ...state.settings };
  for (const k of DEVICE_ONLY_SETTINGS) settings[k] = null;
  return { ...state, settings };
}

// ---------------------------------------------------------------------------
// Config and base copy (kept on this device only, never synced)
// ---------------------------------------------------------------------------

function read(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
function write(key, v) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // Storage blocked: sync still works for this session.
  }
}

export const syncConfig = () => read(CONFIG_KEY) || {};
export const saveSyncConfig = (cfg) => write(CONFIG_KEY, cfg);
export const isSyncOn = () => !!syncConfig().token;

/** Forget the token and base on this device. The gist itself is kept. */
export function disconnectSync() {
  write(CONFIG_KEY, null);
  write(BASE_KEY, null);
}

// ---------------------------------------------------------------------------
// GitHub Gist API
// ---------------------------------------------------------------------------

async function gh(token, path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Could not reach GitHub. Check your connection.');
  }
  if (!res.ok) {
    const msg = res.status === 401 ? 'GitHub rejected the token. Create a new one with the gist scope.'
      : res.status === 403 ? 'GitHub refused the request (token scope or rate limit).'
      : res.status === 404 ? 'The sync gist was not found.'
      : `GitHub returned an error (${res.status}).`;
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return res.json();
}

/** The gist this app syncs to, if the account already has one. */
export async function findSyncGist(token) {
  for (let page = 1; page <= 5; page++) {
    const list = await gh(token, `/gists?per_page=100&page=${page}`);
    const hit = list.find((g) => g.files && g.files[SYNC_FILE]);
    if (hit) return hit.id;
    if (list.length < 100) return null;
  }
  return null;
}

async function readGist(token, id) {
  const g = await gh(token, `/gists/${id}`);
  const f = g.files && g.files[SYNC_FILE];
  if (!f) return null;
  if (!f.truncated) return f.content;
  const res = await fetch(f.raw_url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not download the sync data from GitHub.');
  return res.text();
}

const createGist = async (token, content) => (await gh(token, '/gists', { method: 'POST', body: { description: SYNC_DESC, public: false, files: { [SYNC_FILE]: { content } } } })).id;
const writeGist = (token, id, content) => gh(token, `/gists/${id}`, { method: 'PATCH', body: { files: { [SYNC_FILE]: { content } } } });

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

let running = null;

/**
 * Pull the gist, merge it with this device, save the result here and push it
 * back. Calls made while a sync is running share it.
 * Returns { status: 'off' | 'ok' | 'error', pulled, pushed, error }.
 */
export function syncNow(store) {
  if (!running) running = runSync(store).finally(() => (running = null));
  return running;
}

async function runSync(store) {
  const cfg = syncConfig();
  if (!cfg.token) return { status: 'off' };
  try {
    let gistId = cfg.gistId || (await findSyncGist(cfg.token));
    let remote = null;
    if (gistId) {
      try {
        const text = await readGist(cfg.token, gistId);
        remote = text ? normalise(JSON.parse(text)) : null;
      } catch (err) {
        if (err.status !== 404) throw err;
        gistId = null; // deleted on GitHub: start a new one from this device
      }
    }
    // Read this device's state only now, after the network wait.
    const local = store.get();
    const merged = remote ? normalise(mergeStates(read(BASE_KEY), local, remote)) : local;
    const pulled = !same(merged, local);
    if (pulled) store.replace(merged);
    const out = shareable(merged);
    const content = JSON.stringify(out);
    let pushed = false;
    if (!gistId) {
      gistId = await createGist(cfg.token, content);
      pushed = true;
    } else if (!remote || !same(out, shareable(remote))) {
      await writeGist(cfg.token, gistId, content);
      pushed = true;
    }
    write(BASE_KEY, out);
    saveSyncConfig({ ...syncConfig(), gistId, lastSync: new Date().toISOString(), error: null });
    return { status: 'ok', pulled, pushed };
  } catch (err) {
    saveSyncConfig({ ...syncConfig(), error: err.message });
    return { status: 'error', error: err };
  }
}
