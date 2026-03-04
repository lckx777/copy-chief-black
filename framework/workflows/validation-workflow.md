# Validation Workflow

> Quando e como usar subagents para validação de copy.
> **v2.0:** general-purpose obrigatório (custom types NAO herdam MCPs)

## WARNING: Subagent Type

> **SEMPRE usar `subagent_type="general-purpose"` para tasks de validação.**
> O tipo `reviewer` NÃO tem acesso a MCPs (black_validation, layered_review, etc) no runtime.
> Custom subagent types recebem apenas Read, Write — sem ToolSearch para carregar deferred tools.

## Quando Usar

- Validação de hooks
- Review de body copy
- Verificação de consistência
- Quality gates antes de publicar
- Qualquer validação de copy produzida

## Pré-requisitos

Antes de invocar subagent de validação, GARANTIR que existe:
- Copy produzida (draft)
- Briefing para comparação
- VOC para verificar autenticidade

## Como Invocar

```
Task(
  subagent_type="general-purpose",
  prompt="Validar [tipo de copy].
         Copy: [caminho do draft]
         Briefing: [caminho do helix]
         VOC: [caminho do language-patterns]

         INSTRUÇÃO: Use ToolSearch para carregar MCP copywriting tools.
         Execute blind_critic, emotional_stress_test e black_validation."
)
```

## Workflow Padrão

```
1. INVOCAR general-purpose com copy a validar
2. AGUARDAR retorno (score + veredicto)
3. SE PASS (≥14/16) → finalizar
4. SE PASS_WITH_CONCERNS (≥12/16) → publicar com nota
5. SE NEEDS_REVISION (<12/16) → invocar general-purpose com issues
```

## Exemplo: Validar Hook

```
Task(
  subagent_type="general-purpose",
  prompt="Validar hook de Meta Ads.
         Copy: concursos/hacker/production/creatives/meta/drafts/hook-01.md
         Briefing: concursos/hacker/briefings/helix-complete.md
         VOC: concursos/hacker/research/voc/processed/language-patterns.md

         Use ToolSearch para carregar copywriting MCP e execute:
         1. blind_critic no hook
         2. emotional_stress_test (genericidade ≥8)
         3. Retorne score + veredicto"
)
```

## Checklists Aplicados

| Checklist | Max | Mínimo |
|-----------|-----|--------|
| Hook (6-Question) | 6 | 4 |
| Body (5-Point) | 5 | 4 |
| Consistency (5-Point) | 5 | 4 |
| **TOTAL** | **16** | **12** |

## Verdicts

| Score | Veredicto | Ação |
|-------|-----------|------|
| 14-16 | PASS | Pronto para uso |
| 12-13 | PASS_WITH_CONCERNS | Publicar, mas melhorar |
| <12 | NEEDS_REVISION | Refazer antes de publicar |

## Outputs Esperados

```
{oferta}/production/reviews/
└── {type}-review-{date}.md
```

## Fluxo de Revisão

```
Draft → General-Purpose (reviewer prompt) → Veredicto
                     ↓
            PASS ────────────→ Final
            CONCERNS ────────→ Final (com notas)
            REVISION ────────→ General-Purpose (copywriter prompt) → Draft → Reviewer
```

## Próximo Passo

Após PASS → Mover draft para `final/` e publicar.

---

*v2.0 - Fix: reviewer → general-purpose (custom types sem MCPs)*
*BSSF Score 9.2, GBS 95%*
*Atualizado: 2026-02-20*
