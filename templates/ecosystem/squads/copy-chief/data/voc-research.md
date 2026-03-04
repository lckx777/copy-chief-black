---
phases: [RESEARCH]
priority: CRITICAL
tokens: ~2400
---

# VOC Research & Enforcement Rules (v7.0)

> Protocolos de pesquisa VOC, Ads Library Spy e enforcement de Research Gate.
> Consolidado de voc-research.md + research-enforcement.md.
> **v7.0:** Merged research-enforcement.md (deliverables, validation, anti-patterns)

---

## Erros Documentados

| ERR | Problema | Fix |
|-----|----------|-----|
| 001 | Usou MCP para discovery por keyword (MCP busca NOME, nao keyword) → conclusoes falsas | Apify para discovery (Niveis 1-3), MCP so Nivel 4. Checklist Anti-Alucinacao obrigatorio |
| 002 | 0/8 ferramentas MCP usadas = workflow bypassed | validate_gate obrigatorio antes de avancar fase |
| 003 | Pesquisa manual em vez de skill | audience-research-agent e UNICO entry point |

---

## Research Gate - Deliverables e Validacao

### REGRA CARDINAL

> **NUNCA** declarar Research "completa" sem:
> 1. Rodar `validate-gate.py RESEARCH`
> 2. Ter 4 summaries existindo
> 3. Ter synthesis.md com confidence >= 70%

### Checklist BLOQUEANTE

| # | Deliverable | Path | Bloqueante |
|---|-------------|------|------------|
| 1 | VOC Summary | `research/voc/summary.md` | SIM |
| 2 | VOC Trends | `research/voc/trends-analysis.md` | SIM |
| 3 | Competitors Summary | `research/competitors/summary.md` | SIM |
| 4 | Ads Library Spy | `research/competitors/processed/ads-library-spy.md` | SIM |
| 5 | Mechanism Summary | `research/mechanism/summary.md` | SIM |
| 6 | Avatar Summary | `research/avatar/summary.md` | SIM |
| 7 | **Synthesis** | `research/synthesis.md` | SIM |

### Validacao

`python3 ~/copywriting-ecosystem/scripts/validate-gate.py RESEARCH path/to/offer` (ou `validate-research.sh` para output visual, `--strict` para todos deliverables). SE BLOCKED -> corrigir antes de avancar.

### Anti-Patterns (PROIBIDO)

| Anti-Pattern | Por que e errado | Correto |
|--------------|------------------|---------|
| Declarar "Research completa" sem script | Pode estar incompleta | Rodar validate-gate.py |
| Usar MCP para discovery por keyword | MCP busca por NOME, nao keyword | Usar Apify |
| Pular template | Output inconsistente | Sempre carregar template |
| Nao carregar biblioteca de nicho | Falta contexto do nicho | Carregar ANTES de pesquisar |
| Fazer pesquisa manual sem skill | Workflow bypassed | Usar audience-research-agent |

### Checklist Pre-Avanco (OBRIGATORIO)

Antes de declarar Research completa:

- [ ] `validate-gate.py RESEARCH` retornou PASSED?
- [ ] 4 summaries existem? (voc, competitors, mechanism, avatar)
- [ ] synthesis.md existe com confidence >= 70%?
- [ ] Biblioteca de nicho foi carregada?
- [ ] Templates foram seguidos?
- [ ] MCP validate_gate foi chamado?

**SE qualquer checkbox NAO -> Research NAO esta completa.**

---

## Context Management para VOC

> Ref: context-management.md para regras gerais (Regra 60%, Lost in Middle, 3-Tier).

**Posicionamento para VOC:**
```
INICIO (zona primacy): Instrucoes core, VOC Protocol
FIM (zona recency): Quotes atuais, proxima extracao
MEIO (compressivel): Historico de sessao, metadata
```

**Limites para arquivos VOC:**
- `summary.md` <= 500 tokens (zona segura)
- `processed/*.md` <= 5.000 tokens cada
- `raw/*.md` NUNCA carregar em contexto (so referencia)

---

## Ads Library Spy Protocol - Discovery-First

### Metodologia Discovery-First
> Objetivo: DESCOBRIR quem está escalando, não apenas monitorar conhecidos.

---

### 🚨 LIMITAÇÕES CRÍTICAS DAS FERRAMENTAS (v6.4)

> **PROBLEMA DOCUMENTADO:** Confundir "busca por nome de página" com "busca por keyword de anúncio" causa conclusões falsas.

| Ferramenta | O que FAZ | O que NÃO FAZ |
|------------|-----------|---------------|
| `get_meta_platform_id` | Busca PÁGINAS pelo NOME | ❌ NÃO busca anúncios por keyword |
| `get_meta_ads` | Extrai ads de uma página específica | ❌ NÃO busca ads por keyword |
| Apify Ad Library Scraper | Busca ANÚNCIOS por keyword | ✅ Discovery-First real |

**REGRA:** Para Discovery-First (Níveis 1-3), usar **Apify** com busca por keyword.
O MCP fb_ad_library serve apenas para Nível 4 (monitorar concorrentes CONHECIDOS).

---

### Contexto de Execucao: Subagent (v7.5)

> Ref: tool-usage-matrix.md § Subagent Tool Access para tabela completa.

**REGRA:** Tasks de extracao VOC DEVEM usar `subagent_type: general-purpose`.
Custom types NAO herdam MCPs no runtime.

### Checklist Anti-Alucinacao (OBRIGATORIO)

Antes de tirar QUALQUER conclusão sobre "quem está/não está escalando":

- [ ] Usei busca por KEYWORD (Apify) ou busca por NOME (MCP)?
- [ ] Se usei MCP, reconheço que só encontrei páginas com esse NOME?
- [ ] Minha conclusão distingue "não tem página com esse nome" de "não está anunciando"?
- [ ] Verifiquei com Apify se há anunciantes usando essa KEYWORD?

**Se qualquer checkbox estiver desmarcado → NÃO tirar conclusão.**

---

### Apify Discovery Actor

`memo23/facebook-ads-library-scraper-cheerio` — Input: `searchTerms`, `countryCode`, `adType`.

### Scale Score (OBRIGATORIO)

**Formula:** `Scale Score = (ads_ativos x 2) + (variacoes_copy x 1.5)`
- 20+ = Altamente escalado | 10-19 = Escalando | 5-9 = Em teste | <5 = Novo/falhando

### Hierarquia de Busca (4 Niveis)

| Nivel | Objetivo | Ferramenta |
|-------|----------|------------|
| 1. Nicho | Descobrir players desconhecidos | Apify (keyword) |
| 2. Sub-nicho | Encontrar especialistas | Apify (keyword) |
| 3. Mecanismo | Validar cross-market | Apify (keyword) |
| 4. Concorrentes | Monitorar conhecidos | fb_ad_library MCP (nome) |

**REGRA ABSOLUTA:** Niveis 1-3 = Apify. Nivel 4 = MCP.

### Analise Obrigatoria de Videos (TOP 5)

Para cada criativo escalado registrar: Formato (visual), Angulo (mensagem), Hook 0-3s (transcricao exata), Duracao, Link Funil, Tipo Funil, Padroes Copy.

**FORMATO** = embalagem visual (o que VE). **ANGULO** = abordagem da mensagem (COMO a copy e passada).

### Keywords por Nicho

Keywords específicas por nível estão na biblioteca de cada nicho: `{nicho}/biblioteca_nicho_{nicho}_CONSOLIDADA.md`.

### Output Esperado

`research/competitors/processed/ads-library-spy.md` (template: `~/.claude/templates/ads-library-spy-template.md`).
Estrutura: Top 10 paginas (Scale Score), TOP 5 videos (formato+angulo+hook+funil), Padroes, Gaps, Recomendacoes.

---

## VOC Quality Protocol

### VOC Squad Architecture (AIOS S6)

> **Recomendado:** Usar VOC Squad (5 analistas paralelos) via audience-research-agent.
> **Ref:** `~/.claude/rules/voc-squad.md`
> **Prompts:** `~/.claude/templates/agent-prompts/voc-*.md`

O VOC Squad dispara 5 analistas especializados em paralelo:
1. **YouTube Analyst** — Comentários, timestamps, hooks
2. **Instagram Analyst** — Reels, carrosseis, stories
3. **TikTok Analyst** — Trends, stitches, linguagem Gen-Z
4. **Reddit Analyst** — Threads, AMAs, linguagem crua
5. **Amazon Analyst** — Reviews 1-2★ e 5★, Q&A

Consolidação: `~/.claude/templates/voc-squad-consolidation.md`

### Tool Priority (OBRIGATÓRIO)
Para extração de qualquer plataforma social:
1. **Apify Actor específico** (5min timeout) → Comentários REAIS
2. **Playwright direto** (se Apify falha) → Navegação direta
3. **Firecrawl search** (se Playwright falha) → Extração web
4. **WebSearch** (ÚLTIMO RESORT) → Apenas se TUDO falha

**NUNCA pular direto para WebSearch sem tentar Apify primeiro.**

### Viral-First Strategy
Antes de extrair comentários:
1. Identificar TOP 10 conteúdos mais engajados por plataforma
2. Validar engajamento mínimo:
   - YouTube: 10K+ views OU 500+ comments
   - Instagram: 5K+ likes OU 200+ comments
   - TikTok: 50K+ views OU 1K+ comments
3. Extrair APENAS de conteúdo viral
4. Registrar métricas junto com cada quote

### Outputs Obrigatorios

Cada extracao VOC deve gerar: (1) `*-viral-extraction.md` com quotes + virais, (2) Secao "Analise de Formato", (3) Metricas de engajamento, (4) `trends-analysis.md` cross-platform.

### trends-analysis.md v2.0 (OBRIGATORIO)

3 blocos: (1) FORMATO por plataforma (camera, cenario, edicao, duracao + exemplos), (2) ANGULO por plataforma (hooks, narrativa, tom + exemplos), (3) TENDENCIA DE CONSUMO (trends, padroes culturais, cross-platform, recomendacoes).

**Template:** `~/.claude/templates/trends-analysis-template.md`

### Rejeitar
- Blog content (não é VOC autêntico)
- Influencer content (viés de criador)
- Brand content (marketing, não voz real)

### Mínimos por Plataforma
- 50 quotes por plataforma social
- Triangulação obrigatória (quotes em múltiplas fontes = maior peso)
- Intensidade média ≥4/5
- Username + engagement em cada quote

---

## 🚨 EMOTION EXTRACTION (Alinhado Fundamentos v5)

> **REGRA:** Toda extração VOC DEVE categorizar emoções por tipo.
> Sem emoções categorizadas = research incompleta = BLOQUEADO.
> A DRE (Emoção Dominante Residente) da oferta é identificada AQUI na VOC.

### 5 Emoções Negativas Fundamentais (Fundamentos v5)

| Emoção | Descrição | Aplicação na Copy |
|--------|-----------|-------------------|
| **FRUSTRAÇÃO** | Tentou de tudo, nada funciona. Cria desesperança. | Validar frustração ANTES de apresentar solução. "Não funcionou. E a culpa NÃO é sua." |
| **ANSIEDADE** | Preocupação paralisante com o futuro. Medo de piorar. | Confirmar que a ansiedade é fundamentada — mas oferecer a saída específica. |
| **TRISTEZA PROFUNDA** | Sensação de derrota após várias tentativas falhas. | A revelação do mecanismo deve trazer ESPERANÇA após a tristeza. Ponto de virada. |
| **VERGONHA** | Falha pessoal, inadequação perante os outros. | Amplificador poderoso. Vergonha presente + esperança de eliminá-la = urgência máxima. |
| **MEDO/INSEGURANÇA** | Dúvidas sobre capacidades e como é percebido. | Medo precisa ser ESPECÍFICO, não abstrato. "Medo de engordar" é fraco. "Medo de que sua filha veja você com vergonha no casamento" é visceral. |

### Amplificadores

**VERGONHA** (problema PUBLICO) + **CULPA** (problema PESSOAL) + **ESPERANCA** (solucao URGENTE) = urgencia intensa.

### Identificando a DRE na VOC

A DRE não é sempre medo. Pode ser qualquer emoção dominante. A VOC revela qual:

| Possível DRE | Sinais na VOC | Exemplos de Nicho |
|--------------|---------------|-------------------|
| **Medo** | Quotes sobre perda, morte, doença | Saúde, sobrevivência |
| **Vergonha** | Quotes sobre olhar dos outros, inadequação | Aparência, intimidade, ED |
| **Desejo** | Quotes sobre inveja, querer o que outros têm | Riqueza, status |
| **Raiva/Indignação** | Quotes sobre ser enganado, injustiça | Ser enganado, big pharma |
| **Frustração** | Quotes sobre "já tentei tudo" | Cross-nicho |
| **Culpa** | Quotes sobre negligência, falhar com família | Relacionamento, saúde familiar |

### Estrutura Obrigatoria em summary.md

Secao "Emocoes Extraidas" com subsecoes por emocao (MEDO 10+, VERGONHA 5+, CULPA 5+, RAIVA 5+, FRUSTRACAO 10+). Cada quote com Intensidade (1-5) e Fonte (plataforma + username).

**Enforcement:** Sem secao "Emocoes Extraidas" ou menos de 35 quotes = Research Gate BLOCKED.

### Escalada Emocional na VOC (substitui Fear Hierarchy)

> Ref: copy-chief.md § Escalada Emocional para definicao canonica dos 5 niveis.

Para cada quote emocional, categorizar nivel de intensidade com exemplos de VOC. Aplica-se a QUALQUER DRE:

| Nível | Tipo | Horizonte | Ex (Medo) | Ex (Vergonha) | Ex (Frustração) |
|-------|------|-----------|-----------|---------------|-----------------|
| 1 | Físico Imediato | Horas/dias | "Peso no peito às 3h" | "Roupa não fecha" | "Mais uma dieta falhou" |
| 2 | Social | Dias/semanas | "Vão notar na reunião" | "Evita fotos em grupo" | "Amigos percebem" |
| 3 | Consequência | Meses/anos | "Diabético em 5 anos" | "Não sai mais de casa" | "Já perdeu 5 anos" |
| 4 | Relacional | Permanente | "Parceira vai encontrar outro" | "Filhos terão vergonha" | "Família desistiu" |
| 5 | Identidade | Existencial | "Morrer sendo lembrado como fracasso" | "Não se reconhece mais" | "Nunca vai conseguir nada" |

**Objetivo:** Identificar quotes de níveis 4 e 5 para copy visceral. Copy que fica nos níveis 1-2 cria desconforto passivo. Níveis 4-5 criam impulso de ação real.

---

*v7.0 - Merged research-enforcement.md (deliverables, validation, anti-patterns)*
*Ref: tool-usage-matrix.md para ferramentas por fase de Research*
*ERR-001/002/003 documentados*
*Atualizado: 2026-02-23*
