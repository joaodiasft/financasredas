/**
 * Garante colunas que às vezes faltam se o `prisma db push` não foi rodado após atualizar o schema.
 * Seguro rodar várias vezes (ADD COLUMN IF NOT EXISTS).
 *
 * Uso: npx tsx scripts/ensure-prisma-columns.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "turmaAmounts" JSONB`,
  `ALTER TABLE "fixed_bills" ADD COLUMN IF NOT EXISTS "slug" TEXT`,
  `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "scholarship" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "fixed_bills_slug_key" ON "fixed_bills"("slug")`,
];

async function main() {
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log("OK:", sql.slice(0, 70) + (sql.length > 70 ? "…" : ""));
    } catch (e) {
      console.error("Falha:", sql, e);
      throw e;
    }
  }
  // Índice único em dedupeKey (Prisma espera; ignora se já existir com outro nome)
  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "transactions_dedupeKey_key" ON "transactions"("dedupeKey")`,
    );
    console.log("OK: índice único dedupeKey (se aplicável)");
  } catch {
    console.log("Índice dedupeKey: já existe ou não necessário");
  }
  console.log("\nPronto. Rode: npx prisma generate (com npm run dev parado, se der EPERM no Windows)");
}

main()
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
