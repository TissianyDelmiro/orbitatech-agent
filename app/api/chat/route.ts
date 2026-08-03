import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/retrieval";
import { generateAnswer } from "@/lib/cohere";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { question, category } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "A pergunta é obrigatória." },
        { status: 400 }
      );
    }

    // 1. Retrieval + Rerank
    const relevantResults = await retrieveRelevantChunks(
      question,
      category || undefined,
      20,
      5
    );

    const contextDocuments = relevantResults.map((r) => r.document);

    // 2. Geração da resposta via Cohere
    const answer = await generateAnswer(question, contextDocuments);

    const responseTimeMs = Date.now() - startTime;
    const sources = Array.from(
      new Set(
        contextDocuments.map(
          (doc) => `${doc.metadata.source} (${doc.metadata.category})`
        )
      )
    );

    // 3. Log estruturado (console.log em produção, agent_logs.jsonl em dev local)
    const logData = {
      timestamp: new Date().toISOString(),
      question,
      categoryFilter: category || null,
      answer,
      sources,
      responseTimeMs,
    };

    console.log("[RAG Chat Log]", JSON.stringify(logData));

    // Salva em logs/agent_logs.jsonl localmente
    if (process.env.NODE_ENV !== "production") {
      try {
        const logDir = path.join(process.cwd(), "logs");
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(
          path.join(logDir, "agent_logs.jsonl"),
          JSON.stringify(logData) + "\n",
          "utf-8"
        );
      } catch (logErr) {
        console.error("Erro ao salvar log local:", logErr);
      }
    }

    return NextResponse.json({
      answer,
      sources,
      relevantDocuments: contextDocuments.map((doc) => ({
        source: doc.metadata.source,
        category: doc.metadata.category,
        textSnippet: doc.text.slice(0, 200) + "...",
      })),
      responseTimeMs,
    });
  } catch (error: any) {
    console.error("Erro na API Route /api/chat:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor de IA." },
      { status: 500 }
    );
  }
}
