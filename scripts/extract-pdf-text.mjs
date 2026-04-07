import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath =
  process.argv[2] ||
  "C:/Users/jcsol/Downloads/Telegram Desktop/comprovante_12-03-2026 14-51-21.pdf";
const outPath = path.join(__dirname, "../prisma/sources/sicoob-extrato-raw.txt");

const buf = fs.readFileSync(pdfPath);
const parser = new PDFParse({ data: buf });
const result = await parser.getText();
await parser.destroy();
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, result.text, "utf8");
console.log("Wrote", outPath, "chars:", result.text.length);
