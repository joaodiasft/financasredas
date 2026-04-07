/**
 * Zera importações, transações, alunos, contas fixas, etc. e recria usuário/categorias (sem extrato de exemplo).
 * Uso: npm run db:seed:reset
 */
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["prisma", "db", "seed"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PRISMA_SEED_RESET: "true" },
});

process.exit(r.status ?? 1);
