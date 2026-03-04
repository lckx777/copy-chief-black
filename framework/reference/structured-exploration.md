# Structured Exploration Protocol (v1.0)

> Fonte: AIOS Framework (Alan Nicolas) — Principio #24 (10.000+ sessoes)
> Adaptado: Copy Chief BLACK — Copywriting Direct Response
> Principio: 3 passadas com perspectivas diferentes antes de agir.
> Criado: 2026-02-26

---

## REGRA CARDINAL

> **Nunca comece a produzir sem explorar primeiro.**
> Exploracao estruturada em 3 passadas evita retrabalho, gaps e suposicoes falsas.
> Cada passada tem perspectiva, foco e output diferentes.

---

## PROTOCOLO DE 3 PASSADAS

### Visao Geral

| Pass | Perspectiva | Mentalidade | Pergunta Central |
|------|-------------|-------------|------------------|
| 1 | **Topologia** (Arquiteto) | "Como esta organizado?" | Qual e a estrutura? |
| 2 | **Contratos** (Revisor) | "Como as partes se conectam?" | Quais sao as dependencias? |
| 3 | **Fragilidades** (Adversarial) | "Onde pode quebrar?" | Quais sao os riscos? |

### Tempo por Passada

| Contexto | Pass 1 | Pass 2 | Pass 3 | Total |
|----------|--------|--------|--------|-------|
| Nova oferta | 5-10 min | 5-10 min | 5-10 min | 15-30 min |
| Codebase desconhecido | 10-15 min | 10-15 min | 5-10 min | 25-40 min |
| Analise de concorrente | 5 min | 5 min | 10 min | 20 min |
| Analise de swipe | 5 min | 5 min | 5 min | 15 min |

---

## PASS 1: TOPOLOGIA (Perspectiva do Arquiteto)

### Mentalidade

"Estou vendo pela primeira vez. Nao julgo, apenas MAPEIO."

### Acoes Obrigatorias

```
1. MAPEAR estrutura de diretorios
   → ls -la {oferta}/
   → ls -la {oferta}/research/
   → ls -la {oferta}/briefings/
   → ls -la {oferta}/production/

2. IDENTIFICAR 5 arquivos mais importantes
   → CONTEXT.md (fonte de verdade da oferta)
   → mecanismo-unico.yaml (estado do mecanismo)
   → helix-state.yaml (estado do workflow)
   → research/synthesis.md (inteligencia consolidada)
   → project_state.yaml (tracking)

3. MAPEAR fluxo de dados
   → De onde vem a informacao? (VOC → Briefing → Production)
   → Onde esta o estado? (helix-state.yaml, project_state.yaml)
   → O que ja foi produzido? (production/)

4. REGISTRAR volume
   → Quantos arquivos de research existem?
   → Quantas fases HELIX estao completas?
   → Quantos deliverables de production existem?
```

### Output do Pass 1

```markdown
## TOPOLOGIA: [Nome da Oferta]

### Estrutura
- research/: [X] arquivos ([tipos])
- briefings/: [X] fases de [10]
- production/: [X] deliverables ([tipos])
- swipes/: [X] referencias

### Arquivos-Chave
1. [arquivo] — [conteudo/proposito]
2. [arquivo] — [conteudo/proposito]
3. [arquivo] — [conteudo/proposito]
4. [arquivo] — [conteudo/proposito]
5. [arquivo] — [conteudo/proposito]

### Fluxo de Dados
[VOC] → [Synthesis] → [HELIX Phases] → [Production]
Estado atual: [fase]

### Volume
- Research: [completa/parcial/ausente]
- Briefing: [X/10 fases]
- Production: [X deliverables]
```

---

## PASS 2: CONTRATOS (Perspectiva do Revisor)

### Mentalidade

"Quais sao as INTERFACES entre componentes? O que depende de que?"

### Acoes Obrigatorias

```
1. LISTAR interfaces entre componentes
   → VOC ↔ Briefing: Quais dados da VOC alimentam quais fases?
   → Briefing ↔ Production: Quais fases sao pre-requisito para quais deliverables?
   → Mecanismo ↔ Tudo: MUP/MUS como eixo central

2. MAPEAR dependencias
   → Quais gates existem? (Research Gate, Briefing Gate, Production Gate)
   → Quais MCPs sao obrigatorios em cada fase?
   → Quais templates devem ser usados?

3. IDENTIFICAR inputs do usuario
   → O que precisa de aprovacao humana?
   → Onde o usuario ja deu input?
   → Onde falta input do usuario?

4. VERIFICAR consistencia
   → CONTEXT.md alinhado com helix-state.yaml?
   → mecanismo-unico.yaml alinhado com briefing?
   → project_state.yaml atualizado?
```

### Output do Pass 2

```markdown
## CONTRATOS: [Nome da Oferta]

### Interfaces
| De | Para | Dados que Fluem |
|----|------|-----------------|
| VOC | HELIX Fase 1-4 | Quotes, DRE, avatar |
| VOC | HELIX Fase 5-6 | Linguagem para MUP/MUS |
| HELIX | Production | Briefing completo |
| Mecanismo | Tudo | MUP, MUS, Indutor |

### Dependencias (Gates)
| Gate | Status | Bloqueante Para |
|------|--------|-----------------|
| Research | [PASSED/PENDING] | briefings/ |
| Briefing | [PASSED/PENDING] | production/ |
| Mecanismo | [STATE] | production/ |

### Inputs do Usuario
| Input | Status | Impacto |
|-------|--------|---------|
| [input] | [recebido/pendente] | [o que bloqueia] |

### Consistencia
- [ ] CONTEXT.md ↔ helix-state.yaml: [alinhado/desalinhado]
- [ ] mecanismo-unico.yaml ↔ briefing: [alinhado/desalinhado]
- [ ] project_state.yaml: [atualizado/desatualizado]
```

---

## PASS 3: FRAGILIDADES (Perspectiva Adversarial)

### Mentalidade

"Sou um adversario tentando fazer esta oferta FALHAR. Onde esta fraca?"

### Acoes Obrigatorias

```
1. IDENTIFICAR pontos de falha
   → Onde falta evidencia? (afirmacoes sem VOC)
   → Onde falta validacao? (copy sem blind_critic)
   → Onde ha inconsistencia? (MUP diz X, copy diz Y)

2. VERIFICAR gates faltantes
   → Research Gate foi rodado?
   → Ferramentas obrigatorias foram usadas?
   → Mecanismo esta VALIDATED?

3. TESTAR premissas
   → MUP e realmente diferente do mercado?
   → Avatar e baseado em VOC ou suposicao?
   → DRE esta confirmada ou assumida?

4. BUSCAR gaps de enforcement
   → Hooks estao ativos?
   → Templates foram seguidos?
   → Anti-homogeneizacao foi aplicada?
```

### Output do Pass 3

```markdown
## FRAGILIDADES: [Nome da Oferta]

### Pontos de Falha
| # | Fragilidade | Severidade | Mitigacao |
|---|-------------|------------|-----------|
| 1 | [descricao] | CRITICA/ALTA/MEDIA | [acao] |
| 2 | [descricao] | CRITICA/ALTA/MEDIA | [acao] |
| 3 | [descricao] | CRITICA/ALTA/MEDIA | [acao] |

### Gates Faltantes
| Gate | Esperado | Atual | Acao |
|------|----------|-------|------|
| [gate] | [status esperado] | [status real] | [correcao] |

### Premissas Nao Verificadas
| Premissa | Evidencia | Risco se Falsa |
|----------|-----------|----------------|
| [premissa] | [tem/nao tem] | [impacto] |

### Gaps de Enforcement
| Gap | Impacto | Fix |
|-----|---------|-----|
| [gap] | [o que pode acontecer] | [como resolver] |
```

---

## APLICACOES COPY-SPECIFIC

### 1. Nova Oferta (Onboarding)

| Pass | Foco Especifico |
|------|-----------------|
| 1 — Topologia | Estrutura de diretorios criada? CONTEXT.md existe? Nicho identificado? |
| 2 — Contratos | Biblioteca de nicho existe? Templates mapeados? Gates configurados? |
| 3 — Fragilidades | Avatar e hipotese ou VOC? Mecanismo e original? Nicho saturado? |

**Checklist Nova Oferta:**
- [ ] Pass 1: Estrutura mapeada
- [ ] Pass 2: Dependencias identificadas
- [ ] Pass 3: Riscos documentados
- [ ] CONTEXT.md criado/atualizado
- [ ] mecanismo-unico.yaml criado (state: UNDEFINED)
- [ ] helix-state.yaml criado
- [ ] Proximo passo definido

### 2. Analise de Concorrente

| Pass | Foco Especifico |
|------|-----------------|
| 1 — Topologia | Quais funis? Quais canais? Quais produtos? Volume de ads? |
| 2 — Contratos | Qual MUP? Qual MUS? Qual avatar? Qual DRE? |
| 3 — Fragilidades | Onde e fraco? Que gaps deixa? Que angulos ignora? Onde podemos diferenciar? |

**Output:** Mapa de oportunidades para diferenciacao.

### 3. Analise de Swipe (Copy de Referencia)

| Pass | Foco Especifico |
|------|-----------------|
| 1 — Topologia | Estrutura da copy: lead, problema, solucao, oferta, CTA. Proporcoes. |
| 2 — Contratos | Qual mecanismo? Qual DRE? Qual escalada emocional? Quais provas? |
| 3 — Fragilidades | Logo Test: esta generico? Especificidade: onde falta? Cliches: quais usa? |

**Output:** Elementos reutilizaveis (adaptados, nao copiados) + gaps a evitar.

### 4. Retomada de Oferta (Apos Pausa)

| Pass | Foco Especifico |
|------|-----------------|
| 1 — Topologia | O que existe? O que mudou desde ultima sessao? Volume atual. |
| 2 — Contratos | Onde parou? Quais gates passaram? O que esta pendente? |
| 3 — Fragilidades | O que pode ter ficado inconsistente? States desatualizados? |

**Checklist Retomada:**
- [ ] Pass 1: Estado atual mapeado
- [ ] Pass 2: Ponto de retomada identificado
- [ ] Pass 3: Inconsistencias corrigidas
- [ ] project_state.yaml verificado
- [ ] CONTEXT.md relido
- [ ] Proximo passo definido

### 5. Debug de Oferta (Algo Nao Funciona)

| Pass | Foco Especifico |
|------|-----------------|
| 1 — Topologia | Todos os arquivos esperados existem? Estrutura esta correta? |
| 2 — Contratos | Dados fluem corretamente? Gates foram passados na ordem? |
| 3 — Fragilidades | Qual gate falhou? Qual ferramenta nao foi usada? Qual threshold nao atingido? |

> Ref: debugging-hypothesis.md para protocolo de debug com 3 hipoteses.

---

## REGRAS DE EXECUCAO

### Regra 1: Todas as 3 Passadas Sao Obrigatorias

Nao pular nenhuma passada. Cada uma revela informacao que as outras nao capturam:
- Pass 1 sem Pass 3 = otimismo excessivo (nao ve riscos)
- Pass 3 sem Pass 1 = paranoia sem contexto (nao sabe o que existe)
- Pass 2 sem Pass 1 = contratos sem mapa (nao sabe a estrutura)

### Regra 2: Ordem Importa

Sempre 1 → 2 → 3. Nunca comecar por fragilidades sem antes mapear topologia e contratos.

### Regra 3: Output Antes de Acao

Completar os 3 outputs ANTES de propor qualquer acao. O output informa a proposta.

### Regra 4: Compartilhar Findings

Apresentar findings das 3 passadas ao usuario ANTES de propor plano de acao:

```
"Fiz a exploracao estruturada. Resumo:
- TOPOLOGIA: [estado geral]
- CONTRATOS: [dependencias criticas]
- FRAGILIDADES: [riscos identificados]

Com base nisso, proponho: [acao]"
```

> Ref: aios-principles.md #6 (Discovery Antes de Implementacao) e #7 (Opcoes Antes de Implementacao).

### Regra 5: Profundidade Proporcional ao Risco

| Risco | Profundidade da Exploracao |
|-------|---------------------------|
| Baixo (ajuste pontual) | Pass rapido (2 min cada) |
| Medio (novo deliverable) | Pass normal (5 min cada) |
| Alto (nova oferta, pivoting) | Pass profundo (10 min cada) |

---

## INTEGRACAO COM WORKFLOW

### Quando Rodar Exploracao Completa

| Situacao | 3 Passadas? | Justificativa |
|----------|-------------|---------------|
| Nova oferta | SIM | Mapeamento completo necessario |
| Retomada apos pausa | SIM | Estado pode ter mudado |
| Novo deliverable | RAPIDA (2 min cada) | Verificar pre-requisitos |
| Ajuste em copy existente | NAO | Contexto ja conhecido |
| Bug/erro pontual | NAO | Ir direto ao debug |

### Conexao com Outros Protocolos

| Protocolo | Como se Conecta |
|-----------|-----------------|
| aios-principles.md #6 | Discovery Antes de Implementacao = Pass 1 |
| aios-principles.md #24 | Este arquivo E o principio #24 expandido |
| debugging-hypothesis.md | Pass 3 alimenta hipoteses de debug |
| context-management.md | Pass 1 identifica o que e HOT/WARM/COLD |
| tool-usage-matrix.md | Pass 2 identifica ferramentas obrigatorias por fase |

---

*v1.0 — Adaptado de AIOS Framework (Alan Nicolas, Principio #24)*
*Contexto: Copy Chief BLACK — Copywriting Direct Response*
*5 aplicacoes copy-specific: Nova Oferta, Concorrente, Swipe, Retomada, Debug*
*Criado: 2026-02-26*
