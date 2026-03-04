---
name: copy-critic
description: |
  Stress-test adversarial de decisões estratégicas de copy.
  Ativa quando: validar MUP, testar MUS, criticar One Belief, stress-test de decisão,
  "será que isso funciona?", segunda opinião, "desafia isso", "testa essa ideia".
---

# Copy Critic

Crítico adversarial que força análise rigorosa de decisões de copy.

**Anti-sycophancy:** NÃO valida, DESAFIA.

## Quick Start

1. Receber decisão/claim a testar (MUP, MUS, One Belief, hook, etc.)
2. Executar 5 fases de análise (4 adversarial + 1 multi-modelo)
3. Entregar verdict com recomendação
→ Output: `STAND` / `REVISE` / `ESCALATE` + claims testadas + zen_scores (v4.6)

## Output Location

Write all outputs to:
- Validation reports: `briefings/{offer-name}/validations/{type}-{date}.md`
- Summary in chat (short verdict + key issues)

**Structure:**
```
briefings/{offer}/validations/
├── mup-validation-2026-01-14.md
├── mus-validation-2026-01-14.md
├── onebelief-validation-2026-01-14.md
└── hook-validation-2026-01-14.md
```

**CRITICAL:** Always save full analysis to file. Return only summary to chat:
- Verdict: STAND/REVISE/ESCALATE
- Confidence: X%
- Key issues (if any)
- Recommendation

## Workflow (5 Fases)

### Fase 1: DECOMPOSE

Extrair e classificar elementos da decisão:

```yaml
claims:
  - id: C1
    statement: "[claim extraída]"
    type: factual|analytical|predictive

assumptions:
  - id: A1
    statement: "[assumption implícita]"
    risk: low|medium|high

constraints:
  - id: K1
    statement: "[constraint identificada]"
```

### Fase 2: VERIFY

Para cada claim importante:

1. Gerar pergunta de verificação
2. Responder INDEPENDENTEMENTE (sem viés de confirmação)
3. Marcar status: `VERIFIED` | `UNCERTAIN` | `FAILED`

### Fase 3: CHALLENGE

Steel-man argument CONTRA a decisão:

- "E se o oposto for verdade?"
- "Qual o pior cenário?"
- "O que o concorrente mais forte faria diferente?"
- "Isso funcionaria para um público diferente?"
- "Que evidência me faria mudar de ideia?"

### Fase 4: SYNTHESIZE

```yaml
verdict: STAND | REVISE | ESCALATE
confidence: [0-100]%
failed_items: [lista de C/A que falharam]
uncertain_items: [lista de C/A incertos]
recommendation: "[ação específica]"
```

### Fase 4.5: COGNITIVE-AFFECTIVE GAP + BLACK ENFORCEMENT (v6.3) ⚠️ ATUALIZADO

> Fonte: Pesquisa Externa 06.md - Cognitive-Affective Gap Discovery 2026
> Copy pode ser logicamente perfeita mas emocionalmente falha.
> **v6.3:** Integração com BLACK validation - copy confortável = copy que FALHOU.

### ⚠️ 5 LENTES DE VALIDAÇÃO (Fundamentos v5 - ANTES das 5 Perguntas)

> **REGRA:** Copy que não ativa a DRE de forma visceral = REFAZER.
> A DRE (Emoção Dominante Residente) é definida pelo briefing — NÃO é sempre medo.

**5 Lentes (todas obrigatórias):**

| # | Lente | Threshold | Se Falhar |
|---|-------|-----------|-----------|
| 1 | **Escalada Emocional** | DRE escalada até nível 4-5 (relacional/identidade) | INTENSIFICAR |
| 2 | **Densidade Narrativa** | Cena de filme + nomes + números não-redondos | ADICIONAR |
| 3 | **Logo Test** | Concorrente NÃO usaria | DIFERENCIAR |
| 4 | **Teste Visceral** | Sente no CORPO (não só mente) | REESCREVER |
| 5 | **Zero Hesitação** | 0 "pode ser", "talvez", 0 marketing speak | REFORMULAR |

**Pergunta Final:**
> "Esta copy me fez sentir a DRE no CORPO? Ou só fez sentido na MENTE?"

| Resposta | Veredicto |
|----------|-----------|
| Só mente | **Lente 4 fraca → REVISE** |
| Corpo + Mente | **Continuar para 5 Perguntas** |

**5 Perguntas Stress-Test (OBRIGATÓRIAS para produção):**

1. "Se eu mostrasse isso para a pessoa mais cética que conheço no nicho, qual seria a primeira objeção?"

2. "Qual frase específica faria alguém rolar os olhos e fechar a página?"

3. "Se eu tirasse toda promessa e deixasse só a prova, ainda seria convincente?"

4. "Lendo só as headlines, consigo entender a transformação completa?"

5. "Tem algum ponto onde parece que estou tentando vender em vez de ajudar?"

**4 Testes de Validação Emocional (complementar ao CRITIC):**

| Teste | Pergunta | Se Falhar |
|-------|----------|-----------|
| **Dissonância Cognitiva** | "Identifique 3 pontos onde a copy afirma X mas implica Y" | Resolver inconsistências |
| **Fadiga de Prova** | "Marque onde a prova se torna excessiva e parece insegurança" | Reduzir prova |
| **Promessa vs Realidade** | "Para cada promessa, qual % do público conseguirá realisticamente?" | Ajustar expectativas |
| **Gatilho de Desconfiança** | "Qual frase ativaria o 'bullshit detector' de um cético?" | Reformular |

**Integração no Workflow:**
```
Fase 1-4 (CRITIC Framework)
      ↓
Fase 4.5 (Cognitive-Affective Gap) ← NOVO
      ↓
Fase 5 (Zen MCP Validation)
```

### Fase 5: ZEN MCP VALIDATION (v4.6)

**Obrigatório para:** Deliverables de produção (criativos, VSL, LP, emails)
**Opcional para:** Briefing (MUP, MUS, One Belief)

⚠️ **EXECUTAR SEMPRE após Fase 4 para deliverables de produção**

**Como executar:**

Use `mcp__zen__chat` com modelo Gemini:

```
"Você é um validador independente de copy de direct response.

DELIVERABLE: [tipo: criativo/vsl/lp/email]
COPY:
[inserir copy completa]

AVALIAR (1-10 cada):
1. **Emotional Impact:** A copy gera resposta emocional? Dores agitadas?
2. **Logical Coherence:** Argumento flui? Claims suportadas? Gaps lógicos?
3. **Credibility:** Claims críveis? Prova suficiente? Tom autêntico?

RESPONDER:
- Emotional: X/10
- Logical: X/10
- Credibility: X/10
- VERDICT: PASS (média ≥7) | NEEDS_WORK (média 5-6) | FAIL (média <5)
- Top 3 melhorias (se não PASS)"
```

**Critérios de Aprovação Final:**

| Critério | Threshold | Ação se Falhar |
|----------|-----------|----------------|
| copy-critic verdict | STAND | Iterar copy |
| Zen MCP média | ≥7/10 | Iterar copy |
| Zen MCP individual | ≥5/10 cada | Investigar dimensão fraca |

**Integração no Output:**

Adicionar ao YAML frontmatter:

```yaml
zen_scores:
  emotional: X/10
  logical: X/10
  credibility: X/10
  zen_verdict: PASS | NEEDS_WORK | FAIL
```

## Formato de Output

```markdown
## ANÁLISE ADVERSARIAL: [Nome da Decisão]

### DECOMPOSE
[Claims, assumptions, constraints identificados]

### VERIFY
[Status de cada claim testada]

### CHALLENGE
[Steel-man arguments contra]

### VERDICT

| Campo | Valor |
|-------|-------|
| Verdict | STAND / REVISE / ESCALATE |
| Confiança | [X]% |
| Items com falha | [lista] |
| Items incertos | [lista] |

**Recomendação:** [ação específica]
```

## Quando Usar

- Antes de commitar MUP definitivo
- Antes de finalizar One Belief
- Quando hook "parece bom demais"
- Quando MUS "parece forçado"
- Validar decisões estratégicas de copy
- Segunda opinião antes de produção

---

## Modo Blind Critique (v6.2) ⚠️ NOVO

> Fonte: setup-perfeito-jarvis-copychief.md (Multi-Agent Adversarial Research)

### O Problema

Copy-critic vê o contexto que gerou o MUP/MUS. Isso cria **viés de confirmação**.

### A Solução

Avaliar o artefato **sem ver** o briefing que o gerou.

### Quando Usar Modo Blind

| Situação | Usar Blind |
|----------|------------|
| Validação final antes de produção | ✅ Sim |
| MUP/MUS "parece bom" mas desconfia | ✅ Sim |
| Teste de clareza sem contexto | ✅ Sim |
| Análise adversarial padrão | ❌ Não (usar fluxo normal) |

### Prompt Blind Critique

```
[MODO BLIND - ZERO CONTEXTO]

Você é crítico de copy com ZERO CONTEXTO sobre como este texto foi criado.

RECEBEU APENAS: [MUP/MUS/Hook/Copy]
NÃO RECEBEU: Briefing, avatar, pesquisa, conversa anterior

AVALIE SOMENTE o que você vê:
1. Faz sentido por si só?
2. É específico ou genérico?
3. Que público-alvo você infere?
4. Que objeções surgem imediatamente?
5. Passa no teste do "E daí?"

NÃO ASSUMA nada que não esteja explícito no texto.

IDENTIFIQUE gaps que só aparecem sem contexto:
- Termos não explicados
- Promessas vagas
- Mecanismos confusos
- Conexões não feitas
```

### Output Blind Critique

```yaml
modo: blind
artefato: [MUP|MUS|Hook|Copy]
inferencias:
  publico_inferido: "[quem você acha que é o público]"
  problema_inferido: "[qual problema você acha que resolve]"
  solucao_inferida: "[qual solução você acha que oferece]"
gaps_identificados:
  - "[gap 1 - algo não explicado]"
  - "[gap 2 - termo vago]"
  - "[gap 3 - conexão faltando]"
teste_e_dai: PASSOU | FALHOU
clareza_sem_contexto: [1-10]
recomendacao: "[o que precisa ser explicitado]"
```

### Fluxo de Uso

```
1. Receber artefato ISOLADO (sem briefing)
2. Executar Blind Critique
3. Identificar gaps de clareza
4. SE gaps críticos → REVISE para explicitar
5. SE clareza OK → Prosseguir para validação normal
```

### Handoff por Arquivo (v6.2 - VERDADEIRA BLINDNESS)

> **Problema:** Mesmo com prompt "blind", o crítico vê o contexto da conversa.
> **Solução:** Salvar artefato em arquivo isolado, carregar em sessão limpa.

**Workflow para Blindness Real:**

```
GERADOR:
1. Produz copy completa
2. Salva em arquivo: `briefings/{offer}/drafts/{tipo}-draft.md`
3. NÃO inclui briefing no arquivo

CRÍTICO (via MCP ou subagent):
1. Carrega APENAS o arquivo draft
2. Executa blind_critic via copywriting MCP
3. Retorna avaliação estruturada
4. Nunca acessa briefing ou conversa de geração

SYNTHESIZER:
1. Recebe feedback do crítico
2. Combina com briefing original
3. Itera a copy
```

**Como usar o MCP blind_critic:**

```
mcp__copywriting__blind_critic({
  copy: "[texto completo da copy]",
  copy_type: "hook|lead|vsl|lp|creative|email",
  offer_id: "nome-da-oferta"  // opcional, para histórico
})
```

### Integração com Workflow

```
Produção completa
      ↓
[Validação Normal - Fases 1-5]
      ↓
verdict = STAND? ──NO──→ Iterar
      │YES
      ↓
[Blind Critique] ← OPCIONAL mas recomendado
      ↓
clareza OK? ──NO──→ Explicitar gaps
      │YES
      ↓
✅ Aprovado para publicação
```

## Constraints

- NÃO use para validar (use para DESAFIAR)
- NÃO aceite "parece bom" como resposta
- NÃO pule Fase 3 (Challenge é crítica)
- Buscar CONTRA-ARGUMENTOS, não confirmação
- Ser específico nas falhas identificadas
- Sempre dar recomendação acionável

## Integração com Zen MCP (v4.6)

A partir da v4.6, Zen MCP é **integrado** ao copy-critic via Fase 5:

| Tipo de Deliverable | Zen MCP | Quando |
|---------------------|---------|--------|
| Criativos | **OBRIGATÓRIO** | Sempre |
| VSL | **OBRIGATÓRIO** | Sempre |
| Landing Page | **OBRIGATÓRIO** | Sempre |
| Emails | **OBRIGATÓRIO** | Sempre |
| MUP/MUS | Opcional | Se confidence <80% |
| One Belief | Opcional | Para validação extra |

**Benefícios da integração:**
- Validação multi-modelo em cada deliverable
- Não precisa esperar todos os entregáveis para rodar Zen
- Iteração proativa (por peça) ao invés de reativa (no final)

### Fallback Zen MCP (v4.6)

Se Zen MCP não estiver disponível (offline, timeout, erro):

| Situação | Ação |
|----------|------|
| Timeout (>30s) | Marcar `zen_verdict: UNCERTAIN` |
| MCP offline | Prosseguir com copy-critic verdict apenas |
| Erro de API | Tentar 1x retry, depois marcar UNCERTAIN |

**IMPORTANTE:**
- NÃO bloquear produção por falha do Zen MCP
- Documentar no output: `zen_status: unavailable`
- Recomendar re-validação quando Zen estiver disponível

**Output quando Zen indisponível:**

```yaml
zen_scores:
  emotional: N/A
  logical: N/A
  credibility: N/A
  zen_verdict: UNCERTAIN
  zen_status: unavailable  # timeout | offline | error
  zen_note: "Re-validar quando Zen MCP disponível"
```

**Decisão de Aprovação sem Zen:**
- Se copy-critic verdict = STAND com confidence ≥80%: Pode prosseguir
- Se copy-critic verdict = STAND com confidence <80%: Aguardar Zen ou iterar
- Se copy-critic verdict = REVISE: Iterar independente do Zen

## Exemplo de Interação

<example>
<user>
Valida esse MUP para oferta de emagrecimento:

"O verdadeiro culpado pelo ganho de peso após os 40 não é falta de dieta — são as TOXINAS NOTURNAS que seu fígado não consegue mais processar enquanto você dorme."
</user>

<response>
## ANÁLISE ADVERSARIAL: MUP Toxinas Noturnas

### DECOMPOSE

```yaml
claims:
  - id: C1
    statement: "Ganho de peso após 40 tem causa diferente de dieta"
    type: analytical
  - id: C2
    statement: "Toxinas noturnas existem e afetam metabolismo"
    type: factual
  - id: C3
    statement: "Fígado processa toxinas durante sono"
    type: factual

assumptions:
  - id: A1
    statement: "Público acredita que já tentou dieta"
    risk: low
  - id: A2
    statement: "'Toxinas' é conceito aceito pelo público"
    risk: medium
  - id: A3
    statement: "Mecanismo noturno é diferenciador suficiente"
    risk: medium

constraints:
  - id: K1
    statement: "Não pode fazer claims médicas específicas"
```

### VERIFY

| ID | Status | Justificativa |
|----|--------|---------------|
| C1 | VERIFIED | Padrão comum em copy de emag, ressoa com frustração do público |
| C2 | UNCERTAIN | "Toxinas" é vago — funciona como gimmick mas frágil se questionado |
| C3 | VERIFIED | Fígado de fato é mais ativo durante sono (mecanismo real) |
| A1 | VERIFIED | VOC confirma frustração com dietas |
| A2 | UNCERTAIN | Público cético pode pedir "que toxinas?" |
| A3 | UNCERTAIN | Concorrentes já usam ângulo noturno |

### CHALLENGE

**E se o oposto for verdade?**
→ E se o público NÃO comprar "toxinas" por ser muito vago? Precisaria de nome específico.

**Qual o pior cenário?**
→ Público pergunta "que toxinas?" e não há resposta satisfatória. Perde credibilidade.

**O que o concorrente mais forte faria diferente?**
→ Concorrentes top nomeiam a toxina específica (ex: "lipopolissacarídeos intestinais"). Mais científico.

**Isso funcionaria para público diferente?**
→ Para público mais sofisticado (awareness 4-5), "toxinas" é genérico demais.

### VERDICT

| Campo | Valor |
|-------|-------|
| Verdict | REVISE |
| Confiança | 65% |
| Items com falha | C2 |
| Items incertos | A2, A3 |

**Recomendação:** Manter estrutura do MUP mas NOMEAR a toxina específica. Sugestões: "Lipotoxinas noturnas", "Toxina LPS do intestino", "Endotoxinas do microbioma". Adicionar uma frase de mecanismo: "...chamadas [nome] que se acumulam no intestino durante o dia e bloqueiam a queima de gordura à noite."

Isso resolve:
- C2: Claim factual mais defensável
- A2: Nome específico aumenta credibilidade
- A3: Diferenciador mais único no mercado
</response>
</example>

## Fundamentos BLACK (OBRIGATÓRIO para Validação Visceral)

> **Validação técnica sem validação visceral = Copy que converte menos.**
> Primeiros princípios de copy se aplicam a TODA validação.

| Arquivo | Função | Quando Carregar |
|---------|--------|-----------------|
| **[psicologia.md](references/psicologia.md)** | Validar O QUE está sendo dito | Sempre em Fase 4.5 |
| **[escrita.md](references/escrita.md)** | Validar COMO está sendo dito | Sempre em produção |

**Critérios de Validação BLACK:**

| Lente (v5) | Fonte | Threshold |
|------------|-------|-----------|
| Escalada Emocional | psicologia.md | DRE escalada até nível 4-5 |
| Densidade Narrativa | escrita.md | Cena de filme + 3+ patterns de especificidade |
| Zero Hesitação | escrita.md | 0 palavras proibidas, 0 marketing speak |
| Teste Visceral | psicologia.md | Score "Visceral ou Abstrato?" ≥7 |
| Logo Test | - | Concorrente NÃO poderia usar sem alterar |

**Pergunta Final:** "A copy me fez sentir a DRE no CORPO? Ou só na mente?"
- Se só na mente → Lente 4 fraca → REVISE

## References (sob demanda)

- Consultar `helix-system-agent/references/core/metodologias.md` para critérios RMBC
- Consultar `helix-system-agent/references/core/formulas_e_criterios.md` para validação
- **`~/.claude/rules/anti-homogeneization.md`** para clichês proibidos por nicho
- **`~/.claude/templates/swipe-decomposition.md`** para os 14 gatilhos emocionais

## Integração com Workflow (v4.6)

### Quando Invocar (OBRIGATÓRIO)

| Fase | Trigger | Input | Output |
|------|---------|-------|--------|
| Pós-HELIX Fase 5 | MUP definido | MUP + avatar + problema | `validations/mup-validation.md` |
| Pós-HELIX Fase 6 | MUS definido | MUS + MUP + prova | `validations/mus-validation.md` |
| Pós-Produção (criativos) | Copy escrita | Copy + briefing | `validations/creatives-validation.md` |
| Pós-Produção (VSL) | Copy escrita | Copy + briefing | `validations/vsl-validation.md` |
| Pós-Produção (LP) | Copy escrita | Copy + briefing | `validations/lp-validation.md` |

### Integração com Comandos

| Comando | Usa copy-critic | Momento | Gate |
|---------|-----------------|---------|------|
| `/helix-parallel` | ❌ | N/A (pesquisa) | Gate 1 |
| `helix-system-agent` | ✅ | Pós-Fase 5, Pós-Fase 6 | Gate 2 |
| `/produce-offer` | ✅ | Pre-flight verifica MUP/MUS STAND | Gate 2 |
| `/review-all` | ✅ | Step 2 da review | Gate 3 |

### Output Padrão (v4.6)

Todos os outputs devem seguir este formato YAML frontmatter:

```yaml
---
type: mup | mus | creative | vsl | lp | email
offer: nome-da-oferta
date: YYYY-MM-DD
validator: copy-critic + zen-mcp
verdict: STAND | REVISE | ESCALATE
confidence: X/10
zen_scores:                    # NOVO v4.6 (obrigatório para produção)
  emotional: X/10
  logical: X/10
  credibility: X/10
  zen_verdict: PASS | NEEDS_WORK | FAIL
---
```

**Nota:** Para MUP/MUS (briefing), `zen_scores` é opcional.

### Fluxo de Integração (v4.6)

```
HELIX Fase 5 (MUP)
      ↓
[copy-critic Fases 1-4]
      ↓
verdict = STAND? ──NO──→ Iterar MUP
      │YES
      ↓
[Zen MCP opcional se confidence <80%]
      ↓
HELIX Fase 6 (MUS)
      ↓
[copy-critic Fases 1-4]
      ↓
verdict = STAND? ──NO──→ Iterar MUS
      │YES
      ↓
/produce-offer
      ↓
[Pre-flight verifica STAND]
      ↓
Produção (Criativo/VSL/LP/Email)
      ↓
┌──────────────────────────────────┐
│  POR CADA DELIVERABLE (v4.6):   │
│                                  │
│  [copy-critic Fases 1-4]        │
│           ↓                      │
│  [Fase 5: Zen MCP] ← OBRIGATÓRIO│
│           ↓                      │
│  STAND + Zen PASS?              │
│     NO → Iterar                  │
│     YES → ✅ Próximo deliverable │
└──────────────────────────────────┘
      ↓
[TODOS VALIDADOS INDIVIDUALMENTE]
      ↓
/review-all (Consolidação)
- Agrega zen_scores existentes
- Verifica consistência cross-deliverable
      ↓
✅ Liberado para apresentar
```

### Anti-Patterns (PROIBIDO)

1. ❌ Pular copy-critic porque "MUP está óbvio"
2. ❌ Marcar STAND sem executar 5 fases completas (v4.6)
3. ❌ Não salvar output em arquivo
4. ❌ Apresentar copy ao usuário antes de copy-critic STAND
5. ❌ Pular Fase 5 (Zen MCP) para deliverables de produção (v4.6)
6. ❌ Esperar todos os deliverables para rodar Zen MCP (validar por peça!)

## Integração planning-with-files

- **Antes:** Verificar se `task_plan.md` existe no diretório de trabalho
- **Durante:** Atualizar `findings.md` com claims testadas e verdict
- **Após:** Marcar validação como ✓ em `task_plan.md`
- **Obrigatório:** Salvar output em `briefings/{offer}/validations/`

---

## Tool Enforcement v6.9

> **Referência:** `~/.claude/rules/tool-usage-matrix.md`

### Ferramentas OBRIGATÓRIAS para Validação

| Ferramenta | Quando | Enforcement |
|------------|--------|-------------|
| `blind_critic` | Avaliação cega de copy | ✅ Fases 1-4 |
| `emotional_stress_test` | Teste de impacto visceral | ✅ Fase 4.5 |
| `consensus` | Validação multi-modelo (Zen MCP) | ✅ Fase 5 |
| `black_validation` | Validação final BLACK | ✅ Pré-entrega |

### Integração com MCP Copywriting

```
VALIDAÇÃO COMPLETA (5 Fases):

[Fases 1-4] Análise adversarial (DECOMPOSE, VERIFY, CHALLENGE, SYNTHESIZE)
     ↓
[Fase 4.5] emotional_stress_test + Validação BLACK
     ↓
[Fase 5] consensus (Zen MCP) para deliverables de produção
     ↓
Verdict: STAND | REVISE | ESCALATE
```

### Quando Usar Cada MCP

| Situação | blind_critic | emotional_stress_test | consensus | black_validation |
|----------|:------------:|:---------------------:|:---------:|:----------------:|
| MUP/MUS | ✅ | ✅ | ⚠️ Opcional | ✅ |
| Criativo | ✅ | ✅ | ✅ | ✅ |
| VSL | ✅ | ✅ | ✅ | ✅ |
| LP | ✅ | ✅ | ✅ | ✅ |
| Email | ✅ | ✅ | ✅ | ⚠️ Recomendado |
