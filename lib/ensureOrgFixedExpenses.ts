import type { PrismaClient } from "@prisma/client";

/**
 * Garante conta fixa de aluguel, rótulos de água/internet/alarme e vínculo de PIX de aluguel ~R$ 1.100.
 * Idempotente — pode rodar após import ou seed sem duplicar.
 */
export async function ensureOrgFixedExpenses(prisma: PrismaClient): Promise<void> {
  let aluguel = await prisma.fixedBill.findFirst({ where: { slug: "aluguel" } });
  if (!aluguel) {
    aluguel = await prisma.fixedBill.create({
      data: {
        slug: "aluguel",
        description: "Aluguel (imóvel)",
        category: "Aluguel",
        amount: 1100,
        account: "Sicoob Redação",
        dueDay: 10,
        priority: "high",
        active: true,
        notes: "Valor mensal R$ 1.100. O calendário considera também PIX com ‘ALUGUEL’ e valor ~1.100.",
      },
    });
  } else {
    await prisma.fixedBill.update({
      where: { id: aluguel.id },
      data: {
        amount: 1100,
        description: "Aluguel (imóvel)",
        category: "Aluguel",
        notes: "Valor mensal R$ 1.100. O calendário considera também PIX com ‘ALUGUEL’ e valor ~1.100.",
      },
    });
  }

  const txs = await prisma.transaction.findMany({
    where: { type: "outflow" },
    select: { id: true, description: true },
  });

  for (const t of txs) {
    const d = t.description;
    let next = d;
    if (/151121860558|SANEAMENTO DE GOIAS/i.test(d) && !/^Água \(Saneago\)/i.test(d)) {
      next = `Água (Saneago) — ${d}`;
    } else if (/ORSEGUPS|MONITORAMENTO ELETRONICO/i.test(d) && !/^Alarme \(Orsegups\)/i.test(d)) {
      next = `Alarme (Orsegups) — ${d}`;
    } else if (/DELTA TELECOM/i.test(d)) {
      if (/Pagamento de boleto/i.test(d) && !/^Internet 1 \(Delta/i.test(d)) {
        next = `Internet 1 (Delta — boleto Nubank) — ${d}`;
      } else if (!/^Internet \d \(Delta/i.test(d)) {
        next = `Internet 2 (Delta — conta Nu / manual) — ${d}`;
      }
    }
    if (next !== d) {
      await prisma.transaction.update({ where: { id: t.id }, data: { description: next } });
    }
  }

  await prisma.transaction.updateMany({
    where: {
      type: "outflow",
      amount: { gte: 1095, lte: 1105 },
      description: { contains: "ALUGUEL", mode: "insensitive" },
      fixedBillId: null,
    },
    data: { fixedBillId: aluguel.id, category: "Aluguel" },
  });
}
