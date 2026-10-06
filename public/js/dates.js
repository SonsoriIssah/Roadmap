// Date helpers. Every date is handled as a "day number" (days since 1970-01-01)
// so arithmetic never trips over time zones or daylight saving.

const MS_PER_DAY = 86400000;

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(s) {
  if (typeof s !== 'string') return false;
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** 'YYYY-MM-DD' -> day number. Throws on invalid input. */
export function toDay(iso) {
  if (!isISODate(iso)) throw new Error(`Invalid date: ${iso}`);
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** day number -> 'YYYY-MM-DD' */
export function toISO(day) {
  const dt = new Date(day * MS_PER_DAY);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The device's local calendar date as a day number. */
export function localToday(now = new Date()) {
  return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_PER_DAY);
}

/** 0 = Monday ... 6 = Sunday */
export function weekdayIndex(day) {
  // 1970-01-01 was a Thursday (index 3 when Monday = 0).
  return (((day + 3) % 7) + 7) % 7;
}

export function weekStart(day) {
  return day - weekdayIndex(day);
}

export function weekKey(day) {
  return toISO(weekStart(day));
}

export function addDays(day, n) {
  return day + n;
}

export function parts(day) {
  const dt = new Date(day * MS_PER_DAY);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
}

export function monthKey(day) {
  const { y, m } = parts(day);
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

export function lastDayOfMonth(day) {
  const { y, m } = parts(day);
  return Math.round(Date.UTC(y, m + 1, 0) / MS_PER_DAY);
}

/** e.g. "Mon 19 Oct" */
export function fmtDay(day, { weekday = true, year = false } = {}) {
  const { y, m, d } = parts(day);
  const bits = [];
  if (weekday) bits.push(WEEKDAYS[weekdayIndex(day)]);
  bits.push(String(d), MONTHS[m]);
  if (year) bits.push(String(y));
  return bits.join(' ');
}

export function fmtMonth(day, { year = true } = {}) {
  const { y, m } = parts(day);
  return year ? `${MONTHS[m]} ${y}` : MONTHS[m];
}

/** e.g. "19–25 Oct", "28 Dec – 3 Jan" */
export function fmtRange(a, b, { year = false } = {}) {
  if (a === b) return fmtDay(a, { weekday: false, year });
  const pa = parts(a);
  const pb = parts(b);
  const yr = year ? ` ${pb.y}` : '';
  if (pa.y === pb.y && pa.m === pb.m) return `${pa.d}–${pb.d} ${MONTHS[pb.m]}${yr}`;
  const ya = year && pa.y !== pb.y ? ` ${pa.y}` : '';
  return `${pa.d} ${MONTHS[pa.m]}${ya} – ${pb.d} ${MONTHS[pb.m]}${yr}`;
}

/** Human countdown: "today", "tomorrow", "in 5 days", "3 days ago" */
export function relDays(target, today) {
  const n = target - today;
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  if (n > 0) return n < 14 ? `in ${n} days` : `in ${Math.round(n / 7)} weeks`;
  return -n < 14 ? `${-n} days ago` : `${Math.round(-n / 7)} weeks ago`;
}

// ---- Clock times ("HH:MM") as minutes after midnight ----

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isTime(s) {
  return typeof s === 'string' && TIME_RE.test(s);
}

export function toMin(hhmm) {
  if (!isTime(hhmm)) throw new Error(`Invalid time: ${hhmm}`);
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMin(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function fmtDuration(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
