# Copy Squad — Guia dos 12 Agentes

> Como usar a Copy Squad de 12 personas especializadas.

## Visao Geral

A Copy Squad e um time de 12 agentes de IA, cada um especialista em um aspecto do copywriting Direct Response. O Helix (@chief) orquestra automaticamente — voce nao precisa chamar os agentes diretamente.

## Personas

### Helix (@chief) — Orquestrador

O "maestro" que decide qual agente ativar para cada tarefa. Analisa o contexto da oferta, estado do pipeline, e roteia automaticamente.

**Aciona:** Todos os outros agentes
**Modelo:** opus

### Vox (@researcher) — Pesquisador

Pesquisa profunda de publico-alvo: VOC (Voice of Customer), avatar, dores, desejos, linguagem.

**Tarefas:** Pesquisa VOC, analise de avatar, mapeamento de mercado
**Fontes:** YouTube, Reddit, Amazon reviews, Reclame Aqui, TikTok
**Output:** `research/synthesis.md`, `research/avatar-profile.md`
**Modelo:** sonnet

### Cipher (@miner) — Minerador

Analisa concorrentes e ads. Calcula Scale Score. Extrai patterns.

**Tarefas:** Ads spy, analise de criativos, scale score, benchmark
**Fontes:** Meta Ad Library, TikTok Ad Library, swipe files
**Output:** `research/competitor-analysis.md`, `research/ads-library-spy.md`
**Modelo:** sonnet

### Atlas (@briefer) — Briefer

Cria o briefing HELIX System completo em 10 fases.

**Tarefas:** HELIX briefing, MUP/MUS definition, DRE mapping
**Output:** `briefings/phases/01-*.md` a `briefings/phases/10-*.md`
**Modelo:** opus

### Echo (@vsl) — VSL Writer

Escreve o script do VSL (Video Sales Letter).

**Tarefas:** Lead, corpo, closes, bumps, testimonials
**Output:** `production/vsl/chapter-*.md`
**Modelo:** opus

### Forge (@lp) — Landing Page

Cria a Landing Page em 14 blocos persuasivos.

**Tarefas:** Hero, problema, mecanismo, prova, CTA, FAQ, etc.
**Output:** `production/landing-page/block-*.md`
**Modelo:** sonnet

### Scout (@creative) — Criativos

Cria criativos para ads (Meta, YouTube, TikTok).

**Tarefas:** Hooks, scripts, UGC, storytelling, pattern interrupt
**Output:** `production/creatives/creative-*.md`
**Modelo:** opus

### Blade (@producer) — Produtor

Copy generica: emails, follow-up, upsell, abandono de carrinho.

**Tarefas:** Sequencias de email, copy generica
**Output:** `production/emails/email-*.md`
**Modelo:** sonnet

### Hawk (@critic) — Critico

Revisao e validacao de toda copy produzida.

**Tarefas:** Review, scoring, sugestoes de melhoria
**Ferramentas:** blind_critic, emotional_stress_test, layered_review
**Modelo:** sonnet

### Sentinel (@gatekeeper) — Gatekeeper

Controla quality gates e transicoes de fase.

**Tarefas:** Validar gate, aprovar/reprovar transicao
**Ferramentas:** validate_gate
**Modelo:** sonnet

### Ops (@ops) — Operacoes

Tarefas de infraestrutura: git, deploy, manutencao.

**Tarefas:** Git push, cleanup, health check, backups
**Exclusivo:** Unico agente com permissao para operacoes destrutivas
**Modelo:** sonnet

### Strategist (@strategist) — Estrategista

Estrategia de portfolio: pricing, funnels, market positioning.

**Tarefas:** Analise de portfolio, pricing strategy, funnel design
**Modelo:** opus

## Agent Chaining

Agentes podem delegar tarefas para outros agentes automaticamente:

```
Atlas (@briefer)
  → delega para Vox (@researcher) para VOC adicional
  → delega para Cipher (@miner) para ads spy

Echo (@vsl)
  → apos produzir, Hawk (@critic) revisa automaticamente
```

## Expert Clones (copy-squad/)

Alem dos 12 agentes, o framework inclui 28 "clones de especialistas" — DNA de copywriters reais:

- Stefan Georgi (VSL structure)
- Gary Halbert (direct mail psychology)
- Eugene Schwartz (awareness levels)
- E mais 25 especialistas

Os expert clones sao injetados como referencia na producao — os agentes consultam o DNA dos especialistas relevantes.
