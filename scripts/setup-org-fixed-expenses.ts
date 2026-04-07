/**
 * Garante aluguel + rótulos (água, internet, alarme). Idempotente.
 * Uso: npx tsx scripts/setup-org-fixed-expenses.ts
 */
import { PrismaClient } from "@prisma/client";
import { ensureOrgFixedExpenses } from "../lib/ensureOrgFixedExpenses";

const prisma = new PrismaClient();

async function main() {
  await ensureOrgFixedExpenses(prisma);
  console.log("ensureOrgFixedExpenses concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
