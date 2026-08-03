/**
 * lib/cohere.ts
 *
 * Módulo isolado com chamadas à API da Cohere v2:
 * 1. embedText - Gera embedding de um texto (pergunta do usuário)
 * 2. rerankDocuments - Aplica Reranking nos documentos mais parecidos
 * 3. generateAnswer - Gera resposta final fundamentada nos documentos
 */

const COHERE_API_URL = "https://api.cohere.com/v2";

function getApiKey(): string {
  const key = process.env.COHERE_API_KEY;
  if (!key) {
    throw new Error("COHERE_API_KEY não configurada nas variáveis de ambiente.");
  }
  return key;
}

/**
 * Gera embedding para a consulta do usuário (input_type: search_query)
 */
export async function embedQuery(text: string): Promise<number[]> {
  const response = await fetch(`${COHERE_API_URL}/embed`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      texts: [text],
      model: "embed-multilingual-v3.0",
      input_type: "search_query",
      embedding_types: ["float"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API Cohere Embed: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return data.embeddings.float[0];
}

export interface RerankDocument {
  id: string;
  text: string;
  metadata: {
    source: string;
    category: string;
    chunkIndex: number;
  };
}

export interface RerankResult {
  document: RerankDocument;
  relevanceScore: number;
}

/**
 * Aplica Reranking utilizando o modelo rerank-multilingual-v3.0 da Cohere
 */
export async function rerankDocuments(
  query: string,
  documents: RerankDocument[],
  topN: number = 5
): Promise<RerankResult[]> {
  if (documents.length === 0) return [];

  const response = await fetch(`${COHERE_API_URL}/rerank`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "rerank-multilingual-v3.0",
      query,
      documents: documents.map((doc) => doc.text),
      top_n: Math.min(topN, documents.length),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API Cohere Rerank: ${response.status} — ${errorText}`);
  }

  const data = await response.json();

  return data.results.map((res: { index: number; relevance_score: number }) => ({
    document: documents[res.index],
    relevanceScore: res.relevance_score,
  }));
}

/**
 * Gera a resposta final usando a API Chat da Cohere v2 (command-r-plus)
 */
export async function generateAnswer(
  query: string,
  contextDocuments: RerankDocument[]
): Promise<string> {
  const contextFormatted = contextDocuments
    .map(
      (doc, i) =>
        `--- Documento ${i + 1} [Fonte: ${doc.metadata.source} | Categoria: ${doc.metadata.category}] ---\n${doc.text}`
    )
    .join("\n\n");

  const systemPrompt = `Você é o assistente virtual corporativo oficial da empresa ÓrbitaTech.
Sua missão é responder perguntas dos colaboradores de forma precisa, cortês e profissional.

REGRAS OBRIGATÓRIAS DE RESPOSTA:
1. Responda ESTRITAMENTE com base nos documentos de contexto fornecidos abaixo.
2. Se o contexto fornecido NÃO contiver a informação necessária para responder com certeza, diga educadamente: "Desculpe, não encontrei essa informação nos documentos internos da ÓrbitaTech."
3. NUNCA invente informações, regras ou valores que não estejam nos documentos.
4. Ao final da sua resposta, cite SEMPRE os documentos fontes utilizados no formato:
   \n\n📌 **Fontes consultadas:**\n- [Nome do Arquivo] (Categoria)`;

  const response = await fetch(`${COHERE_API_URL}/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "command-r-plus",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `CONTEXTO DOS DOCUMENTOS INTERNOS:\n${contextFormatted}\n\nPERGUNTA DO COLABORADOR:\n${query}`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API Cohere Chat: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return data.message.content[0].text;
}
