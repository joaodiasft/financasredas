/** Divide uma linha CSV/TSV respeitando aspas duplas. */
export function parseDelimitedLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && c === sep) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

/** Escolhe `;` ou `,` conforme a primeira linha (mais colunas = melhor). */
export function detectSeparator(firstLine: string): ";" | "," | null {
  const semi = parseDelimitedLine(firstLine, ";").length;
  const comma = parseDelimitedLine(firstLine, ",").length;
  if (semi < 2 && comma < 2) return null;
  return semi >= comma ? ";" : ",";
}

export function normalizeHeader(h: string): string {
  return h
    .replace(/\ufeff/g, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}
