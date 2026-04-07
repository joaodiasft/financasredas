/**
 * Rótulos e filtros para despesas recorrentes conhecidas (texto do extrato).
 */

export type ExpenseTag = "aluguel" | "agua" | "internet" | "alarme" | "other";

export type PayableDisplay = {
  displayDescription: string;
  tag: ExpenseTag;
  tagLabel: string;
};

const TAG_LABELS: Record<ExpenseTag, string> = {
  aluguel: "Aluguel",
  agua: "Água",
  internet: "Internet",
  alarme: "Alarme",
  other: "Outras",
};

function has(d: string, ...subs: string[]) {
  const u = d.toUpperCase();
  return subs.every((s) => u.includes(s.toUpperCase()));
}

export function enrichPayableDisplay(description: string, amount: number, category?: string): PayableDisplay {
  const d = description.trim();
  const cat = (category ?? "").trim();

  if (/(^|[\s—])ALUGUEL/i.test(d) || (cat === "Aluguel" && amount >= 1095 && amount <= 1105)) {
    return {
      displayDescription: /^Aluguel\b/i.test(d) ? d : `Aluguel (R$ 1.100) — ${d}`,
      tag: "aluguel",
      tagLabel: TAG_LABELS.aluguel,
    };
  }

  if (has(d, "SANEAMENTO", "GOIAS") || d.includes("151121860558")) {
    return {
      displayDescription: /^Água \(Saneago\)/i.test(d) ? d : `Água (Saneago) — ${d}`,
      tag: "agua",
      tagLabel: TAG_LABELS.agua,
    };
  }

  if (has(d, "ORSEGUPS") || has(d, "MONITORAMENTO", "ELETRONICO")) {
    return {
      displayDescription: `Alarme (Orsegups) — ${d}`,
      tag: "alarme",
      tagLabel: TAG_LABELS.alarme,
    };
  }

  if (has(d, "DELTA", "TELECOM")) {
    const isBoleto = /boleto|Pagamento de boleto/i.test(d);
    const label = isBoleto ? "Internet 1 (Delta — boleto Nubank)" : "Internet 2 (Delta — conta Nu / manual)";
    return {
      displayDescription: `${label} — ${d}`,
      tag: "internet",
      tagLabel: TAG_LABELS.internet,
    };
  }

  return { displayDescription: d, tag: "other", tagLabel: TAG_LABELS.other };
}

export { TAG_LABELS };
