import type { QueryClient } from "@tanstack/react-query";

/** Invalida só caches financeiros (evita refetch em massa desnecessário). */
export function invalidateFinancialQueries(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["me"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["outflow-summary"] });
  qc.invalidateQueries({ queryKey: ["groups"] });
  qc.invalidateQueries({ queryKey: ["group-detail"] });
  qc.invalidateQueries({ queryKey: ["payables"] });
  qc.invalidateQueries({ queryKey: ["reports"] });
  qc.invalidateQueries({ queryKey: ["students"] });
  qc.invalidateQueries({ queryKey: ["fixed-bills"] });
  qc.invalidateQueries({ queryKey: ["import-history"] });
}
