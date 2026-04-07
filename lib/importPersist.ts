import type { PrismaClient } from "@prisma/client";
import type { ParsedExtratoRow } from "@/lib/bankExtrato/types";
import { makeTransactionDedupeKey, sha256HexBuffer } from "@/lib/transactionDedupe";

export type PersistImportResult = {
  inserted: number;
  skippedDuplicates: number;
  skippedFileAlreadyImported: boolean;
  fileHash: string;
  fileName: string;
  bankLabel: string;
  items: Array<{
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: string;
    status: string;
    needsReconcile: boolean;
  }>;
  totals: { totalInflow: number; totalOutflow: number; net: number };
};

/**
 * Grava linhas parseadas com dedupe por `dedupeKey` e registro do arquivo (hash único).
 */
export async function persistParsedExtrato(
  prisma: PrismaClient,
  input: {
    fileName: string;
    fileBuffer: Buffer;
    bankLabel: string;
    rows: ParsedExtratoRow[];
  },
): Promise<PersistImportResult> {
  const fileHash = sha256HexBuffer(input.fileBuffer);

  const existingFile = await prisma.importSourceFile.findUnique({
    where: { fileHash },
  });
  if (existingFile) {
    return {
      inserted: 0,
      skippedDuplicates: 0,
      skippedFileAlreadyImported: true,
      fileHash,
      fileName: input.fileName,
      bankLabel: input.bankLabel,
      items: [],
      totals: {
        totalInflow: existingFile.totalInflow,
        totalOutflow: existingFile.totalOutflow,
        net: existingFile.totalInflow - existingFile.totalOutflow,
      },
    };
  }

  let inserted = 0;
  let skippedDuplicates = 0;
  const items: PersistImportResult["items"] = [];
  let sumIn = 0;
  let sumOut = 0;

  for (const r of input.rows) {
    const dateStr = r.date.slice(0, 10);
    const dedupeKey = makeTransactionDedupeKey({
      date: dateStr,
      description: r.description,
      amount: r.amount,
      type: r.type,
      account: r.account ?? "",
    });

    const dup = await prisma.transaction.findUnique({ where: { dedupeKey } });
    if (dup) {
      skippedDuplicates++;
      continue;
    }

    const needsReconcile = r.needsReconcile ?? r.type === "inflow";
    const row = await prisma.transaction.create({
      data: {
        date: new Date(r.date),
        description: r.description,
        category: r.category,
        amount: r.amount,
        type: r.type,
        status: r.status,
        account: r.account,
        priority: r.type === "outflow" ? "medium" : null,
        needsReconcile,
        dedupeKey,
      },
    });
    inserted++;
    if (r.type === "inflow") sumIn += r.amount;
    else sumOut += r.amount;

    items.push({
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      description: row.description,
      category: row.category,
      amount: row.amount,
      type: row.type,
      status: row.status,
      needsReconcile,
    });
  }

  await prisma.importSourceFile.create({
    data: {
      fileHash,
      fileName: input.fileName,
      byteSize: input.fileBuffer.length,
      bankLabel: input.bankLabel,
      rowParsed: input.rows.length,
      rowInserted: inserted,
      skippedDuplicates,
      totalInflow: Math.round(sumIn * 100) / 100,
      totalOutflow: Math.round(sumOut * 100) / 100,
    },
  });

  return {
    inserted,
    skippedDuplicates,
    skippedFileAlreadyImported: false,
    fileHash,
    fileName: input.fileName,
    bankLabel: input.bankLabel,
    items,
    totals: {
      totalInflow: Math.round(sumIn * 100) / 100,
      totalOutflow: Math.round(sumOut * 100) / 100,
      net: Math.round((sumIn - sumOut) * 100) / 100,
    },
  };
}
