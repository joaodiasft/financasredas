/**
 * Linha normalizada após parse de extrato (CSV/PDF texto).
 */
export type ParsedExtratoRow = {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "inflow" | "outflow";
  status: "paid" | "pending";
  account: string;
  needsReconcile?: boolean;
};

export type BankId = "sicoob" | "nubank" | "mercadopago" | "generic";

export type BankParseResult = {
  bank: BankId;
  rows: ParsedExtratoRow[];
};
