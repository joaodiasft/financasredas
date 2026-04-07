function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(["de", "da", "do", "das", "dos", "e"]);

/** Sobrenomes muito comuns — não usar sozinhos para casar PIX (evita Anna… Goncalves → Kemilly… Goncalves). */
const SURNAME_NOISE = new Set([
  "silva",
  "santos",
  "souza",
  "oliveira",
  "goncalves",
  "martins",
  "pereira",
  "ferreira",
  "almeida",
  "costa",
  "rodrigues",
  "carvalho",
  "lima",
  "gomes",
  "alves",
  "ribeiro",
  "dias",
  "castro",
  "machado",
  "freitas",
  "franco",
  "duarte",
  "cardoso",
  "teixeira",
  "correia",
  "nunes",
  "melo",
  "barbosa",
]);

/** Partes úteis do nome (evita match em "de", "da"). */
function nameTokens(name: string): string[] {
  return norm(name)
    .split(" ")
    .filter((w) => w.length >= 2 && !STOP.has(w));
}

export function buildMatchNeedles(studentName: string, pixMatchNames: string | null | undefined): string[] {
  const out: string[] = [];
  const full = norm(studentName);
  if (full.length >= 3) out.push(full);

  const tokens = nameTokens(studentName).filter((t) => !SURNAME_NOISE.has(t));
  for (const t of tokens) {
    if (t.length >= 3) out.push(t);
  }

  const parts = norm(studentName)
    .split(" ")
    .filter((w) => w.length >= 2 && !STOP.has(w) && !SURNAME_NOISE.has(w));
  if (parts.length >= 2) {
    out.push(`${parts[0]} ${parts[1]}`);
  }

  if (pixMatchNames) {
    for (const part of pixMatchNames.split(/[,;]/)) {
      const p = norm(part);
      if (p.length < 2) continue;
      const ws = p.split(" ").filter(Boolean);
      if (ws.length === 1 && SURNAME_NOISE.has(ws[0]!)) continue;
      out.push(p);
    }
  }

  return Array.from(new Set(out)).sort((a, b) => b.length - a.length);
}

/** Retorna 0–100 conforme o quanto a descrição combina com o aluno. */
export function scoreStudentMatch(description: string, studentName: string, pixMatchNames: string | null | undefined): number {
  const desc = norm(description);
  if (!desc) return 0;
  const needles = buildMatchNeedles(studentName, pixMatchNames);
  let best = 0;
  for (const n of needles) {
    if (n.length < 2) continue;
    if (desc.includes(n)) {
      const fullMatch = n === norm(studentName);
      const score = Math.min(100, 40 + n.length * 4 + (fullMatch ? 30 : 0));
      best = Math.max(best, score);
    }
  }
  return best;
}
