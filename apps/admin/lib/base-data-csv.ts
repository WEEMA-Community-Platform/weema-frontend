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
