/**
 * Semantic Memory Search Tool
 *
 * Busca semantica em todas as memorias do sistema via embeddings + vec0.
 * Retorna memorias relevantes por similaridade, com filtros opcionais.
 *
 * @module semantic-memory-search
 */

import { z } from "zod";
import {
  searchMemoryVecFiltered,
  getDb,
  type MemoryEntry,
  type MemorySource,
} from "../db/sqlite.js";
import { EmbeddingService } from "../db/embedding-service.js";

// Tool definition for MCP
export const semanticMemorySearchTool = {
  name: "semantic_memory_search",
  description: `Busca semantica em todas as memorias do sistema (episodic, narrative, techniques, gotchas).
Usa embeddings para encontrar memorias relevantes por similaridade, nao apenas keyword.

Use para:
- Recuperar aprendizados de producoes anteriores
- Encontrar patterns que funcionaram em ofertas similares
- Cross-offer intelligence (o que funcionou em florayla pode funcionar em neuvelys)
- Buscar gotchas e decisoes relevantes ao contexto atual`,
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Texto natural para busca semantica",
      },
      agent_id: {
        type: "string",
        description: "Filtrar por agente (echo, forge, hawk, etc)",
      },
      offer: {
        type: "string",
        description: "Filtrar por oferta (florayla, neuvelys, etc)",
      },
      niche: {
        type: "string",
        description: "Filtrar por nicho (saude, relacionamento, etc)",
      },
      source: {
        type: "string",
        enum: [
          "agent-episodic",
          "offer-episodic",
          "narrative",
          "technique",
          "gotchas",
          "user-decision",
        ],
        description: "Filtrar por tipo de memoria",
      },
      limit: {
        type: "number",
        default: 10,
        description: "Numero maximo de resultados",
      },
      min_similarity: {
        type: "number",
        default: 0.3,
        description: "Similaridade minima (0-1)",
      },
    },
    required: ["query"],
  },
};

// Input validation
const InputSchema = z.object({
  query: z.string().min(1),
  agent_id: z.string().optional(),
  offer: z.string().optional(),
  niche: z.string().optional(),
  source: z.enum([
    "agent-episodic",
    "offer-episodic",
    "narrative",
    "technique",
    "gotchas",
    "user-decision",
  ]).optional(),
  limit: z.number().min(1).max(50).default(10),
  min_similarity: z.number().min(0).max(1).default(0.3),
});

// Handler
export async function semanticMemorySearchHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);

  // Embed query
  let svc: EmbeddingService;
  try {
    svc = await EmbeddingService.getInstance();
  } catch {
    return `## Semantic Memory Search

**Erro:** Embedding service nao disponivel. Execute o memory indexer primeiro:
\`bun run src/indexers/memory-indexer.ts\``;
  }

  if (!svc.isReady()) {
    return `## Semantic Memory Search

**Erro:** Modelo de embeddings nao carregado. Verifique os logs do MCP server.`;
  }

  const queryVec = await svc.embedQuery(input.query);
  if (!queryVec) {
    return `## Semantic Memory Search

**Erro:** Falha ao gerar embedding para a query.`;
  }

  const queryBuf = EmbeddingService.serializeVector(queryVec);

  // Search with filters
  const results = searchMemoryVecFiltered(queryBuf, input.limit, {
    agent_id: input.agent_id,
    offer: input.offer,
    niche: input.niche,
    source: input.source,
  });

  // Filter by min_similarity
  const filtered = results.filter(r => r.similarity >= input.min_similarity);

  if (filtered.length === 0) {
    return `## Semantic Memory Search

**Query:** "${input.query}"
${input.agent_id ? `**Agent:** ${input.agent_id}` : ""}
${input.offer ? `**Offer:** ${input.offer}` : ""}

**Nenhuma memoria encontrada** com similaridade >= ${(input.min_similarity * 100).toFixed(0)}%.

### Sugestoes:
1. Reduza \`min_similarity\` (ex: 0.2)
2. Remova filtros de agent/offer
3. Tente uma query diferente
4. Execute o indexer: \`bun run src/indexers/memory-indexer.ts\``;
  }

  // Format results
  let output = `## Semantic Memory Search

**Query:** "${input.query}"
**Resultados:** ${filtered.length}
${input.agent_id ? `**Agent:** ${input.agent_id}\n` : ""}${input.offer ? `**Offer:** ${input.offer}\n` : ""}${input.niche ? `**Niche:** ${input.niche}\n` : ""}${input.source ? `**Source:** ${input.source}\n` : ""}
---

`;

  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    const simPct = (entry.similarity * 100).toFixed(0);

    output += `### ${i + 1}. [${entry.source}] — ${simPct}% similar

`;

    // Metadata line
    const meta: string[] = [];
    if (entry.agent_id) meta.push(`Agent: ${entry.agent_id}`);
    if (entry.offer) meta.push(`Offer: ${entry.offer}`);
    if (entry.niche) meta.push(`Niche: ${entry.niche}`);
    if (meta.length > 0) {
      output += `*${meta.join(" | ")}*\n\n`;
    }

    // Content (truncate long entries)
    const content = entry.content.length > 500
      ? entry.content.substring(0, 497) + "..."
      : entry.content;
    output += `> ${content.replace(/\n/g, "\n> ")}\n\n`;

    // Extra metadata
    if (entry.metadata) {
      const extraParts: string[] = [];
      if (entry.metadata.score != null) extraParts.push(`Score: ${entry.metadata.score}`);
      if (entry.metadata.hit_count != null) extraParts.push(`Hits: ${entry.metadata.hit_count}`);
      if (entry.metadata.confidence != null) extraParts.push(`Confidence: ${entry.metadata.confidence}`);
      if (extraParts.length > 0) {
        output += `${extraParts.join(" | ")}\n\n`;
      }
    }

    output += `---\n\n`;
  }

  // Increment hit_count for returned entries (reinforcement)
  try {
    const db = getDb();
    const updateStmt = db.prepare(`
      UPDATE memory_entries
      SET metadata = json_set(COALESCE(metadata, '{}'), '$.hit_count',
        COALESCE(json_extract(metadata, '$.hit_count'), 0) + 1)
      WHERE id = ?
    `);
    for (const entry of filtered) {
      if (entry.id) updateStmt.run(entry.id);
    }
  } catch {
    // Non-critical — skip silently
  }

  return output;
}
