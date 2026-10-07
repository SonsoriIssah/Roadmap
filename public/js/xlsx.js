// Minimal spreadsheet readers with no dependencies:
//  - .xlsx (Excel, or Google Sheets → Download → Microsoft Excel)
//  - .csv
// Only what a problem list needs: cell text, and links (hyperlink cells or
// =HYPERLINK formulas). Styles, merged cells and charts are ignored.

const td = new TextDecoder('utf-8');

// ---------------------------------------------------------------------------
// ZIP
// ---------------------------------------------------------------------------

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== 'function') {
    throw new Error('This browser cannot read .xlsx files. Export the sheet as CSV instead.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Read a zip archive into a Map of path → bytes (only entries `want` accepts). */
export async function unzip(input, want = () => true) {
  const buf = input instanceof Uint8Array ? input : new Uint8Array(input);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('That file is not a valid .xlsx workbook.');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const out = new Map();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('The workbook is damaged (bad zip directory).');
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = td.decode(buf.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!want(name)) continue;
    const lNameLen = dv.getUint16(local + 26, true);
    const lExtraLen = dv.getUint16(local + 28, true);
    const start = local + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(start, start + csize);
    if (method === 0) out.set(name, data);
    else if (method === 8) out.set(name, await inflateRaw(data));
    else throw new Error(`Unsupported compression in ${name}.`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// XML helpers (regex-based: workbook XML is machine-written and regular)
// ---------------------------------------------------------------------------

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
    const k = e.toLowerCase();
    if (k === 'amp') return '&';
    if (k === 'lt') return '<';
    if (k === 'gt') return '>';
    if (k === 'quot') return '"';
    if (k === 'apos') return "'";
    const code = k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : m;
  });
}

function attrs(s) {
  const out = {};
  const re = /([\w:]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(s))) out[m[1]] = decodeEntities(m[2]);
  return out;
}

function textRuns(xml) {
  let s = '';
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g;
  let m;
  while ((m = re.exec(xml))) s += m[1] ? decodeEntities(m[1]) : '';
  return s;
}

export function colIndex(ref) {
  const letters = /^[A-Z]+/i.exec(ref)[0].toUpperCase();
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function rowIndex(ref) {
  return Number(/\d+/.exec(ref)[0]) - 1;
}

function relsMap(xml) {
  const map = {};
  if (!xml) return map;
  const re = /<Relationship\b([^>]*)\/?>/g;
  let m;
  while ((m = re.exec(xml))) {
    const a = attrs(m[1]);
    map[a.Id] = a.Target;
  }
  return map;
}

function resolvePath(base, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

function parseFormulaLink(f) {
  const m = /HYPERLINK\(\s*"((?:[^"]|"")*)"\s*(?:[,;]\s*"((?:[^"]|"")*)")?/i.exec(f);
  if (!m) return null;
  return { url: m[1].replace(/""/g, '"'), text: m[2] !== undefined ? m[2].replace(/""/g, '"') : null };
}

function parseSheet(xml, shared, rels) {
  const rows = [];
  const links = {};
  const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let m;
  while ((m = cellRe.exec(xml))) {
    const a = attrs(m[1]);
    if (!a.r) continue;
    const r = rowIndex(a.r);
    const c = colIndex(a.r);
    const inner = m[2] || '';
    const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
    const f = /<f\b[^>]*>([\s\S]*?)<\/f>/.exec(inner);
    let text = '';
    if (a.t === 's') text = v ? shared[Number(v[1])] ?? '' : '';
    else if (a.t === 'inlineStr') text = textRuns(inner);
    else if (a.t === 'b') text = v ? (v[1] === '1' ? 'TRUE' : 'FALSE') : '';
    else if (v) text = decodeEntities(v[1]);
    if (f) {
      const link = parseFormulaLink(decodeEntities(f[1]));
      if (link) {
        links[`${r},${c}`] = link.url;
        if (!text && link.text !== null) text = link.text;
      }
    }
    (rows[r] = rows[r] || [])[c] = text;
  }
  const hlRe = /<hyperlink\b([^>]*?)\/?>/g;
  while ((m = hlRe.exec(xml))) {
    const a = attrs(m[1]);
    const id = a['r:id'] || a.id;
    if (!a.ref || !id || !rels[id]) continue;
    const [from, to] = a.ref.split(':');
    const r0 = rowIndex(from);
    const c0 = colIndex(from);
    const r1 = to ? rowIndex(to) : r0;
    const c1 = to ? colIndex(to) : c0;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) links[`${r},${c}`] = rels[id];
  }
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    for (let j = 0; j < row.length; j++) if (row[j] === undefined) row[j] = '';
    rows[i] = row;
  }
  return { rows, links };
}

/** Read an .xlsx workbook: [{ name, rows: string[][], links: { "row,col": url } }] */
export async function readXlsx(input) {
  const files = await unzip(input, (n) => n.startsWith('xl/') && (n.endsWith('.xml') || n.endsWith('.rels')));
  const text = (p) => (files.has(p) ? td.decode(files.get(p)) : null);
  const workbook = text('xl/workbook.xml');
  if (!workbook) throw new Error('That file is not an Excel workbook.');

  const shared = [];
  const ss = text('xl/sharedStrings.xml');
  if (ss) {
    const re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\s*\/>/g;
    let m;
    while ((m = re.exec(ss))) shared.push(m[1] ? textRuns(m[1]) : '');
  }

  const wbRels = relsMap(text('xl/_rels/workbook.xml.rels'));
  const sheets = [];
  const re = /<sheet\b([^>]*?)\/?>/g;
  let m;
  while ((m = re.exec(workbook))) {
    const a = attrs(m[1]);
    const target = wbRels[a['r:id']];
    if (!target) continue;
    const path = resolvePath('xl/workbook.xml', target);
    const xml = text(path);
    if (!xml) continue;
    const relPath = path.replace(/([^/]+)$/, '_rels/$1.rels');
    const rels = relsMap(text(relPath));
    sheets.push({ name: a.name || path, ...parseSheet(xml, shared, rels) });
  }
  return sheets;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function parseCSV(input) {
  const s = String(input).replace(/^﻿/, '');
  const firstLine = s.split(/\r?\n/, 1)[0] || '';
  const count = (ch) => firstLine.split(ch).length - 1;
  const delim = [',', ';', '\t'].sort((a, b) => count(b) - count(a))[0];
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Read a File/Blob picked by the user. */
export async function readSpreadsheetFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.tsv') || file.type === 'text/csv') {
    return [{ name: file.name.replace(/\.[^.]+$/, ''), rows: parseCSV(await file.text()), links: {} }];
  }
  if (name.endsWith('.xls') && !name.endsWith('.xlsx')) {
    throw new Error('Old .xls files are not supported. Save as .xlsx or CSV.');
  }
  return readXlsx(new Uint8Array(await file.arrayBuffer()));
}
