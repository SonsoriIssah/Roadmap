// Tiny DOM helpers. Text is always inserted as text nodes, so anything you
// type into the app is never interpreted as HTML.

export function h(tag, props, ...children) {
  const el = tag === 'svg' || tag === 'path' || tag === 'circle' || tag === 'rect' || tag === 'line' || tag === 'polyline' || tag === 'g' || tag === 'text' || tag === 'title'
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' && 'value' in el) el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled' || k === 'open') el[k] = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false || c === true) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

export function mount(el, ...children) {
  el.replaceChildren();
  append(el, children);
}

// ---------------------------------------------------------------------------
// Icons (24px stroke icons)
// ---------------------------------------------------------------------------
const ICONS = {
  today: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  plan: 'M4 6h10M4 12h16M4 18h7M18 4l2 2-2 2M15 16l2 2 4-4',
  schedule: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4M8 14h3M13 14h3M8 17h3',
  track: 'M4 19V9M10 19V5M16 19v-7M22 19H2',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  chevL: 'M15 18l-6-6 6-6',
  chevR: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12l5 5L20 7',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  info: 'M12 16v-4M12 8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  book: 'M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4zM18 20H8',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  text: 'M4 6h16M4 12h16M4 18h10',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  calendar: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4',
};

export function icon(name, { size = 20, label } = {}) {
  const svg = h('svg', {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 1.8,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': label ? null : 'true',
    role: label ? 'img' : null,
    'aria-label': label || null,
    class: 'icon',
  });
  svg.appendChild(h('path', { d: ICONS[name] || ICONS.info }));
  return svg;
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

export function button(label, onClick, { kind = 'secondary', size, iconName, title, disabled, type = 'button' } = {}) {
  return h(
    'button',
    { type, class: ['btn', `btn-${kind}`, size && `btn-${size}`], onclick: onClick, title, 'aria-label': !label && title ? title : null, disabled },
    iconName && icon(iconName, { size: size === 'sm' ? 16 : 18 }),
    label && h('span', null, label),
  );
}

export function iconButton(name, onClick, title, extra = {}) {
  return h('button', { type: 'button', class: ['icon-btn', extra.class], onclick: onClick, title, 'aria-label': title, disabled: extra.disabled }, icon(name, { size: 18 }));
}

export function segmented(options, value, onChange, { label, small } = {}) {
  return h(
    'div',
    { class: ['seg', small && 'seg-sm'], role: 'radiogroup', 'aria-label': label },
    options.map((o) => {
      const opt = typeof o === 'string' ? { value: o, label: o } : o;
      const active = opt.value === value;
      return h(
        'button',
        {
          type: 'button',
          role: 'radio',
          'aria-checked': active ? 'true' : 'false',
          class: ['seg-btn', active && 'active'],
          dataset: opt.mode ? { mode: opt.mode } : null,
          // Stop the click here: the control re-renders on change, and a click
          // that reaches an enclosing <label> would be re-sent to its first button.
          onclick: (e) => {
            e.stopPropagation();
            onChange(opt.value);
          },
        },
        opt.label,
      );
    }),
  );
}

export function checkbox(checked, onChange, labelChildren, { sub } = {}) {
  const input = h('input', {
    type: 'checkbox',
    checked,
    onchange: (e) => {
      label.classList.toggle('checked', e.target.checked);
      onChange(e.target.checked);
    },
  });
  const label = h('label', { class: ['check', checked && 'checked'] }, input, h('span', { class: 'check-box', 'aria-hidden': 'true' }, icon('check', { size: 14 })), h('span', { class: 'check-text' }, labelChildren, sub && h('span', { class: 'check-sub' }, sub)));
  return label;
}

export function field(label, control, hint) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), control, hint && h('span', { class: 'field-hint' }, hint));
}

export function input(props) {
  return h('input', { class: 'input', ...props });
}

export function select(options, value, props = {}) {
  return h(
    'select',
    { class: 'input', ...props },
    options.map((o) => {
      const opt = typeof o === 'string' ? { value: o, label: o } : o;
      return h('option', { value: opt.value, selected: opt.value === value }, opt.label);
    }),
  );
}

export function textarea(props) {
  return h('textarea', { class: 'input', rows: 3, ...props });
}

export function chip(text, { mode, tone, title } = {}) {
  return h('span', { class: ['chip', tone && `tone-${tone}`], dataset: mode ? { mode } : null, title }, mode && h('span', { class: 'dot', 'aria-hidden': 'true' }), text);
}

export function card(...children) {
  return h('section', { class: 'card' }, ...children);
}

export function cardHeader(title, right, sub) {
  return h('div', { class: 'card-head' }, h('div', null, h('h2', { class: 'card-title' }, title), sub && h('p', { class: 'card-sub' }, sub)), right && h('div', { class: 'card-actions' }, right));
}

export function progressBar(fraction, label) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label }, h('span', { style: { width: `${pct}%` } }));
}

export function empty(text, action) {
  return h('div', { class: 'empty' }, h('p', null, text), action);
}

// ---------------------------------------------------------------------------
// Dialogs and toasts
// ---------------------------------------------------------------------------

/**
 * Open a modal sheet. `body` is a node or a function receiving `close`.
 * `onSubmit` (if given) receives the form element; return false to keep open.
 */
export function openSheet({ title, body, submitLabel, onSubmit, danger, extraActions, onClose }) {
  const dlg = h('dialog', { class: 'sheet' });
  const close = () => {
    dlg.close();
  };
  dlg.addEventListener('close', () => {
    dlg.remove();
    if (onClose) onClose();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });

  const form = h('form', { method: 'dialog', class: 'sheet-form', novalidate: true });
  const content = typeof body === 'function' ? body(close) : body;
  form.append(
    h('header', { class: 'sheet-head' }, h('h2', null, title), iconButton('x', close, 'Close')),
    h('div', { class: 'sheet-body' }, content),
  );
  if (onSubmit || extraActions) {
    form.append(
      h(
        'footer',
        { class: 'sheet-foot' },
        typeof extraActions === 'function' ? extraActions(close) : extraActions,
        h('span', { class: 'spacer' }),
        button('Cancel', close, { kind: 'ghost' }),
        onSubmit && button(submitLabel || 'Save', null, { kind: danger ? 'danger' : 'primary', type: 'submit' }),
      ),
    );
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!onSubmit) return close();
    const res = onSubmit(form);
    if (res !== false) close();
  });
  dlg.append(form);
  document.body.append(dlg);
  dlg.showModal();
  const first = dlg.querySelector('.sheet-body input, .sheet-body select, .sheet-body textarea');
  if (first && !('ontouchstart' in window)) first.focus();
  return { close, form, dialog: dlg };
}

export function confirmSheet(message, { title = 'Are you sure?', confirmLabel = 'Confirm', danger = true } = {}) {
  return new Promise((resolve) => {
    let ok = false;
    openSheet({
      title,
      body: h('p', null, message),
      submitLabel: confirmLabel,
      danger,
      onSubmit: () => {
        ok = true;
      },
      onClose: () => resolve(ok),
    });
  });
}

let toastTimer = null;
export function toast(message, { action, onAction, duration = 3500 } = {}) {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  mount(el, h('span', null, message), action && h('button', { type: 'button', class: 'toast-action', onclick: () => { el.classList.remove('show'); onAction && onAction(); } }, action));
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

/** Read form fields by name into a plain object. */
export function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else out[el.name] = el.value.trim();
  }
  return out;
}
