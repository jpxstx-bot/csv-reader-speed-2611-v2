// Drop-in for csv-reader 1.0.0. Same answer, fewer allocations.
// Policy matches vendor/csv-reader/index.js (make.fun, derived from d3-dsv / papaparse).

const COMMA = 44;
const LF = 10;
const CR = 13;
const DQ = 34;

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const n = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;
  let pos = 0;
  let line = 1;
  if (n > 0 && text.charCodeAt(0) === 0xfeff) pos = 1;

  const parts = [];

  function materialize(seed) {
    const k = parts.length;
    if (!seed) {
      if (k === 0) return "";
      if (k === 1) return parts[0];
      return parts.join("");
    }
    if (k === 0) return seed;
    if (k === 1) return seed + parts[0];
    return seed + parts.join("");
  }

  function pushSpan(start, end) {
    if (end > start) parts.push(text.slice(start, end));
  }

  // ended: 0 comma, 1 line break, 2 end. added = chars kept besides seed.
  function readUnquoted(seed, recLine, recRow) {
    parts.length = 0;
    let added = 0;
    let start = pos;
    while (pos < n) {
      const c = text.charCodeAt(pos);
      if (c === COMMA) {
        pushSpan(start, pos);
        added += pos - start;
        pos += 1;
        return [materialize(seed), 0, added];
      }
      if (c === LF) {
        pushSpan(start, pos);
        added += pos - start;
        pos += 1;
        line += 1;
        return [materialize(seed), 1, added];
      }
      if (c === CR) {
        if (pos + 1 < n && text.charCodeAt(pos + 1) === LF) {
          pushSpan(start, pos);
          added += pos - start;
          pos += 2;
          line += 1;
          return [materialize(seed), 1, added];
        }
        pushSpan(start, pos);
        added += pos - start;
        errors.push({ code: "stray_cr", line: recLine, row: recRow });
        pos += 1;
        start = pos;
        continue;
      }
      pos += 1;
    }
    pushSpan(start, pos);
    added += pos - start;
    return [materialize(seed), 2, added];
  }

  function readQuoted(recLine, recRow) {
    const open = pos;
    const openLine = line;
    pos += 1;
    parts.length = 0;
    let start = pos;
    let closed = false;
    while (pos < n) {
      const c = text.charCodeAt(pos);
      if (c === DQ) {
        if (pos + 1 < n && text.charCodeAt(pos + 1) === DQ) {
          pushSpan(start, pos);
          parts.push('"');
          pos += 2;
          start = pos;
          continue;
        }
        pushSpan(start, pos);
        pos += 1;
        closed = true;
        break;
      }
      if (c === CR) {
        pushSpan(start, pos);
        parts.push("\n");
        line += 1;
        pos += pos + 1 < n && text.charCodeAt(pos + 1) === LF ? 2 : 1;
        start = pos;
        continue;
      }
      if (c === LF) line += 1;
      pos += 1;
    }
    if (!closed) {
      pos = open + 1;
      line = openLine;
      errors.push({ code: "unterminated_quote", line: recLine, row: recRow });
      return readUnquoted('"', recLine, recRow);
    }
    const value = materialize("");
    if (pos >= n) return [value, 2, 0];
    const c = text.charCodeAt(pos);
    if (c === COMMA) {
      pos += 1;
      return [value, 0, 0];
    }
    if (c === LF) {
      pos += 1;
      line += 1;
      return [value, 1, 0];
    }
    if (c === CR && pos + 1 < n && text.charCodeAt(pos + 1) === LF) {
      pos += 2;
      line += 1;
      return [value, 1, 0];
    }
    const junk = readUnquoted(value, recLine, recRow);
    if (junk[2] > 0) errors.push({ code: "quote_junk", line: recLine, row: recRow });
    return junk;
  }

  while (pos < n) {
    while (pos < n) {
      const c = text.charCodeAt(pos);
      if (c === LF) {
        pos += 1;
        line += 1;
        continue;
      }
      if (c === CR && pos + 1 < n && text.charCodeAt(pos + 1) === LF) {
        pos += 2;
        line += 1;
        continue;
      }
      break;
    }
    if (pos >= n) break;

    const recLine = line;
    const recRow = header && columns === null ? null : rows.length;
    const fields = [];
    let quoted = false;
    let ended = 0;
    do {
      if (pos < n && text.charCodeAt(pos) === DQ) {
        quoted = true;
        const field = readQuoted(recLine, recRow);
        fields.push(field[0]);
        ended = field[1];
      } else {
        quoted = false;
        const field = readUnquoted("", recLine, recRow);
        fields.push(field[0]);
        ended = field[1];
      }
    } while (ended === 0);

    if (fields.length === 1 && fields[0] === "" && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: "short_row", line: recLine, row: recRow, fields: fields.length });
      while (fields.length < width) fields.push("");
    } else if (fields.length > width) {
      errors.push({ code: "long_row", line: recLine, row: recRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}
