import { h, card, cardHeader, button, segmented, field, input, select, toast, confirmSheet, icon } from '../ui.js';
import { MODES, MODE_ORDER, DEFAULT_CALENDAR, DEFAULT_TIMETABLES, DEFAULT_MODULES, DEFAULT_SETTINGS, DEFAULT_TRACKS, DAILY_FIELDS } from '../data/defaults.js';
import { isISODate, toISO, fmtDay, toDay } from '../dates.js';
import { exportJSON, importJSON, defaultState } from '../store.js';

const clone = (v) => JSON.parse(JSON.stringify(v));

export function render(app) {
  const s = app.state.settings;
  const set = (patch, msg) => {
    app.update((st) => {
      Object.assign(st.settings, patch);
    });
    if (msg) toast(msg);
  };

  return h(
    'div',
    { class: 'stack' },
    h('header', { class: 'page-head' }, h('h1', null, 'Settings')),
    installCard(app),

    card(
      cardHeader('Appearance'),
      segmented(
        [
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ],
        s.theme,
        (v) => set({ theme: v }),
        { label: 'Theme' },
      ),
    ),

    card(
      cardHeader('Workload', null, 'How many roadmap modules each kind of week can carry. The forecast uses these.'),
      h(
        'div',
        { class: 'pace-grid' },
        MODE_ORDER.map((m) =>
          h(
            'label',
            { class: 'pace-row', dataset: { mode: m } },
            h('span', { class: 'dot', 'aria-hidden': 'true' }),
            h('span', { class: 'grow' }, h('strong', null, MODES[m].label), h('span', { class: 'small muted block' }, `${MODES[m].hours} of career prep`)),
            input({
              type: 'number',
              min: '0',
              max: '5',
              step: '0.1',
              inputmode: 'decimal',
              value: String(s.pace[m]),
              class: 'input input-sm',
              'aria-label': `${MODES[m].label} modules per week`,
              onchange: (e) => {
                const v = Math.max(0, Math.min(5, Number(e.target.value) || 0));
                app.update((st) => {
                  st.settings.pace[m] = v;
                });
              },
            }),
            h('span', { class: 'small muted' }, '/wk'),
          ),
        ),
      ),
      h(
        'div',
        { class: 'form-row' },
        field('Days not in any calendar period', select(MODE_ORDER.map((m) => ({ value: m, label: MODES[m].label })), s.defaultMode, { onchange: (e) => set({ defaultMode: e.target.value }) })),
        field('Heavy days before exams', input({ type: 'number', min: '0', max: '21', value: String(s.preExamDays), inputmode: 'numeric', onchange: (e) => set({ preExamDays: Math.max(0, Math.min(21, Number(e.target.value) || 0)) }) }), '0 turns the rule off.'),
      ),
    ),

    dailyCard(app),

    card(
      cardHeader('Plan dates'),
      h(
        'div',
        { class: 'form-row' },
        field('Plan started', input({ type: 'date', value: s.planStart, onchange: (e) => isISODate(e.target.value) && set({ planStart: e.target.value }) })),
        field('Target finish', input({ type: 'date', value: s.targetEnd, onchange: (e) => isISODate(e.target.value) && set({ targetEnd: e.target.value }) })),
      ),
      field(
        'Preview the app as if today were…',
        h(
          'div',
          { class: 'inline' },
          input({ type: 'date', value: s.previewDate || '', onchange: (e) => set({ previewDate: isISODate(e.target.value) ? e.target.value : null }, isISODate(e.target.value) ? 'Previewing a different date' : null) }),
          s.previewDate ? button('Back to real date', () => set({ previewDate: null }, 'Back to today'), { kind: 'ghost', size: 'sm' }) : null,
        ),
        'See how exam weeks or next semester will look. Nothing is changed.',
      ),
    ),

    dataCard(app),
    resetCard(app),
    aboutCard(app),
  );
}

function dailyCard(app) {
  const s = app.state.settings;
  const modes = ['break', 'normal', 'heavy', 'exam'];
  const setVal = (mode, key, v) =>
    app.update((st) => {
      st.settings.daily[mode][key] = Math.max(0, Math.min(600, Number(v) || 0));
    });
  return card(
    cardHeader('Daily list', null, 'How much goes on each day’s list, by kind of week. Free days before the semester count as Break.'),
    h(
      'div',
      { class: 'load-table', role: 'table', 'aria-label': 'Daily load by mode' },
      h('div', { class: 'load-row load-head', role: 'row' }, h('span', { role: 'columnheader' }, ''), modes.map((m) => h('span', { role: 'columnheader', class: 'load-mode', dataset: { mode: m } }, h('span', { class: 'dot' }), MODES[m].short))),
      DAILY_FIELDS.map((f) =>
        h(
          'div',
          { class: 'load-row', role: 'row' },
          h('span', { role: 'rowheader', class: 'small' }, f.label, f.unit ? h('span', { class: 'muted' }, ` (${f.unit})`) : null),
          modes.map((m) =>
            input({
              type: 'number',
              min: '0',
              max: '600',
              inputmode: 'numeric',
              value: String(s.daily[m][f.key]),
              class: 'input input-xs',
              'aria-label': `${f.label}, ${MODES[m].short}`,
              onchange: (e) => setVal(m, f.key, e.target.value),
            }),
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'form-row' },
      field('Lecture-day boost', select([{ value: '1', label: 'None' }, { value: '1.5', label: '1.5×' }, { value: '2', label: '2×' }, { value: '3', label: '3×' }], String(s.courseBoost), { onchange: (e) => app.update((st) => { st.settings.courseBoost = Number(e.target.value); }) }), 'More Java on CSM 281 days.'),
      field('Problem order', select([{ value: 'roadmap', label: 'Roadmap topic first' }, { value: 'sheet', label: 'My sheet’s order' }], s.problemOrder, { onchange: (e) => app.update((st) => { st.settings.problemOrder = e.target.value; }) }), 'Both respect P0 → P1 → P2.'),
    ),
  );
}

function installCard(app) {
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  if (standalone || navigator.standalone) return null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return card(
    cardHeader('Install on your phone', null, 'Works offline and opens from your home screen like an app.'),
    app.installPrompt
      ? button('Install app', async () => {
          app.installPrompt.prompt();
          await app.installPrompt.userChoice;
          app.installPrompt = null;
          app.rerender();
        }, { kind: 'primary', iconName: 'download' })
      : h(
          'ol',
          { class: 'tight small' },
          ios
            ? [h('li', null, 'Open this page in Safari.'), h('li', null, 'Tap the Share button.'), h('li', null, 'Choose “Add to Home Screen”.')]
            : [h('li', null, 'Open this page in Chrome.'), h('li', null, 'Tap the ⋮ menu.'), h('li', null, 'Choose “Install app” or “Add to Home screen”.')],
        ),
  );
}

function dataCard(app) {
  const meta = app.state.meta || {};
  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    class: 'visually-hidden',
    onchange: async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const next = importJSON(await file.text());
        if (await confirmSheet('Replace everything on this device with the backup?', { title: 'Restore backup', confirmLabel: 'Restore' })) {
          app.store.replace(next);
          toast('Backup restored');
        }
      } catch (err) {
        toast(err.message || 'Could not read that file');
      }
    },
  });

  const doExport = async () => {
    const json = exportJSON(app.state);
    const name = `roadmap-backup-${toISO(app.realToday)}.json`;
    const file = typeof File === 'function' ? new File([json], name, { type: 'application/json' }) : null;
    let shared = false;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Roadmap backup' });
        shared = true;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    if (!shared) {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = h('a', { href: url, download: name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    app.update((s) => {
      s.meta.lastBackupAt = new Date().toISOString();
    });
    toast('Backup saved');
  };

  return card(
    cardHeader('Your data', null, 'Everything is stored on this device only. Back up to move to a new phone or recover from a cleared browser.'),
    h('p', { class: 'small' }, meta.lastBackupAt ? `Last backup: ${fmtDay(toDay(meta.lastBackupAt.slice(0, 10)), { year: true })}` : 'No backup yet.'),
    !app.store.persisted ? h('p', { class: 'small warn-text' }, icon('alert', { size: 14 }), ' This browser is blocking storage — changes will be lost when you close the app.') : null,
    h('div', { class: 'row-actions wrap' }, button('Back up', doExport, { kind: 'primary', iconName: 'download' }), button('Restore', () => fileInput.click(), { kind: 'secondary', iconName: 'upload' }), fileInput),
  );
}

function resetCard(app) {
  const reset = async (what, msg, fn) => {
    if (await confirmSheet(msg, { title: `Reset ${what}`, confirmLabel: 'Reset' })) {
      app.update(fn);
      toast(`${what[0].toUpperCase()}${what.slice(1)} reset`);
    }
  };
  return card(
    cardHeader('Reset', null, 'Restore the KNUST 2026/27 defaults.'),
    h(
      'div',
      { class: 'row-actions wrap' },
      button('Calendar', () => reset('calendar', 'Replace your calendar with the KNUST 2026/27 calendar?', (s) => { s.calendar = clone(DEFAULT_CALENDAR); }), { kind: 'secondary', size: 'sm' }),
      button('Timetable', () => reset('timetable', 'Replace all timetables with the Group 1 first-semester timetable?', (s) => { s.timetables = clone(DEFAULT_TIMETABLES); }), { kind: 'secondary', size: 'sm' }),
      button('Roadmap modules', () => reset('roadmap', 'Restore the original modules and order? Progress on modules with the same id is kept.', (s) => { s.modules = clone(DEFAULT_MODULES); }), { kind: 'secondary', size: 'sm' }),
      button('Java track', () => reset('Java track', 'Restore the default Java lessons? Pasted video chapters are removed.', (s) => { s.tracks = [...s.tracks.filter((t) => t.id !== 'java'), clone(DEFAULT_TRACKS[0])]; }), { kind: 'secondary', size: 'sm' }),
      button('Settings', () => reset('settings', 'Restore default settings?', (s) => { s.settings = clone(DEFAULT_SETTINGS); }), { kind: 'secondary', size: 'sm' }),
      button('Everything', () => reset('everything', 'Erase all progress, applications and logs on this device? Back up first if unsure.', () => defaultState()), { kind: 'ghost-danger', size: 'sm' }),
    ),
  );
}

function aboutCard(app) {
  return card(
    cardHeader('About'),
    h('p', { class: 'small' }, 'Roadmap re-plans itself from your calendar, timetable, problem sheet and progress every time you open it. When the university changes dates or your timetable changes, edit them in Schedule — daily lists, the forecast and alerts follow.'),
    h('p', { class: 'small muted' }, `Version ${app.version || 'dev'}`),
  );
}
