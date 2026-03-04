---
template_name: "swipe-analysis-specs"
template_version: "1.0.0"
template_type: "methodology"
description: "Especificacoes e criterios para analise estruturada de swipe files"
phase: "research"
output_format: "markdown"
---

# Template: Swipe Analysis RAG Specs

> Especificações técnicas para análise de swipe files com RAG
> Fonte: Pesquisa Externa 05.md - Swipe Analysis State of the Art

---

## Stack Recomendado

### Embeddings

| Provider | Modelo | Custo | Uso |
|----------|--------|-------|-----|
| **Voyage AI** | voyage-4 | $0.06/1M tokens | Recomendado |
| Voyage AI | voyage-finance-2 | $0.12/1M tokens | Dados financeiros |
| Voyage AI | voyage-large-2-instruct | $0.12/1M tokens | Tasks específicas |
| OpenAI | text-embedding-3-large | $0.13/1M tokens | Alternativa |

> **Voyage AI** é recomendação oficial da Anthropic.

### Vector Database

| Database | Tipo | Uso |
|----------|------|-----|
| **LanceDB** | Local | Projetos locais, prototipagem |
| **Pinecone** | Cloud | Produção, escala |
| Qdrant | Híbrido | Open-source, self-hosted |
| Chroma | Local | Desenvolvimento |

---

## Chunking Strategy

### Parâmetros Recomendados

| Parâmetro | Valor | Notas |
|-----------|-------|-------|
| **Tamanho do chunk** | 400-600 tokens | Optimal para copy |
| **Overlap** | 15-20% (60-120 tokens) | Preserva contexto |
| **Separadores** | `\n\n`, `\n`, `. ` | Ordem de prioridade |

### Por Tipo de Documento

| Tipo | Chunk Size | Overlap | Notas |
|------|------------|---------|-------|
| VSL Script | 500 tokens | 20% | Manter seções intactas |
| Landing Page | 400 tokens | 15% | Blocos menores |
| Email | 300 tokens | 10% | Emails são curtos |
| Swipe Longo | 600 tokens | 20% | Mais contexto |

---

## Contextual Retrieval (Anthropic)

> Reduz falhas de retrieval em **49-67%** quando combinado com reranking.

### Como Funciona

1. Para cada chunk, Claude gera contexto situacional
2. Contexto é prepended ao chunk antes de embedding
3. Chunks carregam "memória" do documento completo

### Prompt de Contextualização

```
<document>
{{WHOLE_DOCUMENT}}
</document>

Aqui está o chunk que queremos situar dentro do documento inteiro:

<chunk>
{{CHUNK_CONTENT}}
</chunk>

Por favor, dê um contexto curto e sucinto para situar este chunk
dentro do documento geral para melhorar a busca do chunk.
Responda apenas com o contexto sucinto e nada mais.
```

### Formato Final do Chunk

```
[CONTEXTO]: Este chunk é do VSL "Método X" de Stefan Georgi,
especificamente a seção de UMP onde explica por que dietas falham.

[CONTEÚDO ORIGINAL]: {chunk original}
```

---

## Schema de Metadados

### Campos Obrigatórios

| Campo | Tipo | Exemplo |
|-------|------|---------|
| `source` | string | "swipe-stefan-georgi-vsl-001" |
| `type` | enum | "vsl", "lp", "email", "ad" |
| `section` | string | "lead", "ump", "ums", "close" |
| `niche` | string | "saude", "concursos", "riqueza" |
| `date_added` | datetime | "2026-01-30" |

### Campos Opcionais

| Campo | Tipo | Uso |
|-------|------|-----|
| `author` | string | Copywriter original |
| `performance` | enum | "proven", "untested" |
| `emotional_trigger` | array | ["fear", "greed", "curiosity"] |
| `technique` | array | ["open_loop", "future_pace"] |

---

## Emotional Trigger Schema

### Triggers Primários

| Trigger | Descrição | Exemplo |
|---------|-----------|---------|
| `fear` | Medo de perda, consequências | "Se você não agir agora..." |
| `greed` | Desejo de ganho rápido | "Dobrar seu investimento em..." |
| `curiosity` | Lacuna de conhecimento | "O segredo que médicos escondem" |
| `urgency` | Escassez temporal | "Apenas nas próximas 24 horas" |
| `social_proof` | Validação social | "Mais de 10.000 já usaram" |
| `authority` | Credibilidade | "Dr. fulano descobriu..." |

### Triggers Secundários

| Trigger | Descrição |
|---------|-----------|
| `exclusivity` | Sentir-se especial |
| `reciprocity` | Retribuir favor |
| `commitment` | Consistência com ações passadas |
| `liking` | Afinidade com o vendedor |
| `scarcity` | Quantidade limitada |

---

## Query Patterns

### Para Hooks

```
Encontre hooks de VSL no nicho de [NICHO] que usam o trigger [TRIGGER].
Priorize swipes com performance comprovada.
```

### Para Estrutura

```
Encontre exemplos de seção [SEÇÃO] em VSLs de alta conversão.
Inclua o contexto da seção anterior e posterior.
```

### Para Técnicas

```
Encontre exemplos da técnica [TÉCNICA] em copy de resposta direta.
Mostre como é implementada em diferentes nichos.
```

---

## Pipeline de Ingestão

```
1. UPLOAD
   └── Documento bruto (PDF, MD, TXT)

2. PARSE
   ├── Extrair texto
   ├── Identificar tipo (VSL, LP, email)
   └── Detectar seções (lead, body, close)

3. CHUNK
   ├── Dividir em chunks (400-600 tokens)
   ├── Aplicar overlap (15-20%)
   └── Manter seções intactas quando possível

4. CONTEXTUALIZE
   ├── Gerar contexto situacional
   └── Prepend ao chunk

5. EMBED
   ├── Voyage AI voyage-4
   └── Gerar vetor 1536-dim

6. STORE
   ├── Vetor + metadados
   └── Index por tipo, nicho, section
```

---

## Custo Estimado

### Para 100 Swipes (~500K tokens)

| Componente | Custo |
|------------|-------|
| Embeddings (Voyage) | $0.03 |
| Contextualização (Claude) | ~$0.50 |
| Storage (Pinecone) | ~$0.10/mês |
| **Total setup** | ~$0.63 |
| **Total mensal** | ~$0.10 |

### Para 1000 Swipes (~5M tokens)

| Componente | Custo |
|------------|-------|
| Embeddings | $0.30 |
| Contextualização | ~$5.00 |
| Storage | ~$1.00/mês |
| **Total setup** | ~$6.30 |
| **Total mensal** | ~$1.00 |

---

## Anti-Patterns

| Anti-Pattern | Problema | Solução |
|--------------|----------|---------|
| Chunks muito grandes | Perda de precisão | Usar 400-600 tokens |
| Sem overlap | Perda de contexto | Usar 15-20% overlap |
| Sem contextualização | Retrieval impreciso | Usar Contextual Retrieval |
| Metadados pobres | Filtros ineficazes | Schema completo |
| Embedding genérico | Performance ruim | Voyage AI especializado |

---

## MCP Servers para RAG Local

| Server | Função | Instalação |
|--------|--------|------------|
| `mcp-local-rag` | RAG local com LanceDB | `npx -y mcp-local-rag` |
| `claude-context` | Busca semântica via Milvus | `npx @zilliz/claude-context-mcp@latest` |
| `qdrant-mcp-server` | Vector search com Qdrant | Oficial Qdrant |

### Configuração Exemplo

```json
{
  "mcpServers": {
    "swipe-rag": {
      "command": "npx",
      "args": ["-y", "mcp-local-rag"],
      "env": {
        "BASE_DIR": "~/.claude/swipes",
        "CHUNK_SIZE": "500",
        "CHUNK_OVERLAP": "100"
      }
    }
  }
}
```

---

*Baseado em Anthropic Contextual Retrieval + Voyage AI Best Practices*
*Pesquisa Externa 05.md - January 2026*
