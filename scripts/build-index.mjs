/**
 * scripts/build-index.mjs
 *
 * Script offline — roda UMA VEZ localmente para:
 *   1. Extrair texto dos 5 documentos-fonte em docs/
 *   2. Limpar e dividir em chunks (~800 chars, ~150 overlap)
 *   3. Gerar embeddings via Cohere e salvar em data/index.json
 *
 * Uso: npm run build-index
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOCS_DIR = path.join(ROOT, "docs");
const OUTPUT_FILE = path.join(ROOT, "data", "index.json");

const CHUNK_SIZE = 800;    // caracteres por chunk
const CHUNK_OVERLAP = 150; // sobreposição entre chunks

// ─────────────────────────────────────────────
// Utilitário: extrai texto de tags XML via regex
// ─────────────────────────────────────────────

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function extractXmlText(xml, tagName) {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([^<]*)<\\/${tagName}>`, "g");
  const texts = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const text = decodeXmlEntities(match[1]);
    if (text.trim()) texts.push(text.trim());
  }
  return texts;
}

// ─────────────────────────────────────────────
// 1. EXTRATORES — um por formato
// ─────────────────────────────────────────────

/** Extrai texto de .docx usando adm-zip */
async function extractDocx(filePath) {
  const { default: AdmZip } = await import("adm-zip");
  const zip = new AdmZip(filePath);
  const docXml = zip.readAsText("word/document.xml");
  const withBreaks = docXml.replace(/<\/w:p>/g, " \n");
  return extractXmlText(withBreaks, "w:t").join(" ");
}

/** Extrai texto de .xlsx usando xlsx (SheetJS) */
async function extractXlsx(filePath) {
  const { default: XLSX } = await import("xlsx");
  const workbook = XLSX.readFile(filePath);
  const lines = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    lines.push(`[Aba: ${sheetName}]\n${csv}`);
  }

  return lines.join("\n\n");
}

/** Extrai texto de .pdf usando pdf-parse */
async function extractPdf(filePath) {
  const { PDFParse } = require("pdf-parse");
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  return data.text;
}

/** Extrai texto de .md — leitura direta */
async function extractMd(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

/** Extrai texto de .pptx usando adm-zip */
async function extractPptx(filePath) {
  const { default: AdmZip } = await import("adm-zip");
  const zip = new AdmZip(filePath);

  const slideEntries = zip.getEntries()
    .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a, b) => {
      const n = (e) => parseInt(e.entryName.match(/\d+/)[0]);
      return n(a) - n(b);
    });

  const slideTexts = [];
  for (let i = 0; i < slideEntries.length; i++) {
    const xml = slideEntries[i].getData().toString("utf8");
    const texts = extractXmlText(xml, "a:t");
    if (texts.length > 0) {
      slideTexts.push(`[Slide ${i + 1}]\n${texts.join(" ")}`);
    }
  }

  return slideTexts.join("\n\n");
}

// ─────────────────────────────────────────────
// 2. LIMPEZA E CHUNKING
// ─────────────────────────────────────────────

function cleanText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^\s+|\s+$/gm, "")
    .trim();
}

function findBreakPoint(text, pos) {
  const searchFrom = Math.max(0, pos - 200);
  const slice = text.slice(searchFrom, pos);

  const doubleNewline = slice.lastIndexOf("\n\n");
  if (doubleNewline !== -1) return searchFrom + doubleNewline + 2;

  const singleNewline = slice.lastIndexOf("\n");
  if (singleNewline !== -1) return searchFrom + singleNewline + 1;

  const period = slice.lastIndexOf(". ");
  if (period !== -1) return searchFrom + period + 2;

  return pos;
}

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      end = findBreakPoint(text, end);
    } else {
      end = text.length;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    const nextStart = end - overlap;
    if (nextStart <= start) {
      start = end;
    } else {
      start = nextStart;
    }
  }

  return chunks.filter((c) => c.length > 50);
}

// ─────────────────────────────────────────────
// 3. DOCUMENTOS-FONTE
// ─────────────────────────────────────────────

const DOCUMENTS = [
  { file: "01_manual_onboarding_rh.docx",               category: "RH",               extractor: extractDocx },
  { file: "02_orcamento_e_reembolso_financeiro.xlsx",    category: "Financeiro",       extractor: extractXlsx },
  { file: "03_manual_procedimentos_operacionais.md",     category: "Operacional",      extractor: extractMd   },
  { file: "04_politica_seguranca_dados_corporativa.pdf", category: "Legal/Compliance", extractor: extractPdf  },
  { file: "05_okrs_roadmap_estrategico.pptx",            category: "Estratégico",      extractor: extractPptx },
];

// ─────────────────────────────────────────────
// 4. GERAÇÃO DE EMBEDDINGS via Cohere
// ─────────────────────────────────────────────

async function generateEmbeddings(texts) {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "COHERE_API_KEY não encontrada. Crie um arquivo .env.local com a chave."
    );
  }

  const BATCH_SIZE = 90;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(
      `  → Lote ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} chunks)...`
    );

    const response = await fetch("https://api.cohere.com/v2/embed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts: batch,
        model: "embed-multilingual-v3.0",
        input_type: "search_document",
        embedding_types: ["float"],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro na API Cohere: ${response.status} — ${error}`);
    }

    const data = await response.json();
    allEmbeddings.push(...data.embeddings.float);
  }

  return allEmbeddings;
}

// ─────────────────────────────────────────────
// 5. MAIN
// ─────────────────────────────────────────────

async function main() {
  const envPath = path.join(ROOT, ".env.local");
  if (fs.existsSync(envPath)) {
    const { default: dotenv } = await import("dotenv");
    dotenv.config({ path: envPath });
  }

  console.log("🚀 ÓrbitaTech — Construindo índice vetorial\n");

  const allChunks = [];

  for (const doc of DOCUMENTS) {
    const filePath = path.join(DOCS_DIR, doc.file);
    console.log(`📄 Extraindo: ${doc.file} (${doc.category})`);

    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  Arquivo não encontrado, pulando.`);
      continue;
    }

    try {
      const rawText = await doc.extractor(filePath);
      const cleanedText = cleanText(rawText);
      const chunks = chunkText(cleanedText);

      console.log(`   ✓ ${chunks.length} chunks gerados`);

      for (let i = 0; i < chunks.length; i++) {
        allChunks.push({
          id: `${doc.file}__chunk_${i}`,
          text: chunks[i],
          metadata: {
            source: doc.file,
            category: doc.category,
            chunkIndex: i,
          },
        });
      }
    } catch (err) {
      console.error(`   ✗ Erro: ${err.message}`);
    }
  }

  console.log(`\n📦 Total de chunks: ${allChunks.length}`);

  if (process.env.COHERE_API_KEY) {
    console.log("\n🔮 Gerando embeddings via Cohere...");

    const texts = allChunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(texts);

    const index = allChunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), "utf-8");

    const fileSizeKb = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
    console.log(`\n✅ Índice salvo em data/index.json (${fileSizeKb} KB)`);
    console.log(`   ${index.length} chunks prontos para uso.`);
  } else {
    console.log("\n⚠️  COHERE_API_KEY não configurada em .env.local.");
  }
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
