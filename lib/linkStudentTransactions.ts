/**
 * Conciliação automática por nome no PIX está desligada — evita vínculos errados.
 * Use sempre o fluxo manual em Entradas → Conciliar aluno.
 */
export async function linkPendingInflowsToStudent(_studentId: string): Promise<{ linked: number }> {
  return { linked: 0 };
}
