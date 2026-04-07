/**
 * Importa em lote PDFs de extrato/comprovante.
 * Cada arquivo é identificado por hash (não reimporta o mesmo PDF).
 * Linhas duplicadas (mesmo dia, descrição, valor, tipo, conta) são ignoradas.
 *
 * Uso:
 *   npx tsx scripts/import-downloads-extracts.ts
 *   npx tsx scripts/import-downloads-extracts.ts "C:\path\a.pdf" "C:\path\b.pdf"
 */
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { extractTextFromPdfBuffer } from "../lib/extractPdfText";
import { bankDisplayName, parseBankStatement } from "../lib/bankExtrato/parseBankStatement";
import { persistParsedExtrato } from "../lib/importPersist";

/** Ordem pedida: MP → comprovantes → MP (2) → Nubank trimestre → MP (1). */
const DEFAULT_FILES = [
  "c:/Users/jcsol/Downloads/MercadoPago.pdf",
  "c:/Users/jcsol/Downloads/comprovante_06-04-2026 17-40-53.pdf",
  "c:/Users/jcsol/Downloads/comprovante_06-04-2026 17-41-28.pdf",
  "c:/Users/jcsol/Downloads/comprovante_06-04-2026 17-42-21.pdf",
  "c:/Users/jcsol/Downloads/MercadoPago (2).pdf",
  "c:/Users/jcsol/Downloads/NU_471756728_01JAN2026_31MAR2026.pdf",
  "c:/Users/jcsol/Downloads/MercadoPago (1).pdf",
];

async function main() {
  const argFiles = process.argv.slice(2).filter((a) => a.toLowerCase().endsWith(".pdf"));
  const FILES = argFiles.length ? argFiles : DEFAULT_FILES;

  for (const filePath of FILES) {
    const normalized = filePath.replace(/\\/g, "/");
    if (!fs.existsSync(normalized)) {
      console.warn("Pulando (não encontrado):", normalized);
      continue;
    }
    const name = path.basename(normalized);
    const buffer = fs.readFileSync(normalized);
    let text: string;
    try {
      text = await extractTextFromPdfBuffer(buffer);
    } catch (e) {
      console.warn(name, "→ erro ao ler PDF:", e);
      continue;
    }
    if (!text.trim()) {
      console.warn(name, "→ PDF sem texto extraível");
      continue;
    }
    const { bank, rows } = parseBankStatement(text, name, true);
    console.log(name, "→", bankDisplayName(bank), rows.length, "linhas parseadas");

    const result = await persistParsedExtrato(prisma, {
      fileName: name,
      fileBuffer: buffer,
      bankLabel: bankDisplayName(bank),
      rows,
    });

    if (result.skippedFileAlreadyImported) {
      console.log(
        "  Já importado (mesmo arquivo): hash",
        result.fileHash.slice(0, 12) + "…",
        "| totais no registro:",
        result.totals,
      );
      continue;
    }

    console.log(
      "  Inseridas:",
      result.inserted,
      "| duplicatas ignoradas:",
      result.skippedDuplicates,
      "| entradas R$",
      result.totals.totalInflow,
      "| saídas R$",
      result.totals.totalOutflow,
    );
  }

  const files = await prisma.importSourceFile.findMany({ orderBy: { createdAt: "asc" } });
  console.log("\n--- Extratos registrados no banco:", files.length, "---");
  for (const f of files) {
    console.log(
      f.fileName,
      "|",
      f.rowInserted,
      "linhas",
      "| hash",
      f.fileHash.slice(0, 12) + "…",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
