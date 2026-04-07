import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

/** Lista extratos já importados (hash único) e totais no banco para conferência. */
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const files = await prisma.importSourceFile.findMany({
    orderBy: { createdAt: "asc" },
  });

  const [inflowAgg, outflowAgg, txCount, inflowLineCount, outflowLineCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "inflow" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "outflow" },
      _sum: { amount: true },
    }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { type: "inflow" } }),
    prisma.transaction.count({ where: { type: "outflow" } }),
  ]);

  const dbTotalInflow = inflowAgg._sum.amount ?? 0;
  const dbTotalOutflow = outflowAgg._sum.amount ?? 0;

  let sumImportsInflow = 0;
  let sumImportsOutflow = 0;
  for (const f of files) {
    sumImportsInflow += f.totalInflow;
    sumImportsOutflow += f.totalOutflow;
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  sumImportsInflow = round2(sumImportsInflow);
  sumImportsOutflow = round2(sumImportsOutflow);

  const eps = 0.02;
  const inflowMatch = Math.abs(dbTotalInflow - sumImportsInflow) < eps;
  const outflowMatch = Math.abs(dbTotalOutflow - sumImportsOutflow) < eps;
  const insertedSum = files.reduce((s, x) => s + x.rowInserted, 0);

  return NextResponse.json({
    files: files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      fileHash: f.fileHash,
      fileHashShort: f.fileHash.slice(0, 12),
      bankLabel: f.bankLabel,
      byteSize: f.byteSize,
      rowParsed: f.rowParsed,
      rowInserted: f.rowInserted,
      skippedDuplicates: f.skippedDuplicates,
      totalInflow: f.totalInflow,
      totalOutflow: f.totalOutflow,
      net: round2(f.totalInflow - f.totalOutflow),
      createdAt: f.createdAt.toISOString(),
    })),
    verification: {
      database: {
        totalInflow: round2(dbTotalInflow),
        totalOutflow: round2(dbTotalOutflow),
        net: round2(dbTotalInflow - dbTotalOutflow),
        transactionCount: txCount,
        inflowLineCount,
        outflowLineCount,
      },
      sumFromRegisteredImports: {
        totalInflow: sumImportsInflow,
        totalOutflow: sumImportsOutflow,
        net: round2(sumImportsInflow - sumImportsOutflow),
        fileCount: files.length,
      },
      totalsMatchImports:
        files.length === 0 ? null : inflowMatch && outflowMatch,
      insertedRowsFromImportsSum: insertedSum,
      hintIfMismatch:
        txCount !== insertedSum
          ? "Há lançamentos que não vieram destes extratos (manual ou outra origem), ou linhas deduplicadas entre arquivos."
          : null,
      note:
        "Se você criou lançamentos manualmente, os totais do banco podem divergir da soma dos extratos.",
    },
  });
}
