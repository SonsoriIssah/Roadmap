// Learning tracks (e.g. "Java in 3 weeks"): lessons, video chapters and
// pacing. Pure functions — covered by tests.

import { toDay, isISODate } from './dates.js';

// ---------------------------------------------------------------------------
// Video timestamps
// ---------------------------------------------------------------------------

/** "1:13:20" / "13:20" / "0:45" → seconds, or null */
export function parseTimestamp(s) {
  const m = /^(\d{1,2})(?::(\d{2}))(?::(\d{2}))?$/.exec(String(s).trim());
  if (!m) return null;
  return m[3] !== undefined ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : Number(m[1]) * 60 + Number(m[2]);
}

export function fmtTimestamp(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/**
 * Parse a YouTube chapter list (copied from the video description):
 *   0:00 Intro
 *   1:13:00 - Creating Variables
 *   (2:15:10) Arrays
 * The last chapter ends at `totalSec` (or 15 minutes later if unknown).
 */
export function parseChapters(text, totalSec = null) {
  const out = [];
  const re = /^\s*[[(]?(\d{1,2}(?::\d{2}){1,2})[\])]?\s*[-–—:|.)]?\s*(.+?)\s*$/;
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = re.exec(line);
    if (!m) continue;
    const start = parseTimestamp(m[1]);
    if (start === null) continue;
    const title = m[2].replace(/^[-–—:|]\s*/, '').trim();
    if (!title) continue;
    out.push({ title, start });
  }
  out.sort((a, b) => a.start - b.start);
  const chapters = out.filter((c, i) => i === 0 || c.start > out[i - 1].start);
  chapters.forEach((c, i) => {
    const next = chapters[i + 1];
    c.end = next ? next.start : totalSec && totalSec > c.start ? totalSec : c.start + 15 * 60;
  });
  return chapters;
}

/** Link that opens a YouTube video at a timestamp. */
export function videoLink(url, startSec) {
  if (!url) return '';
  if (!/youtu\.?be/i.test(url) || !startSec) return url;
  const clean = url.replace(/([?&])t=\d+s?&?/, '$1').replace(/[?&]$/, '');
  return `${clean}${clean.includes('?') ? '&' : '?'}t=${startSec}s`;
}

export function lessonMinutes(l) {
  if (Number.isFinite(l.start) && Number.isFinite(l.end) && l.end > l.start) return Math.max(5, Math.round((l.end - l.start) / 60));
  return Math.max(5, Number(l.min) || 30);
}

/**
 * Replace the track's video placeholder lessons with real chapters.
 * Practice tasks from the placeholders are re-attached after the chapter
 * that covers the same topic (matched by keywords).
 */
export function importChapters(track, chapters, { url = '', resource = '', replaceAll = false, makeId }) {
  const lessons = track.lessons || [];
  const firstVideo = lessons.findIndex((l) => l.video);
  const placeholders = replaceAll ? lessons : lessons.filter((l) => l.video);
  const newLessons = chapters.map((c) => ({ id: makeId(), title: c.title, start: c.start, end: c.end, video: true, practice: '' }));

  for (const ph of placeholders) {
    if (!ph.practice || !newLessons.length) continue;
    const keys = (ph.match || []).map((k) => k.toLowerCase());
    let target = -1;
    newLessons.forEach((l, i) => {
      if (keys.some((k) => l.title.toLowerCase().includes(k))) target = i;
    });
    const t = newLessons[target >= 0 ? target : newLessons.length - 1];
    t.practice = t.practice ? `${t.practice} · ${ph.practice}` : ph.practice;
  }

  let next;
  if (replaceAll) next = newLessons;
  else {
    const rest = lessons.filter((l) => !l.video);
    const at = firstVideo < 0 ? 0 : lessons.slice(0, firstVideo).filter((l) => !l.video).length;
    next = [...rest.slice(0, at), ...newLessons, ...rest.slice(at)];
  }
  return { ...track, lessons: next, url: url || track.url, resource: resource || track.resource };
}

// ---------------------------------------------------------------------------
// Plain-text editing:  title | minutes or 1:13:00-2:15:00 | practice
// ---------------------------------------------------------------------------

export function lessonsToText(lessons) {
  const head = '# title | minutes or start-end (video) | practice task';
  return [
    head,
    ...lessons.map((l) => {
      const time = Number.isFinite(l.start) && Number.isFinite(l.end) ? `${fmtTimestamp(l.start)}-${fmtTimestamp(l.end)}` : String(lessonMinutes(l));
      return [l.title, time, l.practice || ''].join(' | ').replace(/ \| $/, '');
    }),
  ].join('\n');
}

export function parseLessonsText(text, makeId, previous = []) {
  const lessons = [];
  const errors = [];
  const prevByTitle = new Map(previous.map((l) => [l.title, l]));
  String(text || '')
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      const [title, time = '', practice = ''] = line.split('|').map((s) => s.trim());
      if (!title) return errors.push({ line: i + 1, message: 'Missing title' });
      const old = prevByTitle.get(title);
      const range = /^(\d{1,2}(?::\d{2}){1,2})\s*[-–]\s*(\d{1,2}(?::\d{2}){1,2})$/.exec(time);
      if (range) {
        const start = parseTimestamp(range[1]);
        const end = parseTimestamp(range[2]);
        if (start === null || end === null || end <= start) return errors.push({ line: i + 1, message: 'Video range must look like 1:13:00-2:15:00' });
        lessons.push({ id: old ? old.id : makeId(), title, start, end, video: true, practice });
      } else if (!time || /^\d+$/.test(time)) {
        lessons.push({ id: old ? old.id : makeId(), title, min: Number(time) || 30, video: old ? !!old.video : false, practice, match: old && old.match });
      } else errors.push({ line: i + 1, message: `"${time}" is neither minutes nor a video range` });
    });
  return { lessons, errors };
}

// ---------------------------------------------------------------------------
// Pacing
// ---------------------------------------------------------------------------

export function trackWindow(track) {
  if (!isISODate(track.start)) return null;
  const start = toDay(track.start);
  const weeks = Math.max(0.5, Number(track.weeks) || 3);
  return { start, end: start + Math.round(weeks * 7) - 1 };
}

/** Minutes of lessons not completed before `day`. */
export function remainingMinutes(track, lessonDone, day) {
  return (track.lessons || []).reduce((sum, l) => {
    const d = lessonDone[l.id];
    return d && isISODate(d) && toDay(d) < day ? sum : d === true ? sum : sum + lessonMinutes(l);
  }, 0);
}

export function isCourseDay(classes, keywords = []) {
  const keys = keywords.map((k) => String(k).toLowerCase()).filter(Boolean);
  return keys.length > 0 && classes.some((c) => keys.some((k) => `${c.code} ${c.title}`.toLowerCase().includes(k)));
}
