/** Build RFC 4180–friendly CSV and trigger a browser download (UTF-8 with BOM for Excel). */

export type BaseDataCsvColumn = {
  header: string;
  cell: (row: Record<string, unknown>) => string;
};

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildBaseDataCsv(columns: BaseDataCsvColumn[], rows: Record<string, unknown>[]): string {
  const headerLine = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const dataLines = rows.map((row) => columns.map((c) => escapeCsvCell(c.cell(row))).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

export function downloadBaseDataCsv(content: string, filename: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportFilename(prefix: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${prefix}-${day}.csv`;
}

/**
 * Single filename segment from a label (letters/numbers any script). Strips path-unsafe chars.
 * Returns "" if nothing usable remains — callers should pick a fallback prefix.
 */
export function slugifyForFilename(raw: string | null | undefined, maxLen = 64): string {
  if (raw == null) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  let s = trimmed
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  s = s.slice(0, maxLen).replace(/-+$/g, "");
  return s;
}
