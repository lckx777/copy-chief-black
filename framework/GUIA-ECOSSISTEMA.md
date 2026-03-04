# GUIA COMPLETO DO ECOSSISTEMA DE COPYWRITING v4.9

> Guia definitivo para máxima performance do ecossistema de Direct Response.
> **Arquitetura:** Niche-First (`{nicho}/{oferta}/`)

---

## ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Primeiros Passos](#2-primeiros-passos)
3. [Estrutura de Projetos](#3-estrutura-de-projetos)
4. [Comandos](#4-comandos)
5. [Skills](#5-skills)
6. [Subagents](#6-subagents)
7. [MCPs (Model Context Protocols)](#7-mcps)
8. [Workflows Completos](#8-workflows-completos)
9. [Quality Gates](#9-quality-gates)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. VISÃO GERAL

### O que é o Ecossistema?

Um sistema de produção de copy de Direct Response que automatiza e organiza todo o fluxo de trabalho:

```
PESQUISA → HELIX (Briefing) → PRODUÇÃO → REVIEW
```

### Componentes

| Componente | Quantidade | Função |
|------------|------------|--------|
| **Commands** | 8 | Orquestram workflows completos |
| **Skills** | 10 | Executam tarefas especializadas |
| **Subagents** | 4 | Trabalho paralelo em contextos isolados |
| **MCPs** | 4 | Ferramentas externas (Apify, Firecrawl, Playwright, Zen) |
| **Plugins** | 3 | Memória, planejamento, GitHub |

### Importante: Sistema Documentation-Driven

O ecossistema NÃO é automático. Ele funciona assim:
- Skills e commands são **documentos guia** que Claude lê e segue
- Quality gates **não bloqueiam** automaticamente — você precisa verificar
- MCPs precisam ser **invocados explicitamente**

---

## 2. PRIMEIROS PASSOS

### 2.1 Criar uma Nova Oferta

```
/create-offer [nicho] [oferta]
```

**Exemplo:**
```
/create-offer concursos nova-oferta
```

**Nichos disponíveis:** concursos, saude, relacionamento, riqueza

**O que acontece:**
1. Verifica se nicho existe (cria se necessário)
2. Cria estrutura de diretórios da oferta
3. Inicializa CLAUDE.md referenciando biblioteca do nicho
4. Projeto pronto para pesquisa

### 2.2 Estrutura Criada

```
~/copywriting-ecosystem/{nicho}/{oferta}/
├── CLAUDE.md              ← Índice da oferta (edite com contexto)
├── task_plan.md           ← Planejamento de fases
├── findings.md            ← Log de descobertas
├── progress.md            ← Histórico de sessões
├── research/
│   ├── voc/
│   ├── competitors/
│   ├── mechanism/
│   └── avatar/
├── briefings/
│   ├── phases/
│   ├── checkpoints/
│   └── validations/
└── production/
    ├── vsl/
    ├── landing-page/
    ├── creatives/
    └── emails/
```

### 2.3 Biblioteca de Nicho

Cada nicho tem um arquivo consolidado na raiz:
```
~/copywriting-ecosystem/{nicho}/biblioteca_nicho_{nicho}_CONSOLIDADA.md
```

**Contém:**
- VOC consolidada de todas ofertas do nicho (~3.000+ quotes)
- Avatar unificado com variações
- Linguagem e compliance do nicho
- Ângulos validados cross-oferta

**Uso:** Carregar biblioteca do nicho ANTES de pesquisa específica.

### 2.4 Atualizar CLAUDE.md da Oferta

Após criar, edite o CLAUDE.md com:
- Nome e tipo da oferta (VSL, TSL, Quiz)
- Ticket e expert
- Referência à biblioteca do nicho
- Links relevantes

---

## 3. ESTRUTURA DE PROJETOS

### 3.1 Arquitetura Niche-First (v4.9.8)

```
~/copywriting-ecosystem/
├── {nicho}/                                 ← NICHO (concursos, saude, etc)
│   ├── biblioteca_nicho_{nicho}_*.md        ← VOC compartilhada
│   ├── {oferta-1}/                          ← OFERTA
│   │   ├── CLAUDE.md
│   │   ├── research/
│   │   ├── briefings/
│   │   └── production/
│   └── {oferta-2}/
└── teste/                                   ← NICHO de testes
```

### 3.2 Fluxo de Dados Nicho → Oferta

```
1. BIBLIOTECA DO NICHO (leitura)
   └── biblioteca_nicho_concursos_CONSOLIDADA.md
       ├── VOC consolidada (~2.800 quotes)
       ├── Avatar unificado
       └── Ângulos validados

2. PESQUISA DA OFERTA (escrita)
   └── {oferta}/research/
       ├── Mecanismo específico (MUP/MUS)
       ├── Competitor específico
       └── Delta VOC (quotes novas)

3. PRODUÇÃO DA OFERTA (escrita)
   └── {oferta}/production/
       ├── VSL/LP específicos
       └── Criativos com ângulos do nicho
```

**Regra:** Biblioteca de nicho é READ-ONLY para ofertas.

### 3.3 Convenção de Diretórios

| Diretório | Conteúdo | Quando Carregar |
|-----------|----------|-----------------|
| `raw/` | Dados brutos extraídos | **NUNCA** (muito grande) |
| `processed/` | Dados processados | Quando precisar de detalhe |
| `summary.md` | Resumo (≤500 tokens) | **SEMPRE primeiro** |
| `synthesis.md` | Síntese geral (≤15K tokens) | Após summaries |

### 3.4 Regra de Ouro

```
SEMPRE: summary.md → processed/ → NUNCA raw/
```

### 3.5 Limites de Tokens

| Arquivo | Limite |
|---------|--------|
| summary.md | ≤500 tokens |
| synthesis.md | ≤15.000 tokens |
| helix-complete.md | ≤10.000 tokens |

---

## 4. COMANDOS

### 4.1 Lista Completa

| Comando | Função | Quando Usar |
|---------|--------|-------------|
| `/create-offer` | Cria estrutura de projeto | Início de nova oferta |
| `/helix-parallel` | Pesquisa em 4 frentes | Após criar oferta |
| `/squad-research` | Pesquisa paralela (mais rápida) | Se tiver tmux/claude-squad |
| `/produce-offer` | Produção de copy | Após briefing completo |
| `/review-all` | Validação multi-modelo | Antes de lançar |
| `/sync-project` | Sincroniza com Claude.ai | Para backup/colaboração |
| `/plan-execution` | Cria arquivos de planejamento | Projetos complexos |

---

### 4.2 `/helix-parallel [oferta]`

**O que faz:** Executa 4 pesquisas em paralelo (sequencial interno):
1. VOC (Voice of Customer)
2. Concorrentes
3. Mecanismo (MUP)
4. Avatar

**Pré-requisitos:** Projeto criado com `/create-offer`

**Output:**
```
research/
├── voc/summary.md
├── competitors/summary.md
├── mechanism/summary.md
├── avatar/summary.md
└── synthesis.md (≥70% confiança)
```

**Tempo:** 90-180 minutos

**Exemplo:**
```
/helix-parallel gabaritando-lei-seca
```

---

### 4.3 `/squad-research [oferta]`

**O que faz:** Pesquisa PARALELA real usando claude-squad + tmux

**Diferença do helix-parallel:**
- helix-parallel: sequencial interno (90-180min)
- squad-research: 4 sessões simultâneas (30-60min)

**Pré-requisitos:**
```bash
brew install tmux
brew install gh && gh auth login
brew install claude-squad
```

**Quando usar:**
- Deadline apertado
- Múltiplas ofertas simultâneas
- Aceita consumir 4×200k tokens

---

### 4.4 `/produce-offer [oferta]`

**O que faz:** Produz todos os entregáveis de copy:
- VSL (se aplicável)
- Landing Page (14 blocos)
- Criativos (múltiplos formatos)
- Emails (sequência)

**Pré-requisitos (Gates):**
1. ✅ synthesis.md existe com confiança ≥70%
2. ✅ MUP validado com verdict STAND
3. ✅ MUS validado com verdict STAND

**Roteamento por Tipo de Oferta:**

| Tipo | VSL | LP | Criativos | Emails |
|------|-----|-----|-----------|--------|
| **VSL** | ✅ Full | ✅ | ✅ | ✅ 5 emails |
| **TSL** | ❌ Pula | ✅ | ✅ | ⚠️ 3 emails |
| **Quiz** | ❌ Pula | ✅ + Quiz | ✅ | ✅ |

**Exemplo:**
```
/produce-offer gabaritando-lei-seca
```

---

### 4.5 `/review-all [oferta]`

**O que faz:** Validação completa em 4 etapas:
1. Internal Review (checklist 16 pontos)
2. Copy-Critic (4 fases adversariais)
3. Zen MCP (validação multi-modelo)
4. Consolidação final

**Output:**
```
production/reviews/
├── internal-review.md
├── copy-critic-verdicts.md
├── multi-model-validation.md
└── final-review.md
```

**Critérios de Aprovação:**
- Internal Review ≥12/16
- Copy-Critic: todos STAND
- Zen MCP: scores ≥5/10

---

## 5. SKILLS

Skills são **especialistas** que você invoca para tarefas específicas.

### 5.1 Como Invocar

```
/[nome-da-skill]
```

Ou mencione os **triggers** na conversa:
```
"preciso criar um briefing HELIX para essa oferta"
→ Claude carrega helix-system-agent
```

### 5.2 Skills de Produção

#### `helix-system-agent`
**Triggers:** helix, briefing, fases, criar briefing VSL, minerar concorrentes

**O que faz:** Briefing estratégico em 10 fases HELIX

**Fases:**
1. Identificação (oferta, nicho, ticket)
2. Deep Dive Copy (mineração de concorrentes)
3. Avatar & Psicologia
4. Níveis de Consciência
5. Problema, Vilão, MUP
6. Solução, MUS
7. Big Offer & Stack
8. Fechamento & Pitch
9. Leads & Ganchos
10. Progressão Emocional

**Output:**
```
briefings/phases/fase01_identificacao.md
briefings/phases/fase02_deep_dive.md
...
briefings/helix-complete.md
```

---

#### `criativos-agent`
**Triggers:** criar anúncio, fazer criativo, hooks para Meta/YouTube/TikTok

**O que faz:** Cria anúncios com frameworks profissionais

**Frameworks disponíveis:**
- **PRSA-DTC:** Problem → Result → Solution → Action
- **Big Ideas Curiosas:** Hooks baseados em curiosidade
- **RMBC:** Result → Mechanism → Belief → Close

**Regras:**
- Mínimo 3 variações por criativo
- Cada criativo tem rationale + quotes VOC
- FORMATO (visual) ≠ ÂNGULO (mensagem)

**Formatos:**
- UGC (User Generated Content)
- Talking Head
- POV (Point of View)
- Tela Dividida
- Motion Graphics

**Ângulos:**
- Nova Descoberta
- Erro Comum
- Paradoxo
- Burnout + Virada
- Confronto/Anti-X

---

#### `landing-page-agent`
**Triggers:** criar LP, landing page, copy de página de vendas

**O que faz:** Copy completa em 14 blocos persuasivos

**Blocos:**
1. Headline (3 variações)
2. Subheadline
3. Agitação (dor)
4. Testemunhos
5. Mecanismo (MUP)
6. Benefícios
7. Entregáveis
8. Bônus
9. Qualificação
10. Recapitulação
11. CTA
12. Biografia
13. FAQ
14. Fechamento

**Output:**
```
production/landing-page/blocks/bloco-01-headline.md
production/landing-page/lp-complete.md
production/landing-page/canva-mapping.md
```

---

#### `copy-critic`
**Triggers:** validar MUP, testar MUS, criticar One Belief, stress-test

**O que faz:** Validação adversarial em 5 fases

**Fases:**
1. **DECOMPOSE:** Extrai claims, assumptions, constraints
2. **VERIFY:** Verifica cada claim contra pesquisa
3. **CHALLENGE:** Steel-man arguments + stress-test
4. **SYNTHESIZE:** Verdict final + confidence
5. **ZEN MCP:** Validação multi-modelo (scores 1-10)

**Verdicts:**
- **STAND:** Aprovado (confiança ≥80%)
- **REVISE:** Precisa ajustes (lista específica)
- **ESCALATE:** Problemas graves

---

### 5.3 Skills de Pesquisa

#### `audience-research-agent`
**Triggers:** pesquisa de público, análise de avatar, extração VOC

**O que faz:** Orquestra toda a pesquisa de público

**Coordena:**
- VOC extraction
- Competitor analysis
- Mechanism research
- Avatar profiling

---

#### `voc-research-agent`
**Triggers:** extrair comentários, coletar VOC, buscar quotes YouTube/TikTok

**O que faz:** Extração técnica de VOC

**Prioridade de ferramentas (OBRIGATÓRIO):**
1. **Apify** (primeiro sempre)
2. **Playwright** (se Apify falha)
3. **Firecrawl** (se Playwright falha)
4. **WebSearch** (ÚLTIMO RECURSO)

**NUNCA pule direto para WebSearch sem tentar Apify primeiro.**

**Estratégia Viral-First:**
- YouTube: 10K+ views OU 500+ comments
- Instagram: 5K+ likes OU 200+ comments
- TikTok: 50K+ views OU 1K+ comments

**Plataformas suportadas:**
- YouTube, Instagram, TikTok
- Reddit, Reclame Aqui
- Amazon, Mercado Livre

---

### 5.4 Skills de Infraestrutura

#### `fragment-agent`
**Triggers:** fragmentar arquivo, dividir documento grande

**O que faz:** Otimiza arquivos grandes para RAG

**Regras:**
- 100-200 linhas por fragmento
- ~1.300-2.600 tokens por parte
- Naming: `{categoria}_{nicho}_{nome}_parte{N}_{secao}.md`

---

#### `ai-setup-architect`
**Triggers:** criar prompt, fazer agente, montar projeto Claude

**O que faz:** Arquiteta setups de IA customizados

---

## 6. SUBAGENTS

Subagents são **contextos isolados de 200K tokens** para trabalho paralelo.

### 6.1 Tipos Disponíveis

| Subagent | Ferramentas | Uso |
|----------|-------------|-----|
| `researcher` | Read, Write, WebSearch | VOC, concorrentes, mecanismo |
| `copywriter` | Read, Write | VSL, LP, criativos, emails |
| `reviewer` | Read, Write | QA, validações, quality gates |
| `synthesizer` | Read, Write, Grep | Merge de outputs paralelos |

### 6.2 Limitação Crítica: MCPs

**PROBLEMA:** Subagents customizados NÃO herdam MCPs.

**Isso significa:**
- `researcher` não acessa Apify, Firecrawl, Playwright
- Apenas declaração, não funcionamento real

**SOLUÇÃO:**
```
Use subagent_type: general-purpose ao invés de researcher
quando precisar de MCPs.
```

### 6.3 Quando Usar Cada Um

**researcher:**
- Análise de documentos existentes
- Síntese de informações
- Quando não precisa de MCPs

**copywriter:**
- Produção de copy
- Sempre funciona (só precisa Read/Write)

**reviewer:**
- Validação de copy
- Checklists e quality gates

**synthesizer:**
- APENAS após pesquisas paralelas completarem
- Merge de múltiplos outputs

### 6.4 Regra de Contexto

```
Cada subagent tem 200K tokens ISOLADOS.
Não compartilham contexto entre si.
```

**Implicação:**
- Passe todas as informações necessárias no prompt
- Não assuma que subagent sabe algo do contexto principal

---

## 7. MCPs (Model Context Protocols)

MCPs são **ferramentas externas** que Claude pode usar.

### 7.1 MCPs Disponíveis

| MCP | Função | API Key |
|-----|--------|---------|
| `apify` | Extração de dados (social, e-commerce) | APIFY_API_KEY |
| `firecrawl` | Web scraping avançado | FIRECRAWL_API_KEY |
| `playwright` | Automação de browser | (não precisa) |
| `zen` | Validação multi-modelo (Gemini) | GEMINI_API_KEY |

### 7.2 Apify - Extração de VOC

**Ferramentas principais:**
```
mcp__apify__search-actors      → Busca actors por plataforma
mcp__apify__fetch-actor-details → Detalhes e input schema
mcp__apify__call-actor         → Executa extração
mcp__apify__get-actor-output   → Recupera resultados
```

**Exemplo de uso:**
```
1. Buscar actor: "YouTube comments"
2. Ver input schema do actor
3. Executar com URL do vídeo
4. Recuperar comentários extraídos
```

**Plataformas com actors:**
- YouTube (comments, transcripts)
- Instagram (posts, comments, profiles)
- TikTok (comments, videos)
- Reddit (posts, comments)
- Amazon (reviews)
- Reclame Aqui (reclamações)

### 7.3 Firecrawl - Web Scraping

**Ferramentas principais:**
```
mcp__firecrawl__firecrawl_scrape  → Scrape de página única
mcp__firecrawl__firecrawl_search  → Busca web + scrape
mcp__firecrawl__firecrawl_extract → Extração estruturada
mcp__firecrawl__firecrawl_map     → Mapear URLs de site
```

**Quando usar:**
- Landing pages de concorrentes
- Páginas de review
- Conteúdo que Apify não cobre

### 7.4 Playwright - Browser Automation

**Ferramentas principais:**
```
mcp__playwright__browser_navigate → Navegar para URL
mcp__playwright__browser_snapshot → Captura acessível da página
mcp__playwright__browser_click    → Clicar em elementos
mcp__playwright__browser_type     → Digitar texto
```

**Quando usar:**
- Meta Ads Library (requer interação)
- Sites com login
- Conteúdo dinâmico (JavaScript)

### 7.5 Zen MCP - Validação Multi-Modelo

**Ferramentas principais:**
```
mcp__zen__chat        → Conversa com Gemini
mcp__zen__codereview  → Review de código/copy
mcp__zen__analyze     → Análise profunda
```

**Quando usar:**
- Fase 5 do copy-critic
- /review-all final
- Segunda opinião em decisões críticas

**Output esperado:**
```
| Dimensão | Score |
|----------|-------|
| Emotional Impact | 8/10 |
| Logical Coherence | 7/10 |
| Credibility | 6/10 |
| Média | 7.0/10 |
```

### 7.6 Ads Library Spy Protocol

Para mineração de anúncios no Meta Ads Library:

**Prioridade:**
1. `fb_ad_library MCP` (se disponível)
2. `Apify actors` (memo23/facebook-ads-library-scraper)
3. `Playwright` (navegação direta)

**Workflow:**
```
1. get_meta_platform_id("nome do concorrente")
   → Retorna page_id

2. get_meta_ads(page_id, country="BR")
   → Lista de anúncios ativos

3. analyze_ad_image(image_url)
   → Análise: hook, cores, composição
```

---

## 8. WORKFLOWS COMPLETOS

### 8.1 Workflow: Nova Oferta (VSL)

```
FASE 1: SETUP
└── /create-offer [cliente] [oferta]
└── Editar CLAUDE.md do projeto

FASE 2: PESQUISA (2-3 horas)
└── /helix-parallel [oferta]
    ├── VOC extraction (Apify)
    ├── Competitor mining
    ├── Mechanism research
    └── Avatar profiling
└── Verificar: synthesis.md ≥70%

FASE 3: BRIEFING HELIX (2-3 horas)
└── Invocar helix-system-agent
└── Completar 10 fases
└── Validar MUP/MUS com copy-critic
└── Verificar: todos STAND

FASE 4: PRODUÇÃO (3-4 horas)
└── /produce-offer [oferta]
    ├── VSL script
    ├── Landing Page (14 blocos)
    ├── Criativos (3+ variações)
    └── Email sequence (5 emails)

FASE 5: REVIEW (1-2 horas)
└── /review-all [oferta]
└── Corrigir issues encontrados
└── Verificar: final-review.md aprovado

FASE 6: ENTREGA
└── /sync-project [oferta]
└── Exportar para produção
```

### 8.2 Workflow: Oferta TSL (Sem VSL)

```
FASE 1-3: Igual VSL

FASE 4: PRODUÇÃO (adaptada)
└── /produce-offer [oferta]
    ├── ❌ VSL (pulado)
    ├── ✅ Landing Page (foco principal)
    ├── ✅ Criativos
    └── ⚠️ Emails (3 apenas)

FASE 5-6: Igual VSL
```

### 8.3 Workflow: Apenas Criativos

```
1. Verificar briefing existe
   └── Ler briefings/helix-complete.md

2. Invocar criativos-agent
   └── "preciso de criativos para [oferta]"

3. Especificar:
   └── Formatos desejados (UGC, Talking Head, etc)
   └── Ângulos a testar
   └── Quantidade de variações

4. Validar com copy-critic
   └── Cada criativo passa por 4 fases

5. Output em:
   └── production/creatives/
```

### 8.4 Workflow: Validação de Copy Existente

```
1. Ter copy pronta para validar

2. Invocar copy-critic
   └── "valida esse criativo/MUP/headline"

3. Processo automático:
   └── DECOMPOSE: extrai claims
   └── VERIFY: checa contra pesquisa
   └── CHALLENGE: stress-test
   └── SYNTHESIZE: verdict

4. Se REVISE:
   └── Aplicar correções listadas
   └── Revalidar

5. Se STAND:
   └── Opcional: Zen MCP para scores
```

---

## 9. QUALITY GATES

### 9.1 Gate 1: Pesquisa

| Critério | Requisito |
|----------|-----------|
| synthesis.md | Existe |
| Confiança | ≥70% |
| VOC quotes | ≥50 por plataforma |
| Triangulação | Quotes em múltiplas fontes |

### 9.2 Gate 2: Briefing

| Critério | Requisito |
|----------|-----------|
| Fases HELIX | 10/10 completas |
| MUP validation | STAND |
| MUS validation | STAND |
| One Belief | Documentado |

### 9.3 Gate 3: Produção

| Critério | Requisito |
|----------|-----------|
| Internal review | ≥12/16 pontos |
| Copy-critic | Todos STAND |
| Zen MCP | Scores ≥5/10 |

### 9.4 Checklist de Internal Review (16 pontos)

**Hook (6 pontos):**
- [ ] Abre com PARADOXO ou CURIOSIDADE
- [ ] Big Idea tem CONCEITO nomeável
- [ ] Linguagem literal do avatar
- [ ] Gatilho emocional claro
- [ ] Diferente dos concorrentes
- [ ] Testável em isolamento

**Body (5 pontos):**
- [ ] Progressão lógica clara
- [ ] MUP explicado visualmente
- [ ] Desvalidação de alternativas
- [ ] Paradigm shift presente
- [ ] VOC-literal em alta densidade

**Consistency (5 pontos):**
- [ ] Tom alinhado com style guide
- [ ] Claims verificáveis
- [ ] Sem contradições internas
- [ ] CTA orgânico
- [ ] Compliance ok

---

## 10. TROUBLESHOOTING

### 10.1 "Apify não está funcionando"

**Causa:** Subagent customizado não herda MCPs

**Solução:**
```
Use subagent_type: general-purpose
ao invés de researcher
```

### 10.2 "VOC extraction retorna blog content"

**Causa:** Pulou direto para WebSearch

**Solução:**
```
Sempre tente Apify primeiro.
Prioridade: Apify → Playwright → Firecrawl → WebSearch
```

### 10.3 "Criativos genéricos"

**Causa:** Não usou VOC literal

**Solução:**
```
1. Checar mineração/viral-content PRIMEIRO
2. Usar quotes LITERAIS (não parafrasear)
3. Validar com copy-critic antes de apresentar
```

### 10.4 "Briefing incompleto"

**Causa:** Pulou fases do HELIX

**Solução:**
```
Verificar checkpoints em briefings/checkpoints/
Cada fase gera um checkpoint YAML
```

### 10.5 "Copy rejeitada por tom"

**Causa:** Não seguiu style guide

**Solução:**
```
1. Ler production/style-guide.md
2. Aplicar regras de tom e linguagem
3. Evitar palavras proibidas
```

### 10.6 "Contexto estourando"

**Causa:** Carregou arquivos raw/

**Solução:**
```
NUNCA carregar raw/
Sempre: summary.md → processed/ → NUNCA raw/
Usar /compact a 60% de contexto
```

### 10.7 "Zen MCP não responde"

**Causa:** API key ou timeout

**Solução:**
```
1. Verificar GEMINI_API_KEY configurada
2. Tentar modelo menor (gemini-2.0-flash)
3. Se persistir, pular Zen e usar copy-critic apenas
```

---

## QUICK REFERENCE

### Comandos Mais Usados

```
/create-offer [nicho] [oferta]    → Criar oferta no nicho
/helix-parallel [oferta]          → Pesquisa completa
/produce-offer [oferta]           → Produzir tudo
/review-all [oferta]              → Validar tudo
```

### Skills Mais Usadas

```
helix-system-agent   → Briefing 10 fases
criativos-agent      → Criar anúncios
copy-critic          → Validar copy
landing-page-agent   → LP 14 blocos
```

### Prioridade de Ferramentas VOC

```
1. Apify (SEMPRE primeiro)
2. Playwright (se Apify falha)
3. Firecrawl (se Playwright falha)
4. WebSearch (ÚLTIMO RECURSO)
```

### Quality Gates Resumidos

```
Pesquisa:  synthesis.md ≥70%
Briefing:  MUP/MUS STAND
Produção:  Review ≥12/16 + STAND + Zen ≥5
```

---

*Guia v4.9 - Atualizado: 2026-01-21*
*Ecossistema de Copywriting de Direct Response*
*Arquitetura: Niche-First (`{nicho}/{oferta}/`)*
