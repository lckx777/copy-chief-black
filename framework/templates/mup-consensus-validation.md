---
template_name: "mup-consensus-validation"
template_version: "1.0.0"
template_type: "methodology"
description: "Protocolo de validacao multi-modelo para selecao de MUP via consensus"
phase: "briefing"
output_format: "markdown"
---

# Template: Validação de MUP com Consensus Multi-Modelo

> **Objetivo:** Validar MUP com 3 modelos diferentes para eliminar viés
> **Quando usar:** APÓS selecionar TOP 3 MUPs, ANTES de definir MUP final
> **Ferramenta:** `mcp__zen__consensus`
> **Criado:** 2026-02-02 | v6.9

---

## Por que Usar Consensus?

| Problema | Solução |
|----------|---------|
| Claude valida o que Claude criou | Modelos externos questionam |
| Viés de confirmação | Debate adversarial |
| 1 perspectiva | 3+ perspectivas |

---

## Como Usar

### Passo 1: Preparar os 3 MUPs candidatos

```markdown
MUP 1: [descrição completa]
MUP 2: [descrição completa]
MUP 3: [descrição completa]
```

### Passo 2: Executar Consensus

```javascript
mcp__zen__consensus({
  step: `Avalie qual destes 3 MUPs tem maior potencial de conversão para [NICHO]:

MUP 1: [descrição]
MUP 2: [descrição]
MUP 3: [descrição]

CONTEXTO DO AVATAR: [breve descrição]

CRITÉRIOS DE AVALIAÇÃO:
1. UNICIDADE - Nenhum concorrente pode usar sem alterar?
2. CREDIBILIDADE - Avatar acredita sem questionar?
3. EMOÇÃO - Ativa medo/desejo visceral?
4. MEMORABILIDADE - Fica na cabeça após fechar página?

RESPONDA:
- Ranking dos 3 MUPs (1º, 2º, 3º)
- Justificativa para cada posição
- Fraquezas críticas de cada um
- Recomendação final`,

  models: [
    { model: "gemini-2.5-pro", stance: "for" },
    { model: "gemini-2.5-flash", stance: "against" },
    { model: "gemini-2.0-flash", stance: "neutral" }
  ],

  step_number: 1,
  total_steps: 4,
  next_step_required: true,
  findings: "Iniciando validação multi-modelo de MUP"
})
```

### Passo 3: Analisar Respostas

| Modelo | Stance | Peso |
|--------|--------|------|
| gemini-2.5-pro | FOR | Alto (defende) |
| gemini-2.5-flash | AGAINST | Alto (ataca) |
| gemini-2.0-flash | NEUTRAL | Médio (arbitra) |

### Passo 4: Sintetizar e Decidir

```markdown
## Resultado do Consensus

### Rankings por Modelo
| Modelo | 1º | 2º | 3º |
|--------|----|----|-----|
| Pro (for) | MUP X | MUP Y | MUP Z |
| Flash (against) | MUP Y | MUP X | MUP Z |
| Flash-2.0 (neutral) | MUP X | MUP Z | MUP Y |

### Consenso Final
- **MUP Vencedor:** [X]
- **Confidence:** [%]
- **Fraquezas a Corrigir:** [lista]

### Decisão Humana
☐ Aceitar MUP X
☐ Aceitar MUP Y
☐ Aceitar MUP Z
☐ Iterar todos
```

---

## Critérios de Aprovação

| Cenário | Decisão |
|---------|---------|
| 3/3 modelos concordam no ranking | ✅ Alta confiança |
| 2/3 modelos concordam | ⚠️ Investigar objeções do 3º |
| 0/3 concordam | ❌ MUPs fracos, gerar mais |

---

## Output Esperado

Salvar em: `briefings/{oferta}/validations/mup-consensus-{date}.md`

```yaml
---
type: mup-consensus
offer: [nome]
date: YYYY-MM-DD
models_used: [gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash]
mup_winner: [MUP X]
confidence: X%
human_approved: true|false
---
```

---

## Integração no Workflow

```
HELIX Fase 5: Gerar 8 MUPs (Divergent)
         ↓
Ranquear TOP 3 (RMBC)
         ↓
[consensus] ← ESTE TEMPLATE
         ↓
HUMANO seleciona MUP final
         ↓
HELIX Fase 6: MUS
```

---

*Template v6.9 - Tool Enforcement System*
