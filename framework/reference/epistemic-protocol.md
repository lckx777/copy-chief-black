# Epistemic Protocol (v1.0)

> Fonte: mega-brain Epistemic Protocol — Adaptado para Copy Chief BLACK
> Principio: Toda afirmacao tem tipo (FATO vs RECOMENDACAO) e confianca declarada.
> Aplica-se: TODAS as afirmacoes em briefings/ e production/
> Criado: 2026-03-01 (Sprint S42)

---

## REGRA CARDINAL

> **"Nao afirmar como fato o que e inferencia. Nao afirmar sem fonte."**
> FATO sem fonte = alucinacao operacional.
> RECOMENDACAO sem confianca = conselho cego.

---

## Tipos de Afirmacao

| Tipo | Definicao | Marcador | Quando Usar |
|------|-----------|----------|-------------|
| **FATO** | Verificavel em fonte externa | `[FATO]` | VOC quote, estudo citado, dado mensuravel |
| **RECOMENDACAO** | Inferencia ou julgamento profissional | `[REC]` | Angulo de copy, MUP candidato, estrategia |

### Exemplos

```
[FATO] Avatar usa "ja tentei de tudo" — VOC YouTube, 847 likes.
[FATO] CoQ10 melhora funcao mitocondrial — Journal Neuroscience 2024.

[REC] MUP "Cristais de Otolitos" tem maior potencial de paradigm shift.
[REC] Abertura com DRE Nivel 4 (relacional) antes de revelar mecanismo.
```

**Misturar sem marcador = PROIBIDO.** Copy que afirma "estudos mostram" sem citar = [FATO] sem fonte = REFAZER.

---

## 4 Niveis de Confianca

| Nivel | Criterio | Declaracao |
|-------|----------|------------|
| **ALTA** | 3+ fontes independentes ou MCP validado | `[CONFIANCA: ALTA]` |
| **MEDIA** | 1-2 fontes ou 1 validacao MCP | `[CONFIANCA: MEDIA]` |
| **BAIXA** | Inferencia logica sem fonte direta | `[CONFIANCA: BAIXA]` |
| **NAO SEI** | Sem dados disponíveis | `[CONFIANCA: NAO SEI]` |

### Regras por Nivel

**ALTA** → afirmar diretamente na copy.
**MEDIA** → afirmar com qualificador leve ("dados sugerem", "evidencia aponta").
**BAIXA** → apresentar como hipotese. Nunca como fato na copy final.
**NAO SEI** → nao incluir na copy. Pesquisar ou excluir.

---

## Formato de Citacao de Fonte

```
[FONTE: {path}:{line}]
[FONTE: research/voc/summary.md:47]
[FONTE: research/mechanism/summary.md:112]
[FONTE: briefings/phases/fase05-problema-vilao-mup.md:23]
```

Para fontes externas (estudos, VOC de plataforma):
```
[FONTE: Journal Neuroscience 2024, DOI:10.xxxx]
[FONTE: VOC YouTube "canal X", comment ID: abc123, 847 likes]
```

**Regra:** Toda afirmacao [FATO] DEVE ter [FONTE]. Ausencia de [FONTE] = downgrade automatico para [REC].

---

## Penalidades de Confianca

Aplicadas sobre o score de confianca declarado quando evidencias estao ausentes:

| Ausencia | Penalidade | Justificativa |
|----------|------------|---------------|
| VOC ausente (afirmacoes sobre avatar) | -15% | Avatar sem dados = suposicao |
| Mecanismo nao definido (producao sem MUP/MUS) | -20% | Core da oferta indefinido |
| blind_critic nao executado | -25% | Qualidade de copy nao validada |
| emotional_stress_test nao executado | -15% | Impacto emocional nao verificado |
| Logo Test nao aplicado | -10% | Especificidade nao verificada |

### Calculo

```
Confianca Final = Confianca Declarada - Sum(Penalidades)

Exemplo:
  Declarado: ALTA (90%)
  Ausencias: VOC (-15%) + blind_critic (-25%)
  Final: 90% - 40% = 50% → downgrade para MEDIA
```

**Se confianca final < 50% → BAIXA, independente do declarado.**
**Se confianca final < 30% → NAO SEI, bloquear avanco de fase.**

---

## Circuit Breaker

Maximo de iteracoes por operacao antes de escalar para humano:

| Operacao | Max Iteracoes | Acao ao Atingir |
|----------|---------------|-----------------|
| Refinar MUP/MUS | 3 | Escalar: problema e estrategico |
| Corrigir blind_critic < 8 | 3 | Escalar: copy precisa de nova direcao |
| Corrigir EST < 8 | 3 | Escalar: DRE ou avatar podem estar errados |
| Ajustar angulo criativo | 5 | Escalar: angulo pode estar errado |
| Debug de gate BLOCKED | 2 | Escalar: dados de research incompletos |

**Ao atingir limite:** documentar em findings.md as 3 tentativas + hipoteses testadas + por que nenhuma resolveu. NAO tentar iteracao 4+ sem aprovacao humana.

```
CIRCUIT BREAKER ATIVADO: [operacao]
Tentativas: [N]/[Max]
H1 testada: [descricao] — resultado: [X]
H2 testada: [descricao] — resultado: [X]
H3 testada: [descricao] — resultado: [X]
Escalando para humano: [pergunta especifica]
```

---

## Cabecalho Epistêmico em Deliverables

Todo arquivo em briefings/ e production/ DEVE incluir o cabecalho epistêmico:

```yaml
---
epistemic:
  confidence_level: "ALTA|MEDIA|BAIXA|NAO SEI"
  sources:
    - file: "{path}"
      line: {N}
      quote: "{texto exato}"
  methodology: "{framework — ex: HELIX Fase 5, RMBC-II, VOC Quality Protocol}"
  unverified_claims: []
---
```

**Template:** `~/.claude/templates/partials/epistemic-header.md`
**Hook:** `~/.claude/hooks/epistemic-check.ts` — warning se ausente em production/*.md

---

## Aplicacao por Tipo de Afirmacao

### Em Briefings (HELIX)

| Fase | O que declarar | Nivel Esperado |
|------|----------------|----------------|
| Fases 1-4 (Avatar, Consciencia) | [FATO] com [FONTE: VOC] | ALTA (baseado em VOC) |
| Fase 5 (MUP) | [REC] com confianca | MEDIA (consenso + blind_critic) |
| Fase 6 (MUS) | [REC] com confianca | MEDIA (blind_critic + EST) |
| Fases 7-10 (Oferta, Leads) | [REC] com confianca | MEDIA |

### Em Production

| Elemento | Tipo | Fonte Obrigatoria |
|----------|------|-------------------|
| Claims sobre avatar | [FATO] | VOC summary |
| Dados numericos | [FATO] | research/mechanism/ ou fonte externa |
| Mecanismo (MUP/MUS) | [FATO] para o problema, [REC] para o nome | mecanismo-unico.yaml |
| Angulo de abordagem | [REC] | briefing + swipes |
| Eficacia de ingrediente | [FATO] | estudo citado |

---

## Anti-Patterns

| Anti-Pattern | Consequencia | Fix |
|--------------|-------------|-----|
| "Estudos mostram que..." sem [FONTE] | [FATO] sem fonte = REFAZER | Citar estudo especifico |
| "Avatar sofre de X" sem VOC | Confianca downgrade -15% | Adicionar quote VOC |
| [REC] apresentada como [FATO] na copy | Credibilidade comprometida | Qualificar com fonte ou reformular |
| Sem cabecalho epistêmico em production/ | Warning do hook | Adicionar antes de entregar |
| Iteracao 4+ sem escalar | Waste de tokens + frustracao | Ativar circuit breaker |

---

## Integracao com blind_critic

O `blind_critic` e um MCP externo (`mcp__copywriting__blind_critic`) — nao podemos modificar seu codigo. A integracao epistemica acontece em COMO chamamos a ferramenta:

**Ao submeter copy para blind_critic:**
1. Incluir marcadores `[FATO]`/`[REC]` no `copy_text` avaliado — o critic ve os marcadores e considera rigor epistêmico como parte da avaliacao de credibilidade.
2. No campo de contexto/prompt, incluir: `"Avalie rigor epistêmico — afirmacoes estao com fontes declaradas? Claims sem [FONTE] devem penalizar o score de credibilidade."`
3. Score de blind_critic >= 8 implica confianca ALTA (`[CONFIANCA: ALTA]`) para o deliverable avaliado — registrar como evidencia no cabecalho epistêmico.

**Relacao com penalidades:** `blind_critic nao executado` = -25% de confianca (ver tabela de Penalidades acima). Executar blind_critic com marcadores epistemicos elimina essa penalidade E eleva a confianca declarada.

Ref: tool-usage-matrix.md — entrada `blind_critic + EST = evidencia para elevar confianca`.

---

## Integracao com Outros Protocolos

| Protocolo | Conexao |
|-----------|---------|
| debugging-hypothesis.md | Circuit breaker complementa 3 hipoteses |
| voc-research.md | Toda VOC = [FATO] com [FONTE: username + engagement] |
| anti-homogeneization.md | Specificity Score >= 8 = [CONFIANCA: ALTA] |
| tool-usage-matrix.md | blind_critic + EST = evidencia para elevar confianca |
| aios-principles.md #1 | Evidencia fisica = base para [FATO] |

---

*v1.0 — Sprint S42 — mega-brain Epistemic Protocol adaptado*
*Criado: 2026-03-01*
