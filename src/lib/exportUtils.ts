function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportToCsv(
  columns: string[],
  rows: Record<string, unknown>[],
  filename: string
) {
  const lines = [
    columns.map(csvEscape).join(","),
    ...rows.map((row) => columns.map((col) => csvEscape(row[col])).join(",")),
  ];
  downloadBlob(lines.join("\r\n"), `${filename}.csv`, "text/csv;charset=utf-8");
}

export function exportToJson(
  columns: string[],
  rows: Record<string, unknown>[],
  filename: string
) {
  const records = rows.map((row) =>
    Object.fromEntries(columns.map((col) => [col, row[col] ?? null]))
  );
  downloadBlob(
    JSON.stringify(records, null, 2),
    `${filename}.json`,
    "application/json"
  );
}
