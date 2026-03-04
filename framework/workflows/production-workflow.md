# Production Workflow

> Quando e como usar subagents para produção de copy.
> **v2.0:** general-purpose obrigatório (custom types NAO herdam MCPs)

## WARNING: Subagent Type

> **SEMPRE usar `subagent_type="general-purpose"` para tasks de produção.**
> O tipo `copywriter` NÃO tem acesso a MCPs (blind_critic, emotional_stress_test, etc) no runtime.
> Custom subagent types recebem apenas Read, Write — sem ToolSearch para carregar deferred tools.

## Quando Usar

- Produção de VSL script
- Criação de landing page
- Geração de criativos (Meta, YouTube, TikTok)
- Sequências de email
- Qualquer produção de copy

## Pré-requisitos

Antes de invocar subagent de produção, GARANTIR que existe:
- `briefings/{offer}/helix-complete.md` (ou fases específicas)
- `research/{offer}/synthesis.md`
- `research/{offer}/voc/processed/language-patterns.md`

## Como Invocar

```
Task(
  subagent_type="general-purpose",
  prompt="Produzir [tipo de copy].
         Oferta: [nome]
         Briefing: [caminho do helix]
         Research: [caminho do synthesis]
         Output: [caminho do draft]

         INSTRUÇÃO: Após produzir, use ToolSearch para carregar MCP copywriting tools
         e execute blind_critic + emotional_stress_test na copy produzida."
)
```

## Workflow Padrão

```
1. VERIFICAR pré-requisitos (briefing + research)
2. INVOCAR general-purpose com prompt específico
3. AGUARDAR retorno (caminho do draft)
4. LER draft para verificar qualidade
5. INVOCAR general-purpose com prompt de reviewer para validação
6. SE PASS → finalizar
7. SE REVISE → invocar general-purpose com feedback
```

## Exemplo: Criativos Meta

```
Task(
  subagent_type="general-purpose",
  prompt="Produzir 5 hooks para Meta Ads.
         Oferta: hacker
         Briefing: concursos/hacker/briefings/helix-complete.md
         Research: concursos/hacker/research/synthesis.md
         Swipes: ~/.claude/skills/criativos-agent/references/swipe-files/concursos/
         Output: concursos/hacker/production/creatives/meta/drafts/

         Após produzir, use ToolSearch para carregar copywriting MCP tools e execute:
         1. blind_critic em cada hook
         2. emotional_stress_test no conjunto"
)
```

## Outputs Esperados

```
{oferta}/production/{type}/
├── drafts/        ← Versões iniciais
├── variations/    ← Variações testáveis
└── final/         ← Aprovado para uso
```

## Requisitos de Qualidade

- Mínimo 3 variações por peça
- Seção "GATE: Arquivos Lidos" presente
- VOC language utilizada
- MUP/MUS consistentemente aplicados

## Próximo Passo

Após produção → Invocar `general-purpose` com prompt de reviewer para validação.

---

*v2.0 - Fix: copywriter → general-purpose (custom types sem MCPs)*
*BSSF Score 9.2, GBS 95%*
*Atualizado: 2026-02-20*
