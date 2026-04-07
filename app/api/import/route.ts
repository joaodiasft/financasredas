import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { extractTextFromPdfBuffer } from "@/lib/extractPdfText";
import { bankDisplayName, parseBankStatement } from "@/lib/bankExtrato/parseBankStatement";
import type { ParsedExtratoRow } from "@/lib/bankExtrato/types";
import { persistParsedExtrato } from "@/lib/importPersist";

function isPdfUpload(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return name.endsWith(".pdf") || type === "application/pdf" || type === "application/x-pdf";
}

async function rowsFromUploadedFile(file: File): Promise<{ bank: string; rows: ParsedExtratoRow[]; buffer: Buffer }> {
  const fileName = file.name || "upload";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isPdfUpload(file)) {
    let text: string;
    try {
      text = await extractTextFromPdfBuffer(buffer);
    } catch {
      throw new Error("PDF_READ");
    }
    if (!text.trim()) throw new Error("PDF_EMPTY");

    const { bank, rows } = parseBankStatement(text, fileName, true);
    if (rows.length === 0) throw new Error("PDF_NO_ROWS");
    return { bank: bankDisplayName(bank), rows, buffer };
  }

  const text = await file.text();
  const { bank, rows } = parseBankStatement(text, fileName, false);
  return { bank: bankDisplayName(bank), rows, buffer };
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ct = request.headers.get("content-type") ?? "";
  let file: File | null = null;
  let text = "";

  if (ct.includes("multipart/form-data")) {
    const form = await request.formData();
    const f = form.get("file");
    if (!f || !(f instanceof Blob)) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }
    const name = f instanceof File ? f.name : "upload";
    file = new File([f], name, { type: f.type });
  } else {
    try {
      const body = await request.json();
      text = typeof body.csv === "string" ? body.csv : "";
    } catch {
      return NextResponse.json({ error: "Envie multipart com campo file ou JSON { csv }" }, { status: 400 });
    }
  }

  let parsed: ParsedExtratoRow[];
  let sourceLabel = "CSV genérico";
  let fileName = "colado.csv";
  let fileBuffer: Buffer;

  try {
    if (file) {
      const r = await rowsFromUploadedFile(file);
      parsed = r.rows;
      sourceLabel = r.bank;
      fileName = file.name || "upload";
      fileBuffer = r.buffer;
    } else {
      if (!text.trim()) {
        return NextResponse.json({ error: "Conteúdo vazio" }, { status: 400 });
      }
      const { bank, rows } = parseBankStatement(text, "colado.json", false);
      parsed = rows;
      sourceLabel = bankDisplayName(bank);
      fileBuffer = Buffer.from(text, "utf8");
    }
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "PDF_READ") {
      return NextResponse.json(
        { error: "Não foi possível ler o PDF (arquivo inválido, corrompido ou protegido por senha)." },
        { status: 400 },
      );
    }
    if (code === "PDF_EMPTY") {
      return NextResponse.json({ error: "O PDF não contém texto extraível." }, { status: 400 });
    }
    if (code === "PDF_NO_ROWS") {
      return NextResponse.json(
        {
          error:
            "Nenhuma linha reconhecida no PDF. Use extrato em texto (Nubank, Sicoob) ou envie CSV: Nubank, Mercado Pago (relatório dinheiro em conta) ou planilha manual.",
        },
        { status: 400 },
      );
    }
    throw e;
  }

  if (parsed.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhuma linha válida. Formatos: Sicoob (PDF), Nubank (PDF ou CSV), Mercado Pago (CSV de dinheiro em conta) ou CSV manual (data, descrição, categoria, valor…).",
      },
      { status: 400 },
    );
  }

  const result = await persistParsedExtrato(prisma, {
    fileName,
    fileBuffer,
    bankLabel: sourceLabel,
    rows: parsed,
  });

  if (result.skippedFileAlreadyImported) {
    return NextResponse.json({
      imported: 0,
      skippedFileAlreadyImported: true,
      skippedDuplicates: 0,
      message: "Este arquivo já foi importado antes (mesmo PDF/CSV — hash idêntico). Nada foi duplicado.",
      fileHash: result.fileHash,
      fileName: result.fileName,
      source: sourceLabel,
      totals: result.totals,
      items: [],
    });
  }

  return NextResponse.json({
    imported: result.inserted,
    skippedDuplicates: result.skippedDuplicates,
    skippedFileAlreadyImported: false,
    fileHash: result.fileHash,
    fileName: result.fileName,
    source: sourceLabel,
    totals: result.totals,
    items: result.items,
  });
}
