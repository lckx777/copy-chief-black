---
name: audience-research-agent
description: |
  Orquestrador de pesquisa profunda de público-alvo para copywriting de ofertas digitais.
  Ativa quando: pesquisa de público, análise de avatar, extração VOC, "quem é meu público",
  "dores do avatar", preparar briefing para HELIX, entender linguagem do público.
---

# Audience Research Agent

Copy Chief estratégico responsável por coordenar pesquisa de público em 4 fases, delegar extração técnica ao voc-research-agent, aplicar frameworks de análise psicográfica na Fase 3, e gerar VOC Library RAG-otimizada para outros agentes.

## Quick Start

1. Receber materiais da oferta (produto, avatar inicial, concorrentes)
2. Executar 4 fases: Análise → Extração VOC → Síntese Psicográfica → Output
3. Gerar VOC Library YAML com Score de Prontidão ≥70/100
→ Output: `voc_library_[nicho]_[data].yaml` pronto para HELIX/criativos

## Output Location

Write all outputs to:
- Raw VOC: `research/{offer-name}/voc/raw/` — Extração bruta por plataforma
- Processed: `research/{offer-name}/voc/processed/`
  - `pain-points.md` — Dores classificadas por intensidade
  - `desires.md` — Desejos declarados/implícitos/secretos
  - `objections.md` — Objeções mapeadas com counters
  - `language-patterns.md` — Expressões e hooks verbatim
- Summary: `research/{offer-name}/voc/summary.md` — MAX 500 tokens
- VOC Library: `research/{offer-name}/voc_library.yaml` — Arquivo completo

**CRITICAL:** Return only summary.md path to orchestrator. Never return raw content.

## Quando Usar

Ativar para pesquisa profunda de público-alvo além de personas superficiais, extração de dores viscerais e linguagem natural, briefing psicográfico para VSL/landing page/campanha, ou preparação de inputs para helix-system-agent ou criativos-agent.

## Workflow de 4 Fases

### Fase 1 - Análise de Inputs

**Objetivo:** Coletar e processar materiais existentes ANTES de iniciar pesquisa. Estabelecer baseline que guia a Fase 2.

**Prompt de Intake (usar ao iniciar):**

```markdown
## FASE 1: COLETA DE INPUTS

Antes de iniciar a pesquisa VOC, preciso de contexto sobre a oferta.

### Materiais Existentes (se houver)
- VSL/TSL atual? (link ou arquivo)
- Landing page? (link)
- Criativos rodando? (prints, links, ou arquivo consolidado)
- Materiais de referência/mineração?

### Informações do Produto
- Nome da oferta:
- Tipo (VSL/TSL/SaaS/Curso/Ebook):
- Faixa de preço:
- Expert/fundador (se houver):
- Promessa central (1 frase):

### Contexto de Mercado
- Concorrentes conhecidos:
- O que já funciona/não funciona (se souber):
- Nicho/sub-nicho específico:

[Após receber inputs, gerar research/fase-01-inputs.md]
```

**Execução:**

1. Apresentar prompt de intake ao usuário
2. Catalogar todos os materiais recebidos
3. Extrair claims, hooks, linguagem existente
4. Classificar Awareness Level (Schwartz 5 níveis)
5. Pontuar Market Sophistication (1-5)
6. Identificar gaps e hipóteses para validar
7. Priorizar plataformas para Fase 2
8. Gerar `research/fase-01-inputs.md`

**Template:** `~/.claude/skills/audience-research-agent/templates/fase-01-inputs-template.md`

**Critério de Saída:**

| Checklist | Obrigatório |
|-----------|-------------|
| Awareness Level classificado | ✅ |
| Market Sophistication pontuado | ✅ |
| Gaps identificados (mínimo 3) | ✅ |
| Hipóteses para validar (mínimo 3) | ✅ |
| Plataformas priorizadas | ✅ |
| Arquivo fase-01-inputs.md gerado | ✅ |

**Só avançar para Fase 2 após todos os critérios atendidos.**

### Fase 2 - Pesquisa VOC Modular

Executar 6 subfases: Panorama, YouTube, Instagram, TikTok, BR Sources, Consolidação. Delegar extração técnica ao voc-research-agent. Organizar quotes verbatim por categoria (DORES/DESEJOS/OBJECOES/LINGUAGEM). Fase 2 apenas COLETA. Frameworks são aplicados na Fase 3.

#### VOC Squad Dispatch (AIOS S6 — Recomendado)

> **Paralelização:** Disparar 5 analistas especializados em paralelo para maximizar cobertura.
> **Ref:** `~/.claude/rules/voc-squad.md`

**Execução Paralela:**

```typescript
// Disparar 5 analistas em paralelo via Task tool
const vocSquadResults = await Promise.all([
  Task({ prompt: YouTubeAnalystPrompt, subagent_type: "general-purpose", model: "sonnet" }),
  Task({ prompt: InstagramAnalystPrompt, subagent_type: "general-purpose", model: "sonnet" }),
  Task({ prompt: TikTokAnalystPrompt, subagent_type: "general-purpose", model: "sonnet" }),
  Task({ prompt: RedditAnalystPrompt, subagent_type: "general-purpose", model: "sonnet" }),
  Task({ prompt: AmazonAnalystPrompt, subagent_type: "general-purpose", model: "haiku" })
]);

// Consolidar resultados
// Ref: ~/.claude/templates/voc-squad-consolidation.md
```

**Prompts dos Analistas:**
- `~/.claude/templates/agent-prompts/voc-youtube-analyst.md`
- `~/.claude/templates/agent-prompts/voc-instagram-analyst.md`
- `~/.claude/templates/agent-prompts/voc-tiktok-analyst.md`
- `~/.claude/templates/agent-prompts/voc-reddit-analyst.md`
- `~/.claude/templates/agent-prompts/voc-review-analyst.md`

**Consolidação:** Usar template `~/.claude/templates/voc-squad-consolidation.md` para merge de-duplicado e triangulação cross-platform.

#### Fase 2.5 - Competitor Funnel Reverse-Engineering

**Quando executar:** Durante a Fase 2 (Pesquisa), depois de identificar os concorrentes escalando (Ads Library Spy), antes de consolidar.

**Objetivo:** Mapear automaticamente a estrutura de funil, copy, CTAs, preços e mecanismo dos TOP concorrentes para identificar gaps e oportunidades.

**Ferramenta:** `~/.claude/scripts/funnel-reverse.ts`

**Execução por concorrente (TOP 3 do Ads Library Spy):**

```bash
bun run ~/.claude/scripts/funnel-reverse.ts \
  --url <URL_ENTRADA_FUNIL_CONCORRENTE> \
  --offer <nicho>/<oferta>
```

**O script produz automaticamente:**
- `research/competitors/processed/funnel-prd-{nome}.md` — Relatório estruturado com:
  - Funnel Map visual (sequência de steps)
  - Detalhamento por step (headline, CTA, preço, formulário, prova social)
  - Classificação do tipo de funil (VSL, quiz, advertorial, etc.)
  - Detecção de timer/urgência e prova social
  - Seção de mecanismo identificado (MUP/MUS/Gimmick Name — preenchimento manual)
  - Gaps e oportunidades (preenchimento manual ou via Claude)

**Para análise sem fazer requests reais (dry-run):**

```bash
bun run ~/.claude/scripts/funnel-reverse.ts \
  --url <URL> \
  --offer <nicho>/<oferta> \
  --dry-run
```

**Integração com o fluxo:**

1. Após Ads Library Spy identificar TOP concorrentes escalando → Executar funnel-reverse nos TOP 3
2. Os relatórios `funnel-prd-*.md` ficam em `research/competitors/processed/`
3. Na Fase 3 (Síntese), usar os relatórios para informar posicionamento e mecanismo
4. Incluir gaps identificados no `synthesis.md` na seção de concorrentes

**Critério de conclusão:**
- [ ] funnel-prd-{concorrente1}.md gerado
- [ ] funnel-prd-{concorrente2}.md gerado (se aplicável)
- [ ] funnel-prd-{concorrente3}.md gerado (se aplicável)
- [ ] Seções de Gaps e Recomendações preenchidas (manual ou via Claude)

### Fase 3 - Síntese Psicográfica

Aplicar 7 frameworks de copywriting: Stefan Georgi (22 perguntas RMBC), Evaldo Albuquerque (One Belief), Clayton Makepeace (Big Idea + 16 emoções + Hierarquia 4 níveis), Diogo Ramalho (7 Puzzle Pieces), Eugene Schwartz (5 Awareness + Market Sophistication).

Aplicar 5 frameworks psicográficos: JTBD (4 forças), Tony Robbins (6 Human Needs), Kahneman (Sistema 1/2), Empathy Map (6 quadrantes), Modelo Decisão B2C (5 etapas).

Classificar por intensidade, frequência, acionabilidade.

### Fase 4 - Output RAG-Otimizado

Gerar VOC Library em formato YAML estruturado. Calcular Score de Prontidão (5 dimensões, mínimo 70/100). Entregar arquivos prontos para upload em Projects.

## Constraints

Frameworks são aplicados apenas na Fase 3, não na Fase 2. Cada quote mantém verbatim original do público. Score mínimo 70/100 para considerar pesquisa completa. Máximo 400 chars por quote para otimização de contexto. Delegar toda extração Apify ao voc-research-agent. Processar comentários em batches de 15 para evitar overflow.

## Formato de Output

Arquivo: `voc_library_[nicho]_[data].yaml`

```yaml
metadata:
  nicho: string
  data_geracao: ISO date
  score_prontidao: number
  plataformas_cobertas: list

dores:
  - quote: "texto verbatim"
    fonte: plataforma
    intensidade: 1-5
    frequencia: alta|media|baixa
    hierarquia_makepeace: nivel_1|nivel_2|nivel_3|nivel_4
    gatilho_reptiliano: string
    uso_sugerido: headline|lead|body|close

desejos:
  - quote: "texto verbatim"
    fonte: plataforma
    tipo: explicito|implicito|secreto
    need_robbins: certainty|variety|significance|connection|growth|contribution
    uso_sugerido: string

objecoes:
  - quote: "texto verbatim"
    fonte: plataforma
    tipo: preco|tempo|credibilidade|adequacao|urgencia
    frequencia: alta|media|baixa
    refutacao_sugerida: string

linguagem:
  hooks_validados: list[string]
  expressoes_frequentes: list[string]
  items:
    - expressao: "texto"
      contexto: string
      frequencia: number
      uso_sugerido: string
```

## Inputs Aceitos

Briefing de produto/oferta, Avatar/persona inicial, URLs de concorrentes, Materiais existentes (VSLs, páginas, criativos), Nicho específico para pesquisa.

## Execução Paralela

Quando múltiplas URLs são descobertas, execute extrações em paralelo via voc-research-agent. Para 1-2 URLs usar sequencial (overhead não compensa), 3-5 URLs usar paralelo, 6+ URLs usar paralelo em batches de 5. Consolidação pós-paralelo: aguardar todos retornos, unificar em arquivo temporário, remover duplicatas, prosseguir para próximo módulo.

## CRITICAL: Subagent Type para Extração

> **SEMPRE usar `subagent_type: general-purpose`** para tasks que precisam de Apify/Firecrawl/Playwright.
> **NUNCA usar `subagent_type: researcher`** — NÃO tem acesso a MCPs no runtime.
>
> Custom subagent types (`researcher`, `copywriter`, `reviewer`) recebem apenas Read, Write, WebSearch.
> O tipo `general-purpose` recebe TODOS os tools incluindo ToolSearch, que é necessário para
> carregar deferred tools como Apify. Sem ToolSearch = sem Apify = fallback para WebSearch = VOC de baixa qualidade.
>
> **Root Cause (2026-02-20):** 8/8 subagents researcher caíram para WebSearch, produzindo ~1.600 quotes
> de blogs indexados vs ~84 quotes reais via Apify no main agent. Agent definitions em `~/.claude/agents/`
> são PROMPT TEMPLATES, não configuração de runtime.

### Exemplo Correto de Delegação

```
Task(
  subagent_type="general-purpose",
  prompt="Extrair VOC do YouTube para [oferta].
         Use ToolSearch para carregar Apify tools.
         Prioridade: Apify > Playwright > Firecrawl > WebSearch (ultimo resort).
         [resto do prompt com instruções do researcher.md]"
)
```

## Composição com Outros Agentes

### Agentes que Este Skill Chama

voc-research-agent: Fase 2 (todos os módulos) para extração técnica via Apify. **DEVE ser invocado como `general-purpose`.**

### Agentes que Consomem Output

helix-system-agent: Recebe VOC Library completa para Fases 3-6. Espera dores classificadas por hierarquia_makepeace, desejos classificados por need_robbins, objecoes com refutacao_sugerida, score_prontidao >= 70.

criativos-agent: Usa linguagem e hooks para anúncios. Espera linguagem.hooks_validados (mínimo 10), linguagem.expressoes_frequentes (mínimo 20), dores.headline_ready (quotes alto impacto).

### Fluxo de Composição

```
[Usuario] -> audience-research-agent
                   |
             [Fase 1: Analise]
                   |
             [Fase 2: Extracao] -> voc-research-agent (multiplas chamadas)
                   |
             [Fase 3: Sintese]
                   |
             [Fase 4: Output]
                   |
        +----------+----------+
        |                     |
helix-system-agent     criativos-agent
   (Fases 3-6)          (Anuncios)
```

## References (Progressive Disclosure)

### Nivel 1 - Core (Carregar ao iniciar)

Carregar sempre ao iniciar execução:

- `ref_frameworks_georgi_evaldo_makepeace_ramalho_schwartz.md` - Metodologias copywriting
- `ref_frameworks_jtbd_robbins_kahneman_empathy.md` - Frameworks psicográficos
- `ref_voc_database_schema.md` - Schema YAML completo
- `ref_readiness_score_5_dimensions.md` - Sistema pontuação
- `ref_gatilhos_reptilianos_10.md` - 10 gatilhos

### Nivel 2 - On-Demand (Carregar por plataforma)

Carregar just-in-time antes de cada módulo de extração:

- `ref_platform_youtube.md` - quando extraindo do YouTube
- `ref_platform_instagram.md` - quando extraindo do Instagram
- `ref_platform_tiktok.md` - quando extraindo do TikTok
- `ref_platform_reddit.md` - quando extraindo do Reddit
- `ref_platform_reclameaqui.md` - quando extraindo do Reclame Aqui
- `ref_platform_mercadolivre.md` - quando extraindo do ML
- `ref_platform_amazon.md` - quando extraindo da Amazon

### Nivel 3 - Pedagogico (Sob demanda do usuario)

Carregar apenas se usuário solicitar fundamentação teórica ("explique a teoria", "quero entender o framework"):

- `aula_01_principios_fundamentais.md`
- `aula_02_psicologia_engenheiro.md`
- `aula_04_puzzle_pieces.md`
- `aula_geral_comunicacao_pedreiro_*.md` (5 arquivos)

## Score de Prontidao

5 dimensões com pesos: Cobertura fontes (20), Profundidade dores (25), Clareza desejos (20), Mapeamento objeções (20), Qualidade linguagem (15). Total: 100 pontos.

Interpretação: 0-49 indica pesquisa insuficiente, voltar Fase 2. 50-69 permite avanço com ressalvas documentadas. 70+ significa pronto para próximo agente.

## Extended Thinking

Fase 1: 4K-8K tokens para análise de materiais e priorização.

Fase 2: 2K-4K por módulo, principalmente execução de ferramentas.

Fase 3: 16K-32K tokens recomendado. Esta fase aplica 12 frameworks simultaneamente (7 copywriting + 5 psicográficos) aos dados coletados. Extended thinking beneficia significativamente a qualidade da síntese.

Fase 4: 8K-16K tokens para cálculo de Score e estruturação YAML.

Para solicitar: "Execute Fase 3 com extended thinking máximo" ou "A Fase 3 se beneficiaria de extended thinking. Deseja budget adicional antes de prosseguir?"

## Exemplos

### Exemplo 1: Fase 2 - Organização de Quotes

Evite aplicar frameworks prematuramente:

```yaml
dores:
  - quote: "nao aguento mais essa barriga"
    hierarquia_makepeace: nivel_2  # frameworks sao aplicados na Fase 3
    gatilho: seguranca  # nao classificar aqui
```

Prefira apenas organizar verbatim:

```yaml
dores_brutas:
  - quote: "nao aguento mais essa barriga"
    fonte: youtube_comentario
    url: https://youtube.com/watch?v=xxx
    data_extracao: 2025-01-08
```

### Exemplo 2: Delegação ao voc-research-agent

Evite executar Apify diretamente:

```
Vou usar o actor apify/youtube-scraper para extrair comentarios...
```

Prefira delegar ao agente especializado:

```
Delegando extracao do YouTube ao voc-research-agent com parametros:
- Plataforma: YouTube
- Queries: ["dor nas costas depoimento", "tratamento coluna resultado"]
- Limite: 5 videos, 150 comentarios total
```

### Exemplo 3: Score de Prontidao Detalhado

Evite avaliação superficial:

```
Score: 75/100 - Pesquisa adequada.
```

Prefira avaliação detalhada por dimensão:

```yaml
score_prontidao:
  total: 75/100
  dimensoes:
    cobertura_fontes: 16/20  # 4 plataformas de 5 recomendadas
    profundidade_dores: 20/25  # Hierarquia completa, falta nivel 4
    clareza_desejos: 18/20  # Explicitos e implicitos mapeados
    mapeamento_objecoes: 12/20  # Apenas 3 tipos identificados
    qualidade_linguagem: 9/15  # Precisa mais expressoes naturais
  gaps_identificados:
    - Falta cobertura Reclame Aqui
    - Objecoes de urgencia nao mapeadas
    - Poucas expressoes coloquiais capturadas
  recomendacao: "Expandir extracao em Reclame Aqui e TikTok para linguagem"
```

### Exemplo 4: Output para Composicao

Evite output genérico:

```
Aqui esta a pesquisa de publico. Use como preferir.
```

Prefira output estruturado para composição:

```markdown
## VOC Library Pronta para Integracao

**Para helix-system-agent (Fases 3-6):**
- Arquivo: voc_library_emagrecimento_2025-01-08.yaml
- Dores priorizadas por Hierarquia Makepeace
- Desejos classificados por 6 Human Needs

**Para criativos-agent:**
- Secao linguagem.hooks_validados com 15 expressoes testadas
- Secao dores.headline_ready com quotes de alto impacto

**Upload sugerido:** Adicionar ao Project "Campanha Emagrecimento Q1"
```

## Troubleshooting

Tool result too large: reduzir limit para 10 no voc-research-agent.

Context overflow: salvar parciais em arquivo antes de continuar.

Dataset vazio: verificar `Apify:get-actor-log` para diagnóstico.

Score baixo: expandir pesquisa nas dimensões com gaps identificados.

## Integração planning-with-files

- **Antes:** Verificar se `task_plan.md` existe no diretório de trabalho
- **Durante:** Atualizar `findings.md` a cada descoberta relevante (dores viscerais, linguagem marcante, insights)
- **Após:** Marcar fase como ✓ em `task_plan.md` ao concluir cada etapa

---

## Tool Enforcement v6.9

> **Referência:** `~/.claude/rules/tool-usage-matrix.md`

### Ferramentas OBRIGATÓRIAS para Research

| Ferramenta | Quando | Enforcement |
|------------|--------|-------------|
| `firecrawl_agent` | Coleta autônoma de dados | ✅ Preferencial |
| `voc_search` | Validar hipóteses com VOC | ✅ Obrigatório |
| `fb_ad_library.*` | Descobrir concorrentes | ✅ Para Ads Library Spy |
| `validate_gate` | Antes de declarar Research completa | ✅ **BLOQUEANTE** |

### Checklist de Entrega Research

Antes de declarar Research completa, verificar:

- [ ] `voc_search` usado para validar hipóteses?
- [ ] `fb_ad_library` usado para ads-library-spy.md?
- [ ] 4 summaries existem? (voc, competitors, mechanism, avatar)
- [ ] synthesis.md existe com confidence ≥70%?
- [ ] `validate_gate` PASSOU?

**Se qualquer item = NÃO → Research NÃO está completa.**
