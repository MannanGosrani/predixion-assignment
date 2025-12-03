export function parseCsvRows(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // remove empty lines at start/end
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

  if (lines.length === 0) return [];

  // naive CSV parse: break by comma but handle quoted commas
  function splitCsvLine(line) {
    const chars = Array.from(line);
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === '"' && chars[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue;
    const cells = splitCsvLine(lines[i]);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = cells[j] ?? "";
    }
    rows.push(obj);
  }
  return rows;
}

// download csv 
export function downloadCsv(rows, filename = "export.csv") {
  if (!rows || rows.length === 0) {
    alert("No rows to export.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();   
  URL.revokeObjectURL(url);
}
