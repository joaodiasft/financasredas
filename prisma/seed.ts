import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  TURMAS,
  LEGACY_TURMA_ALIASES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from "../lib/orgConstants";
import { classifyOutflowCategory } from "../lib/classifyExpenseCategory";
import { ensureOrgFixedExpenses } from "../lib/ensureOrgFixedExpenses";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

/** Só `true` apaga importações e alunos. Use `npm run db:seed:reset`. */
const HARD_RESET = process.env.PRISMA_SEED_RESET === "true";

type ExtratoRow = {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "inflow" | "outflow";
  status: string;
  account: string | null;
  group: string | null;
  priority: string | null;
  studentId: null;
  turmas: null;
  needsReconcile: boolean;
  fixedBillId: null;
};

async function main() {
  if (HARD_RESET) {
    await prisma.importSourceFile.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.student.deleteMany();
    await prisma.fixedBill.deleteMany();
    await prisma.category.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
    console.log(
      "PRISMA_SEED_RESET: banco limpo (importações, transações, alunos, contas fixas, categorias, grupos, usuários).",
    );
  }

  /** Contas padrão (e-mail em minúsculas — o login normaliza assim). */
  const seedUsers: { email: string; password: string; name: string }[] = [
    { email: "claudiney@redasmil.com", password: "credas2026", name: "Claudiney" },
    { email: "joao@redasmil.com", password: "redas2026", name: "João" },
  ];

  const primaryLoginEmail = seedUsers[0].email;

  for (const u of seedUsers) {
    const existingUser = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: u.email,
          password: bcrypt.hashSync(u.password, 10),
          name: u.name,
        },
      });
      console.log("Usuário criado:", u.email);
    }
  }

  let sort = 0;
  await prisma.category.createMany({
    data: DEFAULT_INCOME_CATEGORIES.map((name) => ({ name, kind: "inflow", sortOrder: sort++ })),
    skipDuplicates: true,
  });
  sort = 0;
  await prisma.category.createMany({
    data: DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ name, kind: "outflow", sortOrder: sort++ })),
    skipDuplicates: true,
  });

  for (const name of TURMAS) {
    await prisma.group.upsert({
      where: { name },
      create: {
        name,
        studentCount: 0,
        balance: 0,
        performance: 0,
        status: "neutral",
      },
      update: {},
    });
  }

  for (const [oldName, newName] of Object.entries(LEGACY_TURMA_ALIASES)) {
    if (oldName === newName) continue;
    await prisma.student.updateMany({ where: { turma1: oldName }, data: { turma1: newName } });
    await prisma.student.updateMany({ where: { turma2: oldName }, data: { turma2: newName } });
    await prisma.transaction.updateMany({ where: { group: oldName }, data: { group: newName } });
  }

  const txCount = await prisma.transaction.count();
  if (HARD_RESET) {
    console.log("Reset: sem extrato de exemplo — importe os PDFs pelo painel ou npm run import:extracts.");
  } else if (txCount === 0) {
    const jsonPath = join(__dirname, "data", "extrato-nota-mil-fev-2026.json");
    const raw = readFileSync(jsonPath, "utf8");
    const rows = JSON.parse(raw) as ExtratoRow[];

    await prisma.transaction.createMany({
      data: rows.map((r) => {
        const [y, mo, d] = r.date.split("-").map(Number);
        const category =
          r.type === "outflow" ? classifyOutflowCategory(r.description) : r.category;
        return {
          date: new Date(y, mo - 1, d),
          description: r.description,
          category,
          amount: r.amount,
          type: r.type,
          status: r.status,
          account: r.account,
          group: r.group,
          priority: r.priority,
          studentId: r.studentId,
          turmas: r.turmas,
          needsReconcile: r.needsReconcile,
          fixedBillId: r.fixedBillId,
        };
      }),
    });
    console.log(`Primeira instalação: ${rows.length} lançamentos do JSON de exemplo (Sicoob fev/2026).`);
  } else {
    console.log(`Mantidas ${txCount} transações existentes (importações não foram apagadas).`);
  }

  await ensureOrgFixedExpenses(prisma);
  console.log("Contas fixas / rótulos (aluguel, água, internet, alarme) verificados.");

  console.log(
    HARD_RESET
      ? `Seed com reset. Login principal: ${primaryLoginEmail} — banco vazio de lançamentos; importe extratos em seguida.`
      : `Seed seguro OK. Login principal: ${primaryLoginEmail} — reset total: npm run db:seed:reset`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
