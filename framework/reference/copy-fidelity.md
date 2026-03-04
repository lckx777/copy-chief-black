# Copy Fidelity — APEX Score Framework (v1.0)

> Sprint: S7 — Copy Fidelity / APEX Score
> Principio: Copy produzida com expert archetype DEVE soar como aquele expert.
> Se pediu Makepeace e saiu Ogilvy, a fidelidade falhou.
> Criado: 2026-03-02

---

## REGRA CARDINAL

> **Copy atribuída a um expert que não soa como ele = atribuição falsa.**
> APEX Score mede o quanto a copy produzida é fiel ao DNA do expert escolhido.
> Score < 7 = expert errado ou prompt ignorado. Trocar expert ou reescrever.

---

## APEX — 4 Dimensões de Fidelidade

| Dimensão | O que Mede | Pergunta-Chave |
|----------|-----------|----------------|
| **A — Adherence** | Segue os princípios core do expert? | "O expert reconheceria isso como SEU trabalho?" |
| **P — Precision** | Usa técnicas ESPECÍFICAS do expert (não genéricas)? | "Quais técnicas assinatura do expert estão presentes?" |
| **E — Expression** | Tom, ritmo, vocabulário batem com o expert? | "Se remover o nome, saberia QUAL expert escreveu?" |
| **X — eXecution** | O output funciona no contexto de DR copy? | "Além de soar como o expert, CONVERTE?" |

---

## Escala por Dimensão (1-10)

### A — Adherence (Aderência aos Princípios)

| Score | Descrição |
|-------|-----------|
| 1-3 | Contradiz princípios core do expert |
| 4-5 | Genérico — poderia ser qualquer expert |
| 6-7 | Segue princípios mas sem profundidade |
| 8-9 | Princípios core claramente presentes e aplicados |
| 10 | Expert reconheceria como exemplo de seu trabalho |

### P — Precision (Técnicas Assinatura)

| Score | Descrição |
|-------|-----------|
| 1-3 | Zero técnicas assinatura identificáveis |
| 4-5 | 1 técnica presente mas superficial |
| 6-7 | 2+ técnicas presentes com aplicação adequada |
| 8-9 | Técnicas assinatura aplicadas com maestria |
| 10 | Combinação de técnicas que só este expert usaria |

### E — Expression (Voz e Tom)

| Score | Descrição |
|-------|-----------|
| 1-3 | Tom completamente errado (formal quando deveria ser raw) |
| 4-5 | Tom genérico — IA-speak ou copywriting médio |
| 6-7 | Tom reconhecível mas com deslizes |
| 8-9 | Voz do expert consistente ao longo da peça |
| 10 | Indistinguível do expert real escrevendo |

### X — eXecution (Funcionalidade DR)

| Score | Descrição |
|-------|-----------|
| 1-3 | Parece exercício acadêmico, não copy funcional |
| 4-5 | Copy funcional mas sem a potência do expert |
| 6-7 | Copy funcional com elementos do expert |
| 8-9 | Copy que converte E soa como o expert |
| 10 | O expert produziria isso como A-work |

---

## Score Total

```
APEX Total = (A + P + E + X) / 4

Classificação:
  9-10  = MASTERFUL — Expert fidelity excepcional
  7-8.9 = FAITHFUL  — Fidelidade sólida, pronto para uso
  5-6.9 = DILUTED   — Expert presente mas diluído. Revisar.
  < 5   = MISSED    — Expert errado ou ignorado. Refazer.
```

**Threshold mínimo:** APEX >= 7.0 para declarar copy como "produzida no estilo de [expert]".

---

## Thresholds por Expert (S7.5)

> Cada expert tem dimensões onde DEVE ser forte. Score abaixo do threshold
> naquelas dimensões específicas = fidelidade comprometida.

### T0 — Diagnosis

| Expert | Dimensão Forte | Threshold | Sinal de Fidelidade |
|--------|---------------|-----------|---------------------|
| **Schwartz** | A (strategy) | A >= 8 | Awareness levels + sophistication mapping presentes |
| **Collier** | E (empathy) | E >= 8 | "Enter the conversation" evidente — copy começa onde prospect já está |
| **Ogilvy** | P (research) | P >= 8 | Facts, dados, research-driven — zero adjetivos vazios |
| **Cialdini** | P (principles) | P >= 8 | 2+ princípios de influência aplicados com precisão |

### T1 — Strategic

| Expert | Dimensão Forte | Threshold | Sinal de Fidelidade |
|--------|---------------|-----------|---------------------|
| **Brown** | P (mechanism) | P >= 9 | E5 Method ou unique mechanism explícito e nomeado |
| **Bencivenga** | A (conviction) | A >= 8 | "One Key Idea" clara, proof como força dominante |
| **Reeves** | P (USP) | P >= 9 | Uma claim central martela repetidamente — zero dispersão |
| **Makepeace** | E (emotion) | E >= 9 | DRE crua nível 4-5, emoção que faz o corpo reagir |
| **Abraham** | A (strategy) | A >= 8 | Preeminence, multiplicadores, visão geométrica |
| **Hormozi** | P (offer) | P >= 9 | Value Equation explícita, Grand Slam framework |

### T2 — Execution

| Expert | Dimensão Forte | Threshold | Sinal de Fidelidade |
|--------|---------------|-----------|---------------------|
| **Halbert** | E (voice) | E >= 9 | A-pile energy, kitchen-table, cada frase puxa a próxima |
| **Sugarman** | E (flow) | E >= 9 | Slippery slope — impossível parar de ler |
| **Kennedy** | X (close) | X >= 9 | Deadline stacking, takeaway selling, close irresistível |
| **Caples** | P (testing) | P >= 8 | Headlines testáveis, A/B mindset, métricas |
| **Carlton** | E (raw) | E >= 8 | Street-smart, sem filtro, personalidade crua |
| **Chaperon** | P (sequence) | P >= 9 | Soap opera, open loops entre emails, arc narrativo |
| **Kern** | E (personality) | E >= 8 | Personality-driven, tribe building, conversacional |
| **Agora** | P (format) | P >= 8 | Magalog structure, fear-greed oscillation |
| **Sabri** | X (volume) | X >= 8 | HPDA, volume de variações, testing orientation |
| **Brunson** | P (funnel) | P >= 8 | Epiphany Bridge, Attractive Character, funnel stages |

### T3 — Specialized

| Expert | Dimensão Forte | Threshold | Sinal de Fidelidade |
|--------|---------------|-----------|---------------------|
| **Ry Schwartz** | P (launch) | P >= 8 | Cohort structure, backend architecture |
| **Powers** | E (honesty) | E >= 9 | Radical candor, anti-hype, plain speak extremo |
| **Vaynerchuk** | E (platform) | E >= 8 | Platform-native, attention-first, social-first |

### AUDIT

| Expert | Dimensão Forte | Threshold | Sinal de Fidelidade |
|--------|---------------|-----------|---------------------|
| **Hopkins** | P (science) | P >= 9 | Measurable, testable, accountable — zero subjetividade |

---

## Técnicas Assinatura por Expert (para Precision scoring)

> Lista das técnicas que DEVEM estar presentes para P >= 8.
> Ref: ~/.claude/copy-squad/{expert}.md para Voice DNA completo.

| Expert | Técnicas Assinatura (2+ para P >= 8) |
|--------|--------------------------------------|
| Schwartz | 5 awareness levels, 5 sophistication levels, mass desire channeling |
| Collier | Enter-the-conversation, desire matching, letter format |
| Ogilvy | Long headlines, research facts, brand+DR hybrid |
| Brown | E5 Method, unique mechanism, paradigm shift, new opportunity |
| Bencivenga | Persuasion equations, implicit promises, One Key Idea, belief harvesting |
| Makepeace | Emotional Selling Proposition, power leads, emotion+proof fusion |
| Halbert | A-pile, specificity obsession, tabloid hooks, kitchen-table voice |
| Sugarman | 30 Triggers, slippery slope, curiosity seeds, involvement devices |
| Kennedy | Deadline stacking, takeaway selling, reason-why, No BS directness |
| Caples | Headline formulas, tested methods, split-test framework |
| Carlton | Simple Writing System, street-smart, personality-as-weapon |
| Chaperon | Soap opera sequence, open loops, narrative arcs, autoresponder architecture |
| Hormozi | Value Equation, Grand Slam Offer, dream outcome / likelihood / time / effort |
| Cialdini | 7 principles, pre-suasion, social proof architecture |
| Reeves | USP discipline, single proposition, repetition strategy |
| Abraham | 3 multipliers, Strategy of Preeminence, geometric growth |
| Kern | Launch sequences, personality-driven, tribe building |
| Sabri | HPDA, Godfather Offer, 8-Phase testing |
| Brunson | Epiphany Bridge, Attractive Character, funnel hacking |
| Powers | Radical honesty, anti-hype, plain speech |
| Agora | Magalog, fear-greed oscillation, financial promo structure |
| Ry Schwartz | Cohort launches, cross-promotions, backend monetization |
| Vaynerchuk | Platform-native, Jab-Jab-Right Hook, attention arbitrage |
| Hopkins | Scientific Advertising, coupon accountability, testing obsession |

---

## Quando Aplicar

| Momento | APEX Score? | Motivo |
|---------|------------|--------|
| Produção com expert definido | SIM | Garantir fidelidade ao expert escolhido |
| Produção sem expert | NÃO | Sem referência, APEX não se aplica |
| Review/Validation | SIM | Verificar se fidelidade foi mantida |
| Criativos com multiple experts | Por expert | Cada seção avaliada contra seu expert |

### Workflow

```
1. Expert escolhido (via /expert ou decision tree)
2. Copy produzida com prompt do expert
3. APEX Score calculado (4 dimensões)
4. SE APEX >= 7.0: ✅ Fidelidade OK
5. SE APEX < 7.0: Identificar dimensão fraca → corrigir → re-score
6. Registrar no attribution frontmatter (fidelity.apex_score)
```

---

## Integração com Attribution

Todo deliverable com `expert_archetype` no attribution DEVE ter:

```yaml
fidelity:
  expert: "Makepeace"
  apex_score: 8.2
  breakdown:
    adherence: 8
    precision: 9
    expression: 8
    execution: 8
  strong_dimension: "E (emotion)"
  threshold_met: true
```

---

## Diagnóstico de Fidelidade Baixa

| Dimensão Fraca | Causa Provável | Fix |
|----------------|----------------|-----|
| A baixo | Não leu/seguiu Core Philosophy do expert | Reler ~/.claude/copy-squad/{expert}.md §Core Philosophy |
| P baixo | Técnicas genéricas em vez de assinatura | Checar lista de Técnicas Assinatura acima |
| E baixo | Tom IA-speak ou expert errado | Reler Voice Patterns do expert, aplicar anti-homogeneização |
| X baixo | Exercício de estilo sem funcionalidade DR | Adicionar CTA, urgência, proof — copy precisa VENDER |

---

*v1.0 — Sprint S7 (Copy Fidelity / APEX Score)*
*24 experts com thresholds específicos por dimensão forte*
*Ref: ~/.claude/copy-squad/manifest.yaml, agent-personas.md*
*Criado: 2026-03-02*
