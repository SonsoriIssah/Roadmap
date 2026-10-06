// Plain-text formats for bulk editing the timetable and calendar.
// One entry per line, fields separated by "|". Lines starting with # are ignored.
//
// Timetable:  Mon | 08:00-09:55 | CSM 273 | Linear and Numerical Algebra | G. O. Fosu | SCB-SF20
// Calendar:   2026-12-14 | 2026-12-18 | midsem | Mid-semester examinations

import { isISODate, isTime, toMin, WEEKDAYS } from './dates.js';
import { KINDS } from './data/defaults.js';

const DAY_ALIASES = {
  mon: 0, monday: 0, tue: 1, tues: 1, tuesday: 1, wed: 2, weds: 2, wednesday: 2,
  thu: 3, thur: 3, thurs: 3, thursday: 3, fri: 4, friday: 4, sat: 5, saturday: 5, sun: 6, sunday: 6,
};

const KIND_ALIASES = {
  teaching: 'teaching', lectures: 'teaching', classes: 'teaching',
  midsem: 'midsem', 'mid-sem': 'midsem', 'mid-semester': 'midsem', midterm: 'midsem',
  exam: 'exam', exams: 'exam', examinations: 'exam', final: 'exam', finals: 'exam',
  break: 'break', holiday: 'break', vacation: 'break', recess: 'break',
  semester: 'semester', admin: 'admin', registration: 'admin', deadline: 'admin',
  milestone: 'milestone', event: 'milestone',
};

let counter = 0;
export function uid(prefix = 'id') {
  counter = (counter + 1) % 1e6;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normaliseTime(t) {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(t.trim());
  if (!m) return null;
  const s = `${m[1].padStart(2, '0')}:${m[2]}`;
  return isTime(s) ? s : null;
}

function splitLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((raw, i) => ({ raw: raw.trim(), line: i + 1 }))
    .filter((l) => l.raw && !l.raw.startsWith('#'));
}

export function parseTimetableText(text) {
  const sessions = [];
  const errors = [];
  for (const { raw, line } of splitLines(text)) {
    const f = raw.split('|').map((s) => s.trim());
    if (f.length < 3) {
      errors.push({ line, message: 'Expected at least: day | start-end | code' });
      continue;
    }
    const day = DAY_ALIASES[f[0].toLowerCase()];
    if (day === undefined) {
      errors.push({ line, message: `Unknown day "${f[0]}"` });
      continue;
    }
    const tm = f[1].split(/\s*[-–—]\s*|\s+to\s+/i);
    const start = tm[0] && normaliseTime(tm[0]);
    const end = tm[1] && normaliseTime(tm[1]);
    if (!start || !end) {
      errors.push({ line, message: `Times must look like 08:00-09:55 (got "${f[1]}")` });
      continue;
    }
    if (toMin(end) <= toMin(start)) {
      errors.push({ line, message: 'End time must be after start time' });
      continue;
    }
    sessions.push({ id: uid('s'), day, start, end, code: f[2] || '', title: f[3] || '', lecturer: f[4] || '', venue: f[5] || '' });
  }
  return { sessions, errors };
}

export function timetableToText(sessions = []) {
  const header = '# day | start-end | code | title | lecturer | venue';
  const rows = [...sessions]
    .sort((a, b) => a.day - b.day || (a.start < b.start ? -1 : 1))
    .map((c) => [WEEKDAYS[c.day], `${c.start}-${c.end}`, c.code, c.title, c.lecturer, c.venue].map((v) => v || '').join(' | ').replace(/(\s\|\s)+$/, ''));
  return [header, ...rows].join('\n');
}

export function parseCalendarText(text) {
  const events = [];
  const errors = [];
  for (const { raw, line } of splitLines(text)) {
    const f = raw.split('|').map((s) => s.trim());
    if (f.length < 4) {
      errors.push({ line, message: 'Expected: start | end | kind | title' });
      continue;
    }
    const [start, endRaw, kindRaw, ...rest] = f;
    const end = endRaw || start;
    if (!isISODate(start) || !isISODate(end)) {
      errors.push({ line, message: 'Dates must be YYYY-MM-DD' });
      continue;
    }
    if (end < start) {
      errors.push({ line, message: 'End date is before start date' });
      continue;
    }
    const kind = KIND_ALIASES[kindRaw.toLowerCase()];
    if (!kind || !KINDS[kind]) {
      errors.push({ line, message: `Unknown kind "${kindRaw}". Use: ${Object.keys(KINDS).join(', ')}` });
      continue;
    }
    const title = rest.join(' | ').trim();
    if (!title) {
      errors.push({ line, message: 'Missing title' });
      continue;
    }
    events.push({ id: uid('c'), start, end, kind, title });
  }
  return { events, errors };
}

export function calendarToText(events = []) {
  const header = `# start | end | kind (${Object.keys(KINDS).join('/')}) | title`;
  const rows = [...events]
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
    .map((e) => [e.start, e.end, e.kind, e.title].join(' | '));
  return [header, ...rows].join('\n');
}
