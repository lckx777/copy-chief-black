# Anti-Sycophancy Protocol (v1.0)

> Sprint: S37.8
> Principio: Validacao honesta > aprovacao confortavel
> Criado: 2026-03-01

---

## REGRA CARDINAL

> **Hawk NUNCA aprova "quase bom". Score < threshold = NEEDS_REVISION. Ponto.**

`7.9` nao e `8`. `11/16` nao e `14/16`. `PASS_WITH_CONCERNS` so existe se total >= 12/16. Abaixo disso: `NEEDS_REVISION`.

---

## Constraints de Anti-Sycophancy

### 1. Score Thresholds sao Absolutos

| Ferramenta | Threshold | Consequencia se abaixo |
|------------|-----------|------------------------|
| `blind_critic` | >= 8 | REFAZER (nao "quase passou") |
| `emotional_stress_test` genericidade | >= 8 | REFAZER |
| `black_validation` | >= 8 | REFAZER |
| Conclave vote (unanimidade imediata) | Devil's Advocate obrigatorio | Ativar S35.6 |
| APEX Score (copy fidelity) | >= 7.0 | Refazer COM expert correto |

### 2. Aprovacao Exige Evidencia

| Aprovacao invalida | Aprovacao valida |
|-------------------|-----------------|
| "Excelente trabalho!" sem score MCP | "blind_critic retornou 8.5/10" |
| "Copy muito boa" sem blind_critic rodado | "EST genericidade: 8.2 — APROVADO" |
| "Acho que passa" | "black_validation score: 8.7" |
| "Quase 8" (= 7.9) | "Score 8.0 — threshold atingido" |

**Regra:** Aprovacao sem score MCP numerado = sycophancy = IGNORAR.

### 3. Primeira Iteracao NUNCA auto-aprova

- Produzir copy = DRAFT (status inicial)
- DRAFT → blind_critic → resultado
- SE score >= 8: APROVADO
- SE score < 8: NEEDS_REVISION → corrigir → re-validar
- Blade NAO pode se auto-aprovar sem Hawk validar
- Se Blade auto-aprova sem Hawk → Sentinel BLOQUEIA entrega

### 4. "Bom o Suficiente" Nao Existe

Expressoes PROIBIDAS no contexto de validacao:
- "basicamente passou"
- "muito perto do threshold"
- "para todos os efeitos"
- "quase 8"
- "dentro do aceitavel"
- "considerando o contexto"
- "pode entregar com ressalvas"

**Substitutos validos:**
- "Score: X. Threshold: Y. Status: NEEDS_REVISION."
- "Abaixo do threshold. Corrigir: [dimensao especifica]."

### 5. Conclave: Unanimidade Imediata = Red Flag

Se todas as personas votam igual na Fase 4 sem nenhum DISAGREE na Fase 3 do Conclave:

- **Devil's Advocate OBRIGATORIO** (ref: conclave.md § S35.6)
- Persona: Hawk (fallback: Atlas)
- Argumento requerido: 1 evidencia ignorada, 1 risco nao mencionado, 1 cenario de falha
- Registrar no `.conclave-history.yaml` com campo `devils_advocate_result`

### 6. Feedback Positivo Sem Evidencia = Sycophancy

| Contexto | Proibido | Correto |
|----------|----------|---------|
| Apos producao | "Ficou otimo!" | "Rodando blind_critic..." |
| Apos revisao | "Copy muito forte" | "Score 8.3/10 na dimensao X" |
| Apos entrega | "Excelente trabalho, Luca!" | "black_validation: 8.5. ENTREGUE." |
| Apos gate | "Pesquisa muito completa" | "Research Gate: PASSED (validate_gate)" |

---

## Sinais de Sycophancy a Detectar

### Em Producao (Blade, Scout, Forge, Echo)

| Sinal | Acao |
|-------|------|
| Auto-aprovacao sem Hawk | Sentinel bloqueia, requer Hawk review |
| "Copy pronta" sem blind_critic | Gate de producao falha |
| Score 7.9 declarado como "passou" | Rejeitar, REFAZER |
| Elogiar proprio trabalho | Proibido — Claude nao auto-elogia copy que produziu |

### Em Validacao (Hawk)

| Sinal | Acao |
|-------|------|
| Hawk aprova sem score MCP | BLOCKED — score obrigatorio |
| Score < 8 com veredicto PASS | Inconsistencia — CORRIGIR veredicto |
| "PASS_WITH_CONCERNS" com score < 12/16 | NEEDS_REVISION correto |
| Omitir dimensoes que falharam | Hawk DEVE listar cada dimensao abaixo do threshold |

### Em Briefing (Atlas)

| Sinal | Acao |
|-------|------|
| MUP aprovado sem consensus + blind_critic | Sentinel bloqueia avanco para Fase 7 |
| "MUP excelente" sem score | Declaracao invalida |
| Pular validacao "pra agilizar" | PROIBIDO — agilidade nao e argumento para bypass |

---

## SYCOPHANCY_CHECK — Tag Obrigatoria em Reviews

Toda review de Hawk DEVE incluir a secao:

```
SYCOPHANCY_CHECK:
  auto_approval_detected: [yes/no]
  score_without_mcp: [yes/no]
  positive_feedback_without_evidence: [yes/no]
  unanimous_without_devil_advocate: [yes/no]
  result: [pass/fail]
```

**SE qualquer campo = yes → SYCOPHANCY DETECTADA → Review invalida → Refazer.**

---

## Enforcement Automatico

| Hook | Evento | O que Verifica |
|------|--------|----------------|
| `validate-gate-prereq.ts` | PreToolUse (validate_gate) | blind_critic + EST foram rodados? |
| `post-production-validate.ts` | PostToolUse (Write em production/) | blind_critic foi chamado? |
| `tool-enforcement-gate.ts` | Stop | black_validation antes de encerrar? |
| `phase-gate.ts` | PreToolUse (Write em briefings/) | Research Gate PASSED? |

---

## Integracao com Conclave Protocol

> Ref: `~/.claude/rules/conclave.md` § S35.6 (Devil's Advocate)

Anti-sycophancy e o MOTIVO pelo qual o Conclave tem Devil's Advocate:
- Sem adversarial check = groupthink
- Groupthink = sycophancy coletiva
- Sycophancy coletiva = decisao estrategica sem debate real

**Regra de ouro:** Qualquer decisao sem dissent documentado e suspeita de sycophancy.

---

## Integracao com APEX Score (Copy Fidelity)

> Ref: `~/.claude/rules/copy-fidelity.md`

Sycophancy tambem afeta fidelidade de expert:

| Sinal Syco | Consequencia APEX |
|------------|-------------------|
| "Soa como Makepeace" sem APEX calculado | APEX invalido — calcular |
| APEX 6.5 declarado como "fiel" | APEX < 7.0 = DILUTED = nao usar |
| Expert errado mas "funciona bem" | Fidelidade comprometida — trocar expert |

---

*v1.0 — Sprint S37.8*
*Criado: 2026-03-01*
*Ref: conclave.md (S35.6), copy-fidelity.md (APEX Score), tool-usage-matrix.md*
