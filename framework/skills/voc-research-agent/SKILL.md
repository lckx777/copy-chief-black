---
name: voc-research-agent
description: |
  Skill técnica de extração VOC (Voice of Customer) via Apify actors.
  Ativa quando: extrair comentários, coletar VOC, buscar quotes de YouTube/TikTok/Instagram/Reddit,
  Reclame Aqui, Mercado Livre, Amazon. Chamado pelo audience-research-agent.
---

# VOC Research Agent

> **WARNING: Este skill REQUER MCPs (Apify, Firecrawl, Playwright).**
> Se invocado como subagent, o caller DEVE usar `subagent_type: general-purpose`.
> O tipo `researcher` NÃO tem acesso a MCPs no runtime — ToolSearch indisponível.
> Resultado sem general-purpose: 100% fallback para WebSearch = VOC de baixa qualidade.

Skill técnica de extração Voice of Customer via Apify. Foco exclusivo: extrair, processar e salvar quotes verbatim.

## Quick Start

1. Receber plataforma + queries + limites do chamador
2. Executar: Discovery (web_search) → Extração (Apify) → Processamento (batches) → Salvamento
3. Retornar path do arquivo .md ao chamador
→ Output: `voc_[plataforma]_[query]_[data].md` + status + totais

## Output Location

Write all outputs to:
- Raw extraction: `research/{offer-name}/voc/raw/[plataforma]-[date].md`
- Format: Markdown with YAML frontmatter

**Return to caller:**
```yaml
status: success|partial|error
arquivo_path: "research/{offer}/voc/raw/[plataforma]-[date].md"
total_quotes: int
total_fontes: int
```

**CRITICAL:** This agent writes to raw/. Caller (audience-research-agent) processes into processed/ and summary.md.

## Posição no Ecossistema

Este skill é uma ferramenta técnica, não agente autônomo. Chamado por outros agentes (principalmente audience-research-agent) para executar extrações.

Responsabilidades: descobrir URLs via web_search, executar Apify actors, aplicar protocolo PROCESS-SAVE-FORGET, salvar arquivo .md, retornar path ao chamador.

Não faz: análise psicográfica, classificação por frameworks, geração de insights, cálculo de scores. Toda análise é responsabilidade do chamador.

## Interface

Input esperado do chamador:

```yaml
plataforma: youtube|instagram|tiktok|reddit|amazon|reclameaqui|mercadolivre
queries: list[string]
limite_quotes: int  # default 150
limite_urls: int    # default 5
filtro_data: string # opcional, ex: "últimos 6 meses"
```

Output retornado:

```yaml
status: success|partial|error
arquivo_path: string  # /home/claude/voc_[plataforma]_[query]_[data].md
total_quotes: int
total_fontes: int
virais_analisados: int  # NOVO: quantos conteúdos virais foram analisados
warnings: list[string]  # opcional
```

---

## Tool Priority (OBRIGATÓRIO)

**CRÍTICO:** Para cada plataforma, SEMPRE tentar ferramentas nesta ordem:

1. **Apify Actor específico** (5min timeout) → Comentários REAIS
2. **Playwright direto** (se Apify falha) → Navegação direta
3. **Firecrawl search** (se Playwright falha) → Extração web
4. **WebSearch** (ÚLTIMO RESORT - apenas se TUDO falha) → Conteúdo indexado

**NUNCA pular direto para WebSearch sem tentar Apify primeiro.**

Fluxo correto:
```
Tentar Apify Actor → Timeout/Erro?
                   ├─ NÃO → Extrair comentários reais ✓
                   └─ SIM → Retry 1x (transient failure)
                            ├─ Sucesso → Extrair ✓
                            └─ Falha → Tentar Firecrawl
                                       ├─ Sucesso → Extrair ✓
                                       └─ Falha → Tentar Playwright
                                                  ├─ Sucesso → Extrair ✓
                                                  └─ Falha → WebSearch (último resort)
```

Fluxo INCORRETO (problema identificado em 2026-01):
```
Tentar extração → WebSearch imediato → Blog content (NÃO VOC real) ✗
```

### MCP Failure Protocol (OBRIGATÓRIO)

Se qualquer tool Apify retornar erro:
1. **NÃO fazer fallback silencioso.** Logar o erro explicitamente.
2. Retry UMA vez (sessões MCP podem ter falhas transientes).
3. Se falhar de novo, seguir hierarquia (Firecrawl → Playwright → WebSearch).
4. **O nome do arquivo DEVE refletir o método REAL usado:**
   - Apify funcionou → `{platform}-apify.md`
   - Fallback para Firecrawl → `{platform}-firecrawl.md`
   - Fallback para WebSearch → `{platform}-websearch.md`
5. **YAML header OBRIGATÓRIO em todo arquivo de extração:**
```yaml
---
extraction_method: apify|firecrawl|playwright|websearch
platform: youtube|tiktok|reddit|instagram|amazon
apify_dataset_id: "abc123"  # só se Apify foi realmente usado
fallback_reason: "Apify error: session expired"  # só se houve fallback
tools_attempted: [apify, firecrawl]
tools_succeeded: [firecrawl]
---
```
6. No retorno ao chamador, SEMPRE incluir `extraction_method` e `tools_failed` se houver.

---

## Viral-First Strategy (OBRIGATÓRIO)

Antes de extrair comentários, **SEMPRE** identificar conteúdo viral primeiro:

### Passo 1: Descobrir Top 10 Virais
Usar ferramenta de discovery para encontrar conteúdo mais engajado por plataforma.

### Passo 2: Validar Engajamento Mínimo
| Plataforma | Threshold Mínimo |
|------------|------------------|
| YouTube | 10K+ views OU 500+ comments |
| Instagram | 5K+ likes OU 200+ comments |
| TikTok | 50K+ views OU 1K+ comments |
| Reddit | 100+ upvotes OU 50+ comments |
| ReclameAqui | N/A (todas reclamações são válidas) |

### Passo 3: Extrair Apenas de Virais
- Extrair comentários APENAS dos top 10 conteúdos por engajamento
- Priorizar comentários com mais likes/replies (mais autenticidade)
- Registrar métricas de engajamento junto com cada quote

### Passo 4: Análise de Formato (OBRIGATÓRIO)
Para cada conteúdo viral, registrar:
- **YouTube:** Duração, formato (talking head/slide/animação), hook do título, thumbnail style
- **Instagram:** Tipo (carrossel/reel/estático), tema, estilo visual, caption hook
- **TikTok:** Som/música, duração, formato (POV/storytime/duet), hook 3seg, hashtags

---

## Outputs Obrigatórios (v4.2)

Cada extração DEVE gerar:

1. **`*-viral-extraction.md`** - Quotes + tabela de virais analisados
2. **Seção "Análise de Formato"** - Padrões identificados no conteúdo viral
3. **Métricas de engajamento** - Views, likes, comments por fonte

**Estrutura mínima do arquivo:**
```markdown
# [Plataforma] Viral VOC Extraction
**Data:** [DATA] | **Método:** Apify [ACTOR]

## Conteúdos Virais Identificados (Top 10)
| # | URL | Título | Views | Comments | Formato | Hook |
|---|-----|--------|-------|----------|---------|------|

## Comentários Extraídos (50 min)
### Quote #1
- **Texto:** ""
- **Username:** @
- **Likes/Replies:**
- **Contexto:** (vídeo/post de origem)
- **Intensidade:** /5

## Análise de Formato
- Formato dominante:
- Duração média:
- Hooks que funcionam:
- Estilo visual:
```

---

## Workflow

Etapa 1 - Discovery: receber plataforma + queries, executar web_search para URLs relevantes, filtrar por relevância e recência, limitar a 5 URLs por query para evitar overhead.

Etapa 2 - Extração: selecionar Apify actor correto para plataforma (ver ref_apify_actors_by_platform.md), configurar parâmetros otimizados com fields mínimos e limites seguros, executar com timeout apropriado.

Etapa 3 - Processamento: aplicar protocolo PROCESS-SAVE-FORGET (ver ref_protocol_process_save_forget.md). Processar em batches de 15 itens, truncar quotes em 400 chars, extrair apenas campos essenciais (texto, autor, data, url), salvar batch, limpar contexto antes do próximo. Se dataset excede 150 itens, aplicar sampling estratificado.

Etapa 4 - Salvamento: criar arquivo voc_[plataforma]_[query]_[data].md em /home/claude/, retornar path ao chamador.

## Formato de Saída

```markdown
# VOC Extraction: [Plataforma]
> Query: [query original]
> Data: [ISO date]
> Total quotes: [number]
> Fontes: [number] URLs

## Quotes Extraídos

### [URL 1]
- "[quote truncado em 400 chars]" - @autor
- "[quote 2]" - @autor

### [URL 2]
- "[quote 1]" - @autor

---
Extração completada via voc-research-agent
```

## Limites Operacionais

Batch size: 15 itens. Batches maiores sobrecarregam o contexto e causam perda de qualidade. Quote length: 400 chars. URLs por query: 5. Quotes totais: 150, acima disso aplicar sampling. Detalhes em ref_limits_and_safety.md.

## Execução Paralela

Queries independentes podem ser descobertas em paralelo via múltiplos web_search simultâneos. Se Apify actor suporta array de URLs, passar todas em uma única chamada. Para 1-2 queries usar sequencial, 3-5 queries usar paralelo, 6+ queries usar waves de 5.

## Referências

Core (consultar sempre): ref_apify_actors_by_platform.md, ref_protocol_process_save_forget.md, ref_limits_and_safety.md.

Por plataforma (carregar just-in-time quando extraindo): ref_platform_youtube.md, ref_platform_instagram.md, ref_platform_tiktok.md, ref_platform_reddit.md, ref_platform_amazon.md, ref_platform_br_reclameaqui.md, ref_platform_br_mercadolivre.md.

## Extended Thinking

Este skill executa principalmente operações técnicas. Extended thinking tem benefício limitado. Usar 2-4K tokens apenas para decisão de qual actor usar ou troubleshooting de erros. Para execução padrão de extração, processamento de batches e salvamento, thinking padrão é suficiente.

---

## Context Management (v6.1) ⚠️ NOVO

> Fonte: `~/.claude/rules/voc-research.md` v6.1

### Regra 60% para Extração

**CRÍTICO:** Manter contexto abaixo de 60% durante extrações longas.

| Threshold | Ação |
|-----------|------|
| <50% | Operação normal |
| 50-60% | Monitoring, considerar batch |
| 60-75% | Aplicar PROCESS-SAVE-FORGET imediatamente |
| >75% | EMERGÊNCIA - salvar e reiniciar |

### Lost in the Middle Mitigation

```
INÍCIO do contexto: Instruções VOC Protocol
FIM do contexto: Batch atual sendo processado
MEIO (descartável): Batches anteriores já salvos
```

### RAG Specs para Swipe Analysis

> Ver `~/.claude/templates/swipe-analysis-specs.md` para integração RAG.

| Spec | Valor |
|------|-------|
| Chunking | 400-600 tokens |
| Overlap | 15-20% |
| Formato | Markdown (5★ eficiência) |
| Embeddings (se futuro) | Voyage AI voyage-4 |

## Exemplos

### Exemplo 1: Extração YouTube

Input recebido:

```yaml
plataforma: youtube
queries: ["dor nas costas exercício", "hérnia de disco tratamento"]
limite_quotes: 100
```

Execução correta:

1. web_search "dor nas costas exercício site:youtube.com" para descobrir 8 vídeos, selecionar top 5
2. Apify streamers/youtube-scraper com startUrls das 5 URLs e maxResults 3 vídeos por URL
3. Dataset retorna 75 comentários
4. Batch 1 (items 1-15): extrair text/author/publishedAt, truncar 400 chars, salvar, limpar contexto
5. Batch 2 (items 16-30): extrair, salvar, limpar
6. Continuar até batch 5
7. Arquivo final: /home/claude/voc_youtube_dorCostas_2025-01-08.md
8. Retornar: "Extração concluída. Arquivo: [path]. Total: 75 quotes de 5 fontes."

Execução incorreta: maxResults 50 por URL causa dataset muito grande. Processar 200 comentários de uma vez causa overflow. Retornar comentários no chat em vez de arquivo. Classificar por intensidade emocional (não é responsabilidade deste skill).

### Exemplo 2: Protocolo com Dataset Grande

Cenário: dataset retornou 180 comentários, limite é 150.

Execução correta:
- Batches 1-10: processar items 1-150 normalmente (15 por batch), cada batch salvar e esquecer
- Sampling dos items 151-180: selecionar 15 representativos (30% por engajamento, 30% por recência, 40% aleatório)
- Total processado: 165 quotes
- Arquivo consolidado final

Execução incorreta: processar todos 180 de uma vez causa overflow. Ignorar items 151-180 perde dados potencialmente valiosos. Manter batches anteriores em memória causa acúmulo.

### Exemplo 3: Retorno ao Chamador

Correto: "Extração concluída. Arquivo salvo: /home/claude/voc_youtube_dorCostas_2025-01-08.md. Total: 127 quotes de 5 fontes. Pronto para análise pelo audience-research-agent."

Incorreto: despejar os 127 comentários no chat causa overflow garantido e não é o formato esperado.

## Constraints

- Batch size máximo: 15 itens (batches maiores sobrecarregam contexto)
- Quote length máximo: 400 chars (truncar se maior)
- URLs por query: 5 (evitar overhead)
- Quotes totais: 150 (aplicar sampling acima disso)
- NÃO fazer análise — responsabilidade é do chamador
- SEMPRE retornar path do arquivo, nunca despejar quotes no chat

## Integração planning-with-files

- **Antes:** Verificar se `task_plan.md` existe (opcional para skill técnica)
- **Durante:** Não aplicável (skill executa e retorna)
- **Após:** Registrar path do arquivo gerado em `findings.md` se existir
