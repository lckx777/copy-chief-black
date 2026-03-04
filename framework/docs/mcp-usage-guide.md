# MCP Usage Guide - Ecossistema v4.9.6

> Guia completo de uso dos Model Context Protocol servers configurados.
> **Atualizado:** 2026-01-26

---

## Visão Geral

| MCP | Status | Função Principal | Prioridade |
|-----|--------|------------------|------------|
| apify | ✅ Conectado | VOC extraction via Actors | 1 (preferencial) |
| fb_ad_library | ✅ Conectado | Mineração Meta Ads | 1 (ads) |
| firecrawl | ✅ Conectado | Web scraping geral | 2 (fallback) |
| playwright | ✅ Conectado | Browser automation | 3 (último resort) |
| zen | ✅ Conectado | Multi-model validation | Situacional |
| claude-mem | ✅ Plugin | Memory persistence | Automático |
| context7 | ✅ Conectado | Documentation lookup | On-demand |

---

## Tool Priority (OBRIGATÓRIO)

Para extração de plataformas sociais (YouTube, Instagram, TikTok):

```
1. Apify Actor específico    ← SEMPRE tentar primeiro
2. Playwright direto         ← Se Apify falha
3. Firecrawl search          ← Se Playwright falha
4. WebSearch                 ← ÚLTIMO RESORT
```

**Regra:** NUNCA pular direto para WebSearch sem tentar Apify primeiro.

---

## 1. Apify

### Função
Extração de dados de plataformas sociais via Actors especializados.

### Ferramentas Disponíveis

| Tool | Função |
|------|--------|
| `search-actors` | Buscar actors disponíveis no Apify Store |
| `fetch-actor-details` | Obter schema de input de um actor |
| `call-actor` | Executar actor com parâmetros |
| `get-actor-output` | Obter resultado de execução |
| `get-actor-run` | Verificar status de execução |
| `get-dataset-items` | Ler items do dataset resultante |

### Actors Recomendados por Plataforma

| Plataforma | Actor | Uso |
|------------|-------|-----|
| YouTube | `streamers/youtube-comment-scraper` | Comentários de vídeos |
| Instagram | `apify/instagram-comment-scraper` | Comentários de posts |
| TikTok | `clockworks/tiktok-comments-scraper` | Comentários de vídeos |
| Reclame Aqui | `pocesar/reclame-aqui-scraper` | Reclamações de empresas |
| Reddit | `trudax/reddit-scraper` | Posts e comentários |

### Exemplo de Uso

```typescript
// 1. Buscar actor
mcp__apify__search-actors({ query: "youtube comments" })

// 2. Verificar schema
mcp__apify__fetch-actor-details({ actorId: "streamers/youtube-comment-scraper" })

// 3. Executar
mcp__apify__call-actor({
  actorId: "streamers/youtube-comment-scraper",
  input: {
    videoUrls: ["https://youtube.com/watch?v=..."],
    maxComments: 100
  }
})

// 4. Obter resultado
mcp__apify__get-actor-output({ runId: "..." })
```

### Limites e Boas Práticas

- **Timeout:** 5 minutos por execução
- **Batch:** Máximo 15 URLs por vez
- **Rate limit:** Respeitar limites das plataformas
- **Custos:** Apify cobra por compute units

---

## 2. Facebook Ad Library (fb_ad_library)

### Função
Mineração de anúncios da Meta Ads Library para análise competitiva.

### Ferramentas Disponíveis

| Tool | Função |
|------|--------|
| `get_meta_platform_id` | Buscar ID de página/marca por nome OU keyword |
| `get_meta_ads` | Extrair anúncios por page ID |
| `analyze_ad_image` | Análise visual de criativos (cores, texto, composição) |
| `analyze_ad_video` | Análise de vídeo (requer Gemini API) |
| `analyze_ad_videos_batch` | Análise em batch de vídeos |
| `get_cache_stats` | Estatísticas do cache |
| `search_cached_media` | Buscar mídia em cache |

### Fluxo de Descoberta (Discovery-First)

```
1. Buscar por KEYWORDS de nicho
   ↓
2. Descobrir páginas escalando
   ↓
3. Calcular Scale Score
   ↓
4. Extrair ads das top páginas
   ↓
5. Analisar criativos
```

### Scale Score (OBRIGATÓRIO)

```
Scale Score = (ads_ativos × 2) + (variações_copy × 1.5)
```

| Score | Classificação |
|-------|---------------|
| 20+ | Altamente escalado |
| 10-19 | Escalando |
| 5-9 | Em teste |
| <5 | Novo/falhando |

### Exemplo de Uso

```typescript
// 1. Descobrir páginas por keyword
mcp__fb_ad_library__get_meta_platform_id({
  search_term: "concurso público",
  country: "BR"
})

// 2. Extrair ads de uma página
mcp__fb_ad_library__get_meta_ads({
  page_id: "123456789",
  ad_type: "VIDEO",
  limit: 50
})

// 3. Analisar criativo de imagem
mcp__fb_ad_library__analyze_ad_image({
  image_url: "https://...",
  analysis_type: "comprehensive"
})
```

### Keywords por Nicho (Concursos)

**Nível 1 - Nicho Geral:**
- "concurso público", "passar concurso", "concurseiro"

**Nível 2 - Sub-nichos:**
- Lei Seca: "lei seca", "vade mecum", "memorizar artigos"
- Questões: "questões comentadas", "banco questões"
- Áreas: "auditor fiscal", "magistratura", "PRF"

**Nível 3 - Mecanismos:**
- "técnica memorização", "estudar pouco tempo", "ansiedade prova"

---

## 3. Firecrawl

### Função
Web scraping de landing pages e conteúdo web geral.

### Ferramentas Disponíveis

| Tool | Função |
|------|--------|
| `firecrawl_scrape` | Extrair conteúdo de URL única |
| `firecrawl_search` | Buscar e extrair de múltiplas URLs |
| `firecrawl_crawl` | Crawlear site completo |
| `firecrawl_map` | Mapear estrutura de site |
| `firecrawl_extract` | Extrair dados estruturados |
| `firecrawl_agent` | Agente inteligente de extração |

### Exemplo de Uso

```typescript
// Scrape de landing page
mcp__firecrawl__firecrawl_scrape({
  url: "https://exemplo.com/oferta",
  formats: ["markdown", "html"]
})

// Busca com extração
mcp__firecrawl__firecrawl_search({
  query: "curso concurso público",
  limit: 10
})

// Crawl de site
mcp__firecrawl__firecrawl_crawl({
  url: "https://exemplo.com",
  maxDepth: 2,
  limit: 50
})
```

### Quando Usar

- Landing pages de concorrentes
- Conteúdo de blogs/artigos
- Páginas de vendas
- Documentação pública

### Quando NÃO Usar

- Plataformas sociais (usar Apify)
- Sites com login (usar Playwright)
- APIs disponíveis (usar diretamente)

---

## 4. Playwright

### Função
Automação de browser para sites dinâmicos e que requerem interação.

### Ferramentas Disponíveis

| Tool | Função |
|------|--------|
| `browser_navigate` | Navegar para URL |
| `browser_click` | Clicar em elemento |
| `browser_type` | Digitar texto |
| `browser_snapshot` | Capturar estado da página (DOM) |
| `browser_take_screenshot` | Tirar screenshot |
| `browser_evaluate` | Executar JavaScript |
| `browser_fill_form` | Preencher formulário |
| `browser_wait_for` | Aguardar elemento/condição |

### Exemplo de Uso

```typescript
// 1. Navegar
mcp__playwright__browser_navigate({ url: "https://..." })

// 2. Aguardar carregamento
mcp__playwright__browser_wait_for({
  selector: ".comments-section",
  timeout: 5000
})

// 3. Capturar estado
mcp__playwright__browser_snapshot()

// 4. Interagir
mcp__playwright__browser_click({ selector: "button.load-more" })
```

### Quando Usar

- Sites com JavaScript pesado
- Conteúdo carregado dinamicamente
- Login necessário
- Interação complexa (scroll infinito, modais)

### Quando NÃO Usar (Tool Priority)

- YouTube, Instagram, TikTok → **Apify primeiro**
- Landing pages estáticas → **Firecrawl**
- Dados estruturados disponíveis → **API/MCP específico**

---

## 5. Zen MCP

### Função
Validação multi-modelo para decisões críticas de copy.

### Ferramentas Disponíveis

| Tool | Função |
|------|--------|
| `chat` | Conversa com modelo específico |
| `thinkdeep` | Análise profunda de problema |
| `planner` | Planejamento de tarefas |
| `consensus` | Consenso entre múltiplos modelos |
| `codereview` | Review de código |
| `debug` | Debugging assistido |
| `analyze` | Análise geral |
| `refactor` | Sugestões de refatoração |
| `testgen` | Geração de testes |
| `docgen` | Geração de documentação |
| `secaudit` | Auditoria de segurança |

### Uso em copy-critic (Fase 5)

```typescript
// Validação multi-modelo de MUP
mcp__zen__consensus({
  prompt: "Avalie este MUP: [...]",
  models: ["gpt-4", "gemini-pro"],
  criteria: ["originalidade", "credibilidade", "impacto"]
})

// Análise profunda
mcp__zen__thinkdeep({
  problem: "Por que este hook não está convertendo?",
  context: "[dados de performance]"
})
```

### Modelos Disponíveis

Use `mcp__zen__listmodels()` para ver modelos disponíveis.

---

## 6. Claude Mem

### Função
Persistência de memória entre sessões.

### Ferramentas Disponíveis

| Tool | Função |
|------|--------|
| `search` | Buscar memórias por keyword |
| `timeline` | Ver timeline de atividades |
| `get_observations` | Obter observações por ID |

### Uso Automático

Este MCP é usado automaticamente pelos hooks:
- `session-start.ts` carrega contexto relevante
- `curation.ts` salva memórias importantes

### Busca Manual

```typescript
// Buscar memórias relacionadas
mcp__plugin_claude-mem_mcp-search__search({
  query: "CONCURSA.AI VOC",
  limit: 10
})

// Ver timeline
mcp__plugin_claude-mem_mcp-search__timeline({
  days: 7
})
```

---

## 7. Context7

### Função
Lookup de documentação de bibliotecas e frameworks.

### Ferramentas Disponíveis

| Tool | Função |
|------|--------|
| `resolve-library-id` | Resolver ID de biblioteca |
| `query-docs` | Buscar documentação |

### Exemplo de Uso

```typescript
// 1. Resolver biblioteca
mcp__context7__resolve-library-id({
  library: "react"
})

// 2. Buscar docs
mcp__context7__query-docs({
  libraryId: "react",
  query: "useState hook"
})
```

---

## Troubleshooting

### MCP não conecta

```bash
# Verificar status
claude mcp list

# Reiniciar
claude mcp restart apify
```

### Apify timeout

- Reduzir batch size (máx 15 URLs)
- Usar async mode para execuções longas
- Verificar se actor está disponível

### Playwright bloqueado

- Verificar Tool Priority (Apify primeiro)
- Usar escape `--force` se necessário
- Verificar se site permite scraping

### Zen sem resposta

- Verificar API keys configuradas
- Testar com `mcp__zen__listmodels()`
- Usar modelo alternativo

---

*Last updated: 2026-01-26 | Ecosystem v4.9.6*
