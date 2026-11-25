// Small dependency-free SVG line chart: your progress against the plan line.
// Two series, one axis, a crosshair tooltip, direct labels and a table view.

import { h } from '../ui.js';
import { fmtDay, toISO, parts } from '../dates.js';

const W = 360;
const H = 200;
const M = { top: 12, right: 52, bottom: 24, left: 34 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A rounded axis maximum just above v (115 -> 120, 37 -> 40), so the gridline at half stays a round number. */
function niceMax(v) {
  if (v <= 0) return 1;
  const unit = 10 ** Math.floor(Math.log10(v));
  for (const f of [0.1, 0.2, 0.25, 0.5, 1]) if (Math.ceil(v / (unit * f)) <= 6) return Math.ceil(v / (unit * f)) * unit * f;
  return Math.ceil(v / unit) * unit;
}

/**
 * series: [{ name, values: number[] (null = no data), cls, dashed }]
 * days: day numbers matching the values; fmt(value) formats a number.
 */
export function lineChart({ title, days, series, fmt = (v) => String(Math.round(v)), yMax = null, today = null }) {
  const n = days.length;
  const max = yMax ?? niceMax(Math.max(1, ...series.flatMap((s) => s.values.filter((v) => v !== null))));
  const x = (i) => M.left + (n > 1 ? (i / (n - 1)) * (W - M.left - M.right) : 0);
  const y = (v) => H - M.bottom - (v / max) * (H - M.top - M.bottom);
  const pathOf = (values) => {
    let d = '';
    values.forEach((v, i) => {
      if (v === null) return;
      d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    });
    return d;
  };

  // Recessive gridlines and axis labels: 0, half and max; month starts on x.
  const grid = [0, max / 2, max].map((v) =>
    h('g', null,
      h('line', { class: 'chart-grid', x1: M.left, x2: W - M.right, y1: y(v), y2: y(v) }),
      h('text', { class: 'chart-axis', x: M.left - 6, y: y(v) + 3.5, 'text-anchor': 'end' }, fmt(v)),
    ),
  );
  const months = [];
  // Month starts, plus the first month when its label has room before the next.
  const firstStart = days.findIndex((d) => parts(d).d === 1);
  days.forEach((d, i) => {
    const { m, d: dom } = parts(d);
    const roomy = i === 0 && (firstStart < 0 || x(firstStart) - x(0) > 34);
    if (dom === 1 || roomy) months.push(h('text', { class: 'chart-axis', x: x(i), y: H - 8, 'text-anchor': i === 0 ? 'start' : 'middle' }, MONTHS[m]));
  });

  // Lines, with an end dot and a direct label where each one stops.
  const marks = series.map((s) => {
    const last = s.values.reduce((acc, v, i) => (v !== null ? i : acc), -1);
    if (last < 0) return null;
    return h('g', null,
      h('path', { class: ['chart-line', s.cls, s.dashed && 'dashed'], d: pathOf(s.values) }),
      h('circle', { class: ['chart-dot', s.cls], cx: x(last), cy: y(s.values[last]), r: 4 }),
      h('text', { class: 'chart-label', x: x(last) + 7, y: y(s.values[last]) + 4 }, `${s.name} ${fmt(s.values[last])}`),
    );
  });
  const todayIdx = today === null ? -1 : days.indexOf(today);
  const todayLine = todayIdx >= 0 ? h('line', { class: 'chart-today', x1: x(todayIdx), x2: x(todayIdx), y1: M.top, y2: H - M.bottom }) : null;

  // Crosshair and tooltip: snap to the nearest day, list every series.
  const cross = h('line', { class: 'chart-cross', x1: 0, x2: 0, y1: M.top, y2: H - M.bottom, visibility: 'hidden' });
  const tip = h('div', { class: 'chart-tip', hidden: true, role: 'status' });
  const show = (i) => {
    i = Math.max(0, Math.min(n - 1, i));
    cross.setAttribute('x1', x(i));
    cross.setAttribute('x2', x(i));
    cross.setAttribute('visibility', 'visible');
    tip.replaceChildren(
      h('strong', null, fmtDay(days[i], { weekday: false, year: true })),
      ...series.map((s) => h('span', { class: 'chart-tip-row' }, h('span', { class: ['chart-key', s.cls, s.dashed && 'dashed'] }), `${s.name}: ${s.values[i] === null ? '—' : fmt(s.values[i])}`)),
    );
    tip.hidden = false;
    const left = (x(i) / W) * 100;
    tip.style.left = `${Math.min(70, Math.max(0, left - 15))}%`;
    svg.dataset.index = String(i);
  };
  const hide = () => {
    cross.setAttribute('visibility', 'hidden');
    tip.hidden = true;
  };
  const indexAt = (evt) => {
    const box = svg.getBoundingClientRect();
    const px = ((evt.clientX - box.left) / box.width) * W;
    return Math.round(((px - M.left) / (W - M.left - M.right)) * (n - 1));
  };
  const hit = h('rect', { class: 'chart-hit', x: M.left, y: M.top, width: W - M.left - M.right, height: H - M.top - M.bottom });
  const svg = h(
    'svg',
    {
      class: 'chart',
      viewBox: `0 0 ${W} ${H}`,
      role: 'img',
      'aria-label': `${title}: ${series.map((s) => `${s.name} ${fmt(s.values.filter((v) => v !== null).pop() ?? 0)}`).join(', ')}. Use the left and right arrow keys to read values.`,
      tabindex: 0,
      onpointermove: (e) => show(indexAt(e)),
      onpointerdown: (e) => show(indexAt(e)),
      onpointerleave: hide,
      onblur: hide,
      onkeydown: (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const cur = svg.dataset.index ? Number(svg.dataset.index) : Math.max(0, todayIdx);
        show(cur + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 7 : 1));
      },
    },
    grid,
    months,
    todayLine,
    marks,
    cross,
    hit,
  );

  // Legend (always shown for two series) and a weekly table for screen readers.
  const legend = h('div', { class: 'legend' }, series.map((s) => h('span', { class: 'legend-item' }, h('span', { class: ['chart-key', s.cls, s.dashed && 'dashed'], 'aria-hidden': 'true' }), s.name)));
  const rows = days.map((d, i) => ({ d, i })).filter(({ d, i }) => i === 0 || i === n - 1 || d === today || (d - days[0]) % 7 === 0);
  const table = h(
    'details',
    { class: 'chart-table' },
    h('summary', { class: 'small muted' }, 'Show as a table'),
    h('table', null,
      h('thead', null, h('tr', null, h('th', null, 'Date'), series.map((s) => h('th', null, s.name)))),
      h('tbody', null, rows.map(({ d, i }) => h('tr', { class: d === today ? 'is-today' : null }, h('td', null, fmtDay(d, { weekday: false })), series.map((s) => h('td', null, s.values[i] === null ? '—' : fmt(s.values[i])))))),
    ),
  );
  return h('figure', { class: 'chart-wrap', 'data-start': toISO(days[0]) }, legend, h('div', { class: 'chart-frame' }, svg, tip), table);
}
