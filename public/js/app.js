import { createStore } from './store.js';
import { makeContext, forecast, currentModule } from './engine.js';
import { localToday, toDay, isISODate, fmtDay } from './dates.js';
import { h, mount, icon, toast } from './ui.js';
import * as todayView from './views/today.js';
import * as planView from './views/plan.js';
import * as scheduleView from './views/schedule.js';
import * as trackView from './views/track.js';
import * as settingsView from './views/settings.js';

const VIEWS = {
  today: { mod: todayView, label: 'Today', icon: 'today' },
  plan: { mod: planView, label: 'Plan', icon: 'plan' },
  schedule: { mod: scheduleView, label: 'Schedule', icon: 'schedule' },
  track: { mod: trackView, label: 'Track', icon: 'track' },
  settings: { mod: settingsView, label: 'Settings', icon: 'settings' },
};

function getStorage() {
  try {
    const s = window.localStorage;
    const k = '__roadmap_probe__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

const store = createStore(getStorage());

function parseRoute() {
  const [view, sub] = (location.hash.replace(/^#\/?/, '') || 'today').split('/');
  return { view: VIEWS[view] ? view : 'today', sub: sub || null };
}

const app = {
  store,
  ui: {},
  version: document.documentElement.dataset.version || 'dev',
  installPrompt: null,
  get state() {
    return store.get();
  },
  update: (fn) => store.update(fn),
  nav(path) {
    const target = `#/${path}`;
    if (location.hash === target) render();
    else location.hash = target;
  },
  rerender: () => render({ keepScroll: true }),
};

const main = document.getElementById('main');
const nav = document.getElementById('nav');
const previewBar = document.getElementById('preview');
let lastRouteKey = null;
let renderedDay = null;

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
  const dark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#141413' : '#f7f6f2');
}

function render({ keepScroll } = {}) {
  const state = store.get();
  const route = parseRoute();
  const routeKey = `${route.view}/${route.sub || ''}`;
  const scroll = keepScroll || routeKey === lastRouteKey ? window.scrollY : 0;

  app.realToday = localToday();
  app.today = isISODate(state.settings.previewDate) ? toDay(state.settings.previewDate) : app.realToday;
  app.ctx = makeContext(state);
  app.fc = forecast(state.modules, state.progress, app.today, app.ctx);
  app.current = currentModule(state.modules, state.progress);
  renderedDay = app.realToday;

  applyTheme(state.settings.theme);

  if (isISODate(state.settings.previewDate)) {
    previewBar.hidden = false;
    mount(
      previewBar,
      h('span', null, `Previewing ${fmtDay(app.today, { year: true })}`),
      h('button', { type: 'button', onclick: () => app.update((s) => { s.settings.previewDate = null; }) }, 'Back to today'),
    );
  } else {
    previewBar.hidden = true;
  }

  try {
    mount(main, VIEWS[route.view].mod.render(app, route.sub));
  } catch (err) {
    console.error(err);
    mount(main, h('div', { class: 'card' }, h('h2', { class: 'card-title' }, 'Something went wrong on this screen'), h('p', { class: 'small' }, String(err && err.message)), h('p', { class: 'small muted' }, 'Your data is safe. Try another tab, or restore defaults for the calendar/timetable in Settings if you recently edited them.')));
  }

  for (const a of nav.querySelectorAll('a')) {
    const active = a.dataset.view === route.view;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.title = route.view === 'today' ? 'Roadmap' : `${VIEWS[route.view].label} · Roadmap`;

  window.scrollTo(0, scroll);
  lastRouteKey = routeKey;
}

function buildNav() {
  mount(
    nav,
    Object.entries(VIEWS).map(([key, v]) => h('a', { href: `#/${key}`, dataset: { view: key } }, icon(v.icon, { size: 22 }), h('span', null, v.label))),
  );
}

buildNav();
store.subscribe(() => render({ keepScroll: true }));
window.addEventListener('hashchange', () => render());

// Re-render when the app comes back to the foreground on a new day.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && localToday() !== renderedDay) render({ keepScroll: true });
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(store.get().settings.theme));

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  app.installPrompt = e;
  if (parseRoute().view === 'settings') render({ keepScroll: true });
});

if (store.corrupt) toast('Saved data could not be read, so defaults were loaded.');

render();

// ---------------------------------------------------------------------------
// Offline support and updates
// ---------------------------------------------------------------------------
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const offerUpdate = (worker) =>
        toast('A new version is ready', {
          action: 'Update',
          duration: 12000,
          onAction: () => worker.postMessage({ type: 'SKIP_WAITING' }),
        });
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w);
        });
      });
      // Reload once when an update takes over (not on the very first install).
      const hadController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded || !hadController) return;
        reloaded = true;
        location.reload();
      });
      // Check for a new deploy whenever the app is reopened.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  });
}

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persisted().then((p) => (p ? null : navigator.storage.persist())).catch(() => {});
}
