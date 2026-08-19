/* Minimal RFC 4180 CSV writer.
   Values that could be read as a formula by a spreadsheet are prefixed with a
   single quote: a country field containing "=cmd|..." should never execute
   when a collaborator opens the export in Excel. */

const RISKY = /^[=+\-@\t\r]/;

export function cell(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  let s = String(v);
  if (RISKY.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function row(values) {
  return values.map(cell).join(",") + "\r\n";
}

/** UTF-8 BOM so Excel on Windows opens the file as UTF-8 rather than CP-1252. */
export const BOM = "﻿";
