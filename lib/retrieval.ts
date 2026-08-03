/**
 * lib/retrieval.ts
 *
 * Módulo de busca por similaridade de cosseno em memória contra data/index.json
 */

import indexData from "../data/index.json";
import { embedQuery, rerankDocuments, RerankDocument, RerankResult } from "./cohere";

export interface ChunkItem {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    category: string;
    chunkIndex: number;
  };
}

/**
 * Calcula a similaridade de cosseno entre dois vetores de números
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Recupera os chunks mais semelhantes da base vetorial index.json
 */
export async function retrieveRelevantChunks(
  query: string,
  categoryFilter?: string,
  topK: number = 20,
  topNRerank: number = 5
): Promise<RerankResult[]> {
  // 1. Gerar embedding para a query
  const queryEmbedding = await embedQuery(query);

  // 2. Carregar chunks e filtrar por categoria se especificado
  const chunks = indexData as ChunkItem[];
  const candidateChunks = categoryFilter
    ? chunks.filter((c) => c.metadata.category.toLowerCase() === categoryFilter.toLowerCase())
    : chunks;

  // 3. Calcular similaridade de cosseno
  const scoredChunks = candidateChunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // 4. Ordenar por score decrescente e pegar topK
  scoredChunks.sort((a, b) => b.score - a.score);
  const topKCandidates: RerankDocument[] = scoredChunks.slice(0, topK).map((sc) => sc.chunk);

  // 5. Aplicar Rerank via Cohere
  const rerankedResults = await rerankDocuments(query, topKCandidates, topNRerank);
  return rerankedResults;
}
