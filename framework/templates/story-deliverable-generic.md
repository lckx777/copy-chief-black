---
template_name: "story-deliverable-generic"
template_version: "1.0.0"
template_type: "story"
description: "Story template generico para qualquer deliverable de copy"
phase: "production"
deliverable_type: "other"
output_format: "markdown"
---

# Story: [DELIVERABLE_TYPE] — [OFFER_NAME]

> Template: story-deliverable-generic.md v1.0
> Criado: [DATA]
> Oferta: [NICHO]/[OFERTA]
> Fase: [PRODUCTION/REVIEW]

---

## Status
- [ ] Story criada
- [ ] Producao iniciada
- [ ] Primeira versao completa
- [ ] blind_critic >= 8
- [ ] emotional_stress_test >= 8
- [ ] layered_review completa
- [ ] black_validation >= 8
- [ ] Humano aprovou

## Statement
**Como** [avatar primario],
**Quero** [o que o deliverable deve comunicar],
**Para que** [resultado emocional/acao desejada].

---

## Contexto HELIX (Injetar no Prompt de Producao)

### MUP
> Fonte: mecanismo-unico.yaml

- **Sexy Cause:** [nome intrigante da nova causa]
- **Problema Fundamental:** [como a nova causa se aplica tangivelmente]
- **Nova Causa (resumo):** [1-2 frases explicando o reframe]

### MUS
> Fonte: mecanismo-unico.yaml

- **Gimmick Name:** [nome chiclete do ingrediente]
- **Ingrediente Hero:** [componente principal que resolve]
- **Authority Hook:** [validacao via super estrutura]
- **Origin Story (resumo):** [1 frase da descoberta]

### DRE
> Fonte: research/voc/summary.md + briefings/phases/fase-03.md

- **Emocao Dominante Residente:** [MEDO/VERGONHA/FRUSTRACAO/RAIVA/CULPA]
- **Nivel de Escalada:** [1-5] — [descricao do nivel]
- **Quote Ancora (VOC):** "[a quote mais visceral que exemplifica a DRE]"

### One Belief
> Fonte: briefings/phases/fase-07.md

"[A crenca unica que, se o prospect aceitar, torna a compra inevitavel]"

### Promessa Central
> Fonte: CONTEXT.md

"[Promessa central da oferta — 1-2 frases]"

### Vilao + Solucoes Falsas
> Fonte: briefings/phases/fase-05.md

- **Vilao Principal:** [quem/o que externalizamos como causa]
- **Solucao Falsa #1:** [o que o mercado oferece e falha]
- **Solucao Falsa #2:** [segunda alternativa que falha]
- **Por que falham:** [1 frase conectando ao MUP]

---

## VOC Quotes (Relevantes para Este Deliverable)

### Dor/Problema (5-10 quotes)
1. "[quote]" — @username, [plataforma], intensidade [X/5]
2. "[quote]" — @username, [plataforma], intensidade [X/5]
3. "[quote]" — @username, [plataforma], intensidade [X/5]
4. "[quote]" — @username, [plataforma], intensidade [X/5]
5. "[quote]" — @username, [plataforma], intensidade [X/5]

### Desejo/Solucao (3-5 quotes)
1. "[quote]" — @username, [plataforma]
2. "[quote]" — @username, [plataforma]
3. "[quote]" — @username, [plataforma]

### Linguagem do Avatar (palavras-chave)
- [lista de palavras/expressoes que o avatar USA — extraidas da VOC]
- [termos tecnicos que o avatar ENTENDE vs termos que repele]
- [girias, abreviacoes, modo de falar especifico]

### Emocoes Categorizadas (relevantes para este deliverable)

| Emocao | Quote Representativa | Nivel Escalada | Fonte |
|--------|---------------------|----------------|-------|
| [MEDO] | "[quote]" | [1-5] | @user, plataforma |
| [VERGONHA] | "[quote]" | [1-5] | @user, plataforma |
| [FRUSTRACAO] | "[quote]" | [1-5] | @user, plataforma |

---

## Patterns Aplicaveis (de patterns-by-niche.yaml)

### Patterns de Sucesso
1. **[pattern_name]:** [injection text — como aplicar neste deliverable]
2. **[pattern_name]:** [injection text]
3. **[pattern_name]:** [injection text]

### Anti-Patterns a Evitar
1. **[anti_pattern]:** [avoidance text — por que evitar e o que fazer em vez]
2. **[anti_pattern]:** [avoidance text]
3. **[anti_pattern]:** [avoidance text]

### Cliches Proibidos (Nicho: [NICHO])
> Fonte: anti-homogeneization.md

| Proibido | Substituir Por |
|----------|---------------|
| [cliche 1] | [alternativa especifica da oferta] |
| [cliche 2] | [alternativa especifica da oferta] |
| [cliche 3] | [alternativa especifica da oferta] |

---

## Acceptance Criteria

### Obrigatorios (Cross-Deliverable)
- [ ] Especificidade Score >= 8 (Face 1: >=6/8, Face 2: >=3/5)
- [ ] Logo Test: FAIL (concorrente NAO pode usar sem alterar 20%+)
- [ ] Competitor Swap Test: FAIL (copy e claramente desta oferta)
- [ ] Zero palavras da lista de banidos (anti-homogeneization.md)
- [ ] Zero cliches do nicho
- [ ] DRE ativada e escalada (niveis 4-5 presentes)
- [ ] Mecanismo nomeado (proprietario — MUP e/ou MUS)
- [ ] Numeros especificos (nao-round): minimo 3
- [ ] Exemplos unicos da oferta: minimo 2
- [ ] Linguagem e da VOC (nao generica/marketer-speak)

### Por Tipo de Deliverable
[Criterios especificos — preencher conforme o tipo:
- VSL: retencao por capitulo, arco emocional completo
- LP: consistencia entre blocos, CTA 3x minimo
- Criativo: hook 0-3s, compliance da plataforma
- Email: subject <50 chars, progressao da sequencia]

---

## Tasks

### Pre-Producao
- [ ] Ler CONTEXT.md da oferta
- [ ] Ler synthesis.md (research)
- [ ] Ler mecanismo-unico.yaml (confirmar state VALIDATED/APPROVED)
- [ ] Carregar patterns-by-niche.yaml (nicho relevante)
- [ ] Carregar swipes relevantes (se aplicavel)
- [ ] Carregar fases HELIX necessarias (listar quais)
- [ ] Preencher TODAS as secoes desta story acima

### Producao
- [ ] [Tarefa 1 — descrever especificamente]
- [ ] [Tarefa 2]
- [ ] [Tarefa 3]
- [ ] ...

### Pos-Producao (MCP Enforcement)
- [ ] blind_critic (copy_type: "[tipo]") — score: ___
- [ ] emotional_stress_test (copy_type: "[tipo]") — score: ___
- [ ] layered_review (3 camadas) — resultado: ___
- [ ] black_validation — score: ___
- [ ] Humano revisou e aprovou

---

## Dev Notes (Contexto Arquitetural)

### Decisoes de Copy
[Registrar decisoes tomadas durante producao e POR QUE.
Exemplos:
- "Escolhi angulo de conspiricao porque ads-library-spy mostra 70% dos escalados usando esse angulo"
- "Usei DRE vergonha em vez de medo porque VOC mostrou 3x mais quotes de vergonha nivel 4-5"
- "Nao usei origin story no hook porque swipes TOP 3 do nicho comecam com problema direto"]

### Insights de Sessoes Anteriores
[Se esta story foi pausada e retomada, registrar aqui o que a sessao anterior descobriu.
Isso e o CORE do sistema Story-Driven — previne perda de contexto entre sessoes.]

### Versoes
| # | Data | Score BC | Score EST | Score BV | Mudanca Principal |
|---|------|----------|-----------|----------|-------------------|
| 1 | | | | | Primeira versao |
| 2 | | | | | [descrever mudanca] |
| 3 | | | | | [descrever mudanca] |

---

## QA Results

### blind_critic
- **Score:** ___/10
- **Copy Type:** [headline/lead/body/full]
- **Feedback (resumo):** [principais pontos levantados]
- **Acoes Tomadas:** [o que foi alterado com base no feedback]

### emotional_stress_test
- **Score:** ___/10
- **Genericidade:** ___/10
- **Copy Type:** [lead/body/full]
- **Feedback (resumo):** [principais pontos levantados]
- **Acoes Tomadas:** [o que foi alterado]

### layered_review
- **Camada 1 (Estrutura):** [resultado]
- **Camada 2 (Emocao):** [resultado]
- **Camada 3 (Especificidade):** [resultado]

### black_validation
- **Score:** ___/10
- **Gate:** [PASSED/FAILED]
- **Feedback (resumo):** [principais pontos]
- **Acoes Tomadas:** [se FAILED, o que foi corrigido]

---

## Rastreabilidade

| Campo | Valor |
|-------|-------|
| **Story criada por** | [humano/agente] |
| **Producao iniciada** | [data] |
| **Ultima atualizacao** | [data] |
| **Sessoes utilizadas** | [numero — incrementar a cada retomada] |
| **Arquivo de output** | production/[tipo]/[nome-arquivo] |
| **mecanismo-unico.yaml state** | [VALIDATED/APPROVED] |
| **helix-state.yaml gate** | [production gate status] |

---

*story-deliverable-generic.md v1.0 — Story-Driven Copy Production*
*Adaptado de AIOS Story-Driven Development para Copy Chief BLACK*
*Previne perda de contexto entre sessoes de producao*
