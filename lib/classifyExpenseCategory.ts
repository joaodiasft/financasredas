/**
 * Classifica saídas (descrição do extrato ou lançamento) em uma categoria de despesa oficial.
 * Ordem das regras importa: a primeira que casar vence.
 */

import { DEFAULT_EXPENSE_CATEGORIES } from "./orgConstants";

export const EXPENSE_CATEGORY_ORDER: readonly string[] = DEFAULT_EXPENSE_CATEGORIES;

export function isKnownExpenseCategory(name: string): boolean {
  return (DEFAULT_EXPENSE_CATEGORIES as readonly string[]).includes(name);
}

/** Garante que o nome exista na lista oficial (fallback). */
export function normalizeExpenseCategory(name: string): string {
  if (isKnownExpenseCategory(name)) return name;
  return "Outras despesas";
}

export function classifyOutflowCategory(description: string): string {
  const d = description;
  const u = d.toUpperCase();

  if (/DÉ?B\.?\s*PGTO\.?\s*BOLETO|PGTO\.?\s*BOL\.?\s*INT|BOLETO.*CART|CART[AÃ]O\s*DE\s*CR[EÉ]DITO/i.test(d)) {
    return "Cartão de crédito";
  }
  if (/DEB\.?\s*PACOTE|APLICA[CÇ][AÃ]O\s*RDC|DEB\.?PARC|TRANSF\.?\s*PIX\s*SICOOB|FAV\.?:\s*REDAC/i.test(u)) {
    return "Tarifas e banco";
  }
  if (/COMPRA\s*NAC/.test(u)) {
    if (
      /CARNES|ASSAI|ATACAD|PAYOL|PADARIA|PAES|POLOS\s*PAES|MELANCIA|HORTIFRUTI|RESTAUR|LANCH|SUPERMERC/i.test(u)
    ) {
      return "Alimentação";
    }
    if (/NUNES\s*RODAS|POSTO|COMBUST|AUTO\s*PECAS|OFICINA|BORRACH/i.test(u)) {
      return "Transporte";
    }
    return "Compras e materiais";
  }
  if (/PIX\s*EMIT|PIX\.EMIT|PIX\.EMIT\.OUT/i.test(u) || /PAGAMENTO\s*PIX/i.test(u)) {
    return "PIX / transferências";
  }
  if (/SOLICITA[CÇ][AÃ]O\s*PIX/i.test(u)) {
    return "PIX / transferências";
  }
  return "Outras despesas";
}
