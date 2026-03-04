/**
 * VOC Search Tool
 *
 * Busca semântica em VOC quotes por:
 * - Emoção (medo, frustração, esperança)
 * - Keyword
 * - Intensidade
 * - Nicho
 *
 * Fonte: Pesquisa 05.md - Contextual Retrieval
 */

import { z } from "zod";
import { searchVocByKeyword, searchVocByEmotion, searchVocVec, getDb, type VocQuote } from "../db/sqlite.js";
import { EmbeddingService } from "../db/embedding-service.js";

// Tool definition for MCP
export const vocSearchTool = {
  name: "voc_search",
  description: `Busca VOC (Voice of Customer) quotes por emoção, keyword ou intensidade.

Use para:
- Encontrar linguagem autêntica do público
- Buscar dores específicas por emoção
- Validar hipóteses com quotes reais
- Extrair frases para copy

Retorna quotes rankeadas por relevância e intensidade.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Keyword ou frase para buscar nas quotes",
      },
      emotion: {
        type: "string",
        enum: ["medo", "frustração", "esperança", "vergonha", "culpa", "raiva", "ansiedade", "desejo"],
        description: "Emoção primária para filtrar",
      },
      nicho: {
        type: "string",
        description: "Nicho para filtrar (ex: concursos, saude, relacionamento)",
      },
      min_intensity: {
        type: "number",
        minimum: 1,
        maximum: 5,
        default: 3,
        description: "Intensidade mínima da emoção (1-5)",
      },
      limit: {
        type: "number",
        default: 20,
        description: "Número máximo de resultados",
      },
      mode: {
        type: "string",
        enum: ["keyword", "semantic", "hybrid"],
        default: "hybrid",
        description: "Modo de busca: keyword (LIKE), semantic (embeddings), hybrid (ambos, default)",
      },
    },
    required: [],
  },
};

// Input validation schema
const InputSchema = z.object({
  query: z.string().optional(),
  emotion: z.enum(["medo", "frustração", "esperança", "vergonha", "culpa", "raiva", "ansiedade", "desejo"]).optional(),
  nicho: z.string().optional(),
  min_intensity: z.number().min(1).max(5).default(3),
  limit: z.number().default(20),
  mode: z.enum(["keyword", "semantic", "hybrid"]).default("hybrid"),
});

interface ScoredQuote extends VocQuote {
  similarity?: number;
  _keywordMatch?: boolean;
}

/**
 * Semantic search via embeddings + vec0
 */
async function semanticSearch(query: string, nicho: string | undefined, limit: number): Promise<ScoredQuote[]> {
  try {
    const svc = await EmbeddingService.getInstance();
    if (!svc.isReady()) return [];

    const queryVec = await svc.embedQuery(query);
    if (!queryVec) return [];

    const vecBuf = EmbeddingService.serializeVector(queryVec);
    const vecResults = searchVocVec(vecBuf, limit * 2);

    if (vecResults.length === 0) return [];

    // Fetch full quotes for matched IDs
    const db = getDb();
    const ids = vecResults.map(r => r.quote_id);
    const placeholders = ids.map(() => "?").join(",");
    let sql = `SELECT * FROM voc_quotes WHERE id IN (${placeholders})`;
    const params: any[] = [...ids];

    if (nicho) {
      sql = `SELECT * FROM voc_quotes WHERE id IN (${placeholders}) AND nicho = ?`;
      params.push(nicho);
    }

    const rows = db.prepare(sql).all(...params) as VocQuote[];
    const rowMap = new Map(rows.map(r => [r.id, r]));

    const scored: ScoredQuote[] = [];
    for (const vr of vecResults) {
      const quote = rowMap.get(vr.quote_id);
      if (quote) {
        scored.push({ ...quote, similarity: 1 - vr.distance });
      }
    }

    return scored.sort((a, b) => (b.similarity || 0) - (a.similarity || 0)).slice(0, limit);
  } catch (err) {
    console.error("[vocSearch] Semantic search failed, falling back:", err);
    return [];
  }
}

function mergeResults(target: ScoredQuote[], source: ScoredQuote[]): void {
  const existingIds = new Set(target.map(r => r.id));
  for (const q of source) {
    if (!existingIds.has(q.id)) {
      target.push(q);
      existingIds.add(q.id);
    }
  }
}

// Handler function
export async function vocSearchHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);
  const mode = input.mode;

  let results: ScoredQuote[] = [];

  // Search by emotion if specified
  if (input.emotion) {
    const emotionResults = searchVocByEmotion(
      input.emotion,
      input.nicho,
      input.min_intensity,
      input.limit
    );
    results = emotionResults.map(q => ({ ...q, _keywordMatch: true }));
  }

  // Search by query
  if (input.query) {
    if (mode === "keyword") {
      // Pure keyword search
      const keywordResults = searchVocByKeyword(input.query, input.nicho, input.limit);
      mergeResults(results, keywordResults.map(q => ({ ...q, _keywordMatch: true })));

    } else if (mode === "semantic") {
      // Pure semantic search
      const semResults = await semanticSearch(input.query, input.nicho, input.limit);
      mergeResults(results, semResults);

    } else {
      // Hybrid: both keyword + semantic, merged with combined score
      const keywordResults = searchVocByKeyword(input.query, input.nicho, input.limit);
      const semResults = await semanticSearch(input.query, input.nicho, input.limit);

      // Build combined score map
      const scoreMap = new Map<number, { keyword: number; semantic: number; quote: ScoredQuote }>();

      // Keyword results get position-based relevance (1.0 for first, decreasing)
      keywordResults.forEach((q, idx) => {
        const keyScore = 1.0 - (idx / keywordResults.length) * 0.5;
        scoreMap.set(q.id!, { keyword: keyScore, semantic: 0, quote: { ...q, _keywordMatch: true } });
      });

      // Semantic results use similarity score
      for (const q of semResults) {
        const existing = scoreMap.get(q.id!);
        if (existing) {
          existing.semantic = q.similarity || 0;
          existing.quote.similarity = q.similarity;
        } else {
          scoreMap.set(q.id!, { keyword: 0, semantic: q.similarity || 0, quote: q });
        }
      }

      // Combined score: 0.4 * keyword + 0.6 * semantic
      const combined = [...scoreMap.values()]
        .map(({ keyword, semantic, quote }) => ({
          ...quote,
          _combinedScore: 0.4 * keyword + 0.6 * semantic,
        }))
        .sort((a, b) => b._combinedScore - a._combinedScore)
        .slice(0, input.limit);

      results = combined;
    }
  }

  // If no filters, return message
  if (!input.query && !input.emotion) {
    return `## VOC Search

Por favor especifique pelo menos um critério de busca:
- **query**: Palavra-chave para buscar nas quotes
- **emotion**: Emoção primária (medo, frustração, esperança, vergonha, culpa, raiva, ansiedade, desejo)
- **nicho**: Filtrar por nicho específico
- **min_intensity**: Intensidade mínima (1-5)

Exemplo:
\`\`\`json
{
  "emotion": "frustração",
  "nicho": "concursos",
  "min_intensity": 4
}
\`\`\``;
  }

  // Format results
  if (results.length === 0) {
    return `## VOC Search

**Nenhuma quote encontrada** para os critérios:
${input.query ? `- Query: "${input.query}"` : ""}
${input.emotion ? `- Emoção: ${input.emotion}` : ""}
${input.nicho ? `- Nicho: ${input.nicho}` : ""}
${input.min_intensity ? `- Intensidade mínima: ${input.min_intensity}` : ""}

### Sugestões:
1. Tente termos mais genéricos
2. Reduza a intensidade mínima
3. Remova o filtro de nicho
4. Use o indexador para adicionar mais quotes: \`bun run index:voc\``;
  }

  // Build output
  const showSimilarity = mode === "semantic" || mode === "hybrid";
  let output = `## VOC Search Results (mode: ${mode})

**${results.length} quotes encontradas**

| # | Quote | Emoção | Int. | Plataforma |${showSimilarity ? " Sim. |" : ""}
|---|-------|--------|------|------------|${showSimilarity ? "------|" : ""}
`;

  for (let i = 0; i < Math.min(results.length, input.limit); i++) {
    const quote = results[i] as ScoredQuote;
    const truncatedQuote = quote.quote.length > 80
      ? quote.quote.substring(0, 77) + "..."
      : quote.quote;

    const simCol = showSimilarity && quote.similarity != null
      ? ` ${(quote.similarity * 100).toFixed(0)}% |`
      : showSimilarity ? " - |" : "";
    output += `| ${i + 1} | "${truncatedQuote}" | ${quote.emotion || "-"} | ${quote.intensity || "-"}/5 | ${quote.platform} |${simCol}\n`;
  }

  // Add full quotes section for top 5
  output += `\n### Top 5 Quotes Completas\n\n`;

  for (let i = 0; i < Math.min(5, results.length); i++) {
    const quote = results[i];
    output += `**${i + 1}. @${quote.username || "anônimo"}** (${quote.platform})
> "${quote.quote}"

Emoção: ${quote.emotion || "não classificada"} | Intensidade: ${quote.intensity || "?"}/5
Oferta: ${quote.offer_id}

---

`;
  }

  // Usage tips
  output += `
### Como Usar

1. **Para hooks:** Use quotes com intensidade 5 - maior dor = maior conexão
2. **Para prova social:** Busque por "consegui", "funcionou", "mudou"
3. **Para objeções:** Busque por "medo", "dúvida", "será que"
4. **Triangulação:** Quotes que aparecem em múltiplas plataformas = validação forte
`;

  return output;
}
