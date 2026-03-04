# Quality Gates Decision Tree - Ecossistema v4.9.6

> Documentação visual de todos os gates de qualidade implementados nos hooks.
> **Atualizado:** 2026-01-26 (FASE 3: ENFORCEMENT)

---

## Visão Geral dos Gates

| Gate | Hook | Trigger | Função |
|------|------|---------|--------|
| **#1** | user-prompt.ts | UserPromptSubmit | Skill Auto-Invoke |
| **#2** | user-prompt.ts | UserPromptSubmit | Research Gate |
| **#3** | user-prompt.ts | UserPromptSubmit | HELIX Phase Sequencing |
| **#4** | pre-tool-use-gate.ts | PreToolUse | Tool Priority (Apify > Playwright) |
| **#5** | pre-tool-use-gate.ts | PreToolUse | Methodology Check |
| **#6** | pre-tool-use-gate.ts | PreToolUse | Reasoning Depth (≥60%) |
| **#7** | pre-tool-use-gate.ts | PreToolUse | Sequential Thinking |

---

## Fluxo 1: USER PROMPT SUBMIT

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER SUBMITS PROMPT                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     user-prompt.ts            │
              │     (UserPromptSubmit hook)   │
              └───────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   GATE #1       │  │   GATE #2       │  │   GATE #3       │
│ Skill Auto-     │  │ Research Gate   │  │ Phase Sequencing│
│ Invoke          │  │ Enforcement     │  │ (HELIX)         │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Detecta trigger │  │ Detecta briefing│  │ Detecta fase    │
│ de skill?       │  │ trigger?        │  │ HELIX no prompt?│
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │ SIM     │ NÃO      │ SIM     │ NÃO      │ SIM     │ NÃO
    ▼         │          ▼         │          ▼         │
┌─────────┐   │    ┌─────────┐    │    ┌─────────┐    │
│ Exception│   │    │ Run     │    │    │ Check   │    │
│ phrase?  │   │    │validate-│    │    │prereqs? │    │
└────┬────┘   │    │gate.py  │    │    └────┬────┘    │
     │        │    └────┬────┘    │         │         │
 ┌───┴───┐    │    ┌────┴────┐    │    ┌────┴────┐    │
 │NO     │YES │    │BLOCKED? │PASS│    │MISSING? │OK  │
 ▼       │    │    ▼         │    │    ▼         │    │
┌────────┐│    │ ┌─────────┐ │    │ ┌─────────┐  │    │
│INJECT  ││    │ │INJECT   │ │    │ │INJECT   │  │    │
│skill   ││    │ │missing  │ │    │ │missing  │  │    │
│prompt  ││    │ │list     │ │    │ │phases   │  │    │
└────────┘│    │ └─────────┘ │    │ └─────────┘  │    │
         │    │              │    │              │    │
         └────┴──────────────┴────┴──────────────┴────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   COPY CHIEF ENFORCEMENT      │
              │   (Injects methodology +      │
              │    dynamic gold standards)    │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   MEMORY CONTEXT INJECTION    │
              │   (Query memory server)       │
              └───────────────────────────────┘
```

---

## Fluxo 2: PRE-TOOL USE (Write/Edit)

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOOL USE REQUESTED                           │
│                     (Write/Edit/MultiEdit)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   pre-tool-use-gate.ts        │
              │   (PreToolUse hook)           │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Tool in ALWAYS_ALLOWED?     │
              │   (Read, Glob, Grep, etc.)    │
              └───────────────┬───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ SIM               │ NÃO
                    ▼                   ▼
              ┌──────────┐    ┌───────────────────────────┐
              │ ALLOW    │    │   GATE #4: Tool Priority  │
              │ (exit)   │    │   (Playwright check)      │
              └──────────┘    └───────────────┬───────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │ Is Playwright + Social URL?   │
                              └───────────────┬───────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │ SIM               │ NÃO
                                    ▼                   ▼
                          ┌──────────────────┐  ┌───────────────┐
                          │ Escape phrase?   │  │ Continue      │
                          │ "forçar          │  │ to next gate  │
                          │  playwright"     │  └───────┬───────┘
                          └────────┬─────────┘          │
                               ┌───┴───┐                │
                               │NO     │YES             │
                               ▼       │                │
                        ┌──────────────┐│               │
                        │ DENY         ││               │
                        │ "Use Apify"  ││               │
                        │ + actor list ││               │
                        └──────────────┘│               │
                                       │                │
                          ┌────────────┴────────────────┤
                          │                             │
                          ▼                             ▼
              ┌───────────────────────────┐   ┌───────────────────────┐
              │ Tool in GATED_TOOLS?      │   │ ALLOW                 │
              │ (Write, Edit, MultiEdit)  │   │ (not a gated tool)    │
              └───────────────┬───────────┘   └───────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ NÃO               │ SIM
                    ▼                   ▼
              ┌──────────┐    ┌───────────────────────────┐
              │ ALLOW    │    │ Target is EXEMPT?         │
              │ (exit)   │    │ (PLAN, .json, research/,  │
              └──────────┘    │  briefings/, etc.)        │
                              └───────────────┬───────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │ SIM               │ NÃO
                                    ▼                   ▼
                              ┌──────────┐    ┌───────────────────────┐
                              │ ALLOW    │    │ Is copy output?       │
                              │ (exempt) │    │ (.md + /copy/vsl/etc) │
                              └──────────┘    └───────────────┬───────┘
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │ NÃO               │ SIM
                                                    ▼                   ▼
                                              ┌──────────┐    ┌───────────────┐
                                              │ ALLOW    │    │ QUALITY GATES │
                                              │ (exit)   │    │ (5, 6, 7)     │
                                              └──────────┘    └───────┬───────┘
                                                                      │
              ┌───────────────────────────────────────────────────────┤
              │                                                       │
              ▼                                                       │
┌─────────────────────┐                                              │
│   GATE #5           │                                              │
│   Methodology Read? │                                              │
└──────────┬──────────┘                                              │
           │                                                         │
    ┌──────┴──────┐                                                  │
    │ NÃO         │ SIM                                              │
    ▼             ▼                                                  │
┌─────────┐ ┌─────────────────────┐                                  │
│ DENY    │ │   GATE #6           │                                  │
│ "Read   │ │   Depth ≥ 60%?      │                                  │
│ SKILL.md│ └──────────┬──────────┘                                  │
│ first"  │            │                                             │
└─────────┘     ┌──────┴──────┐                                      │
                │ NÃO         │ SIM                                  │
                ▼             ▼                                      │
          ┌─────────┐ ┌─────────────────────┐                        │
          │ DENY    │ │   GATE #7           │                        │
          │ "Read   │ │   Sequential        │                        │
          │ more    │ │   Thinking Used?    │                        │
          │ files"  │ └──────────┬──────────┘                        │
          └─────────┘            │                                   │
                          ┌──────┴──────┐                            │
                          │ NÃO         │ SIM                        │
                          ▼             ▼                            │
                    ┌─────────┐   ┌──────────┐                       │
                    │ DENY    │   │ ALLOW    │◄──────────────────────┘
                    │ "Use    │   │ ✅       │
                    │ seqthink│   └──────────┘
                    │ first"  │
                    └─────────┘
```

---

## Fluxo 3: HELIX PHASE SEQUENCING

```
┌─────────────────────────────────────────────────────────────────┐
│                     HELIX PHASE SEQUENCE                         │
│                     (1-10 with prerequisites)                    │
└─────────────────────────────────────────────────────────────────┘

1. One Belief ──────────► 2. Big Idea ──────────► 3. Avatar/DRE
                                                        │
                                                        ▼
4. Competitors ◄────────────────────────────────────────┘
        │
        ▼
5. MUP (Problema/Vilão)
        │
        ├───────────────────────────┐
        ▼                           ▼
6. MUS (Mecanismo/Solução)    9. Leads/Ganchos
        │                           │
        ▼                           │
7. Big Offer                        │
        │                           │
        ▼                           │
8. Fechamento/Pitch ◄───────────────┘
        │
        ▼
10. Progressão Emocional


REGRAS DE SEQUENCIAMENTO:
─────────────────────────

│ Fase │ Prerrequisitos │ Pode Paralelo? │
├──────┼────────────────┼────────────────┤
│  1   │ (nenhum)       │ N/A            │
│  2   │ 1              │ -              │
│  3   │ 1, 2           │ -              │
│  4   │ 1, 2, 3        │ -              │
│  5   │ 1, 2, 3, 4     │ -              │
│  6   │ 5              │ -              │
│  7   │ 5, 6           │ -              │
│  8   │ 7              │ -              │
│  9   │ 5, 6           │ Sim (com 7-8)  │
│ 10   │ 8, 9           │ -              │

VERIFICAÇÃO:
───────────
Para cada fase N solicitada:
1. Detectar fase no prompt (patterns: "fase N", "faseNN", keywords)
2. Verificar se arquivos de fases prerrequisito existem em briefings/phases/
3. Se faltando → BLOQUEAR com lista de fases pendentes
4. Se completo → PERMITIR

ESCAPE MECHANISMS:
──────────────────
• "pular fase" - Bypass sequencing
• "skip phase" - Bypass sequencing
• "fora de ordem" - Bypass sequencing
• "sem sequência" - Bypass sequencing
• "--skip-sequence" - Bypass sequencing (CLI flag)
• "forçar fase" - Bypass sequencing
```

---

## Gate #4: Tool Priority Details

```
PLATAFORMAS MAPEADAS → APIFY ACTORS
───────────────────────────────────

│ Plataforma   │ Apify Actors Recomendados                    │
├──────────────┼──────────────────────────────────────────────┤
│ youtube      │ streamers/youtube-comment-scraper            │
│              │ bernardo/youtube-scraper                     │
│              │ apify/youtube-scraper                        │
├──────────────┼──────────────────────────────────────────────┤
│ instagram    │ apify/instagram-comment-scraper              │
│              │ apify/instagram-scraper                      │
│              │ apify/instagram-post-scraper                 │
├──────────────┼──────────────────────────────────────────────┤
│ tiktok       │ clockworks/tiktok-comments-scraper           │
│              │ clockworks/tiktok-scraper                    │
│              │ apify/tiktok-scraper                         │
├──────────────┼──────────────────────────────────────────────┤
│ reddit       │ trudax/reddit-scraper                        │
│              │ apify/reddit-scraper                         │
├──────────────┼──────────────────────────────────────────────┤
│ reclameaqui  │ pocesar/reclame-aqui-scraper                 │
├──────────────┼──────────────────────────────────────────────┤
│ twitter/x    │ apify/twitter-scraper                        │
│              │ quacker/twitter-scraper                      │
├──────────────┼──────────────────────────────────────────────┤
│ facebook     │ apify/facebook-posts-scraper                 │
│              │ apify/facebook-comments-scraper              │

LÓGICA DE BLOQUEIO:
──────────────────
1. Detectar se tool é Playwright (browser_navigate, browser_click, etc.)
2. Extrair URL do tool_input
3. Verificar se URL matches social platform patterns
4. Se match → BLOQUEAR com sugestão de Apify actor

ESCAPE MECHANISMS:
──────────────────
• "forçar playwright" - Bypass tool priority
• "force playwright" - Bypass tool priority
• "--force" - Bypass tool priority
• "usar playwright direto" - Bypass tool priority
• "bypass apify" - Bypass tool priority
• "apify não funciona" - Bypass (indica falha anterior)
• "apify falhou" - Bypass (indica falha anterior)
```

---

## Dynamic Gold Standards (v2.3)

```
HIERARQUIA DE BUSCA:
────────────────────

1. Oferta exata: ~/.claude/skills/helix-system-agent/references/examples/{nicho}/{oferta}/
   Exemplo: .../examples/concursos/hacker/05-mup.md

2. Mesmo nicho: ~/.claude/skills/helix-system-agent/references/examples/{nicho}/*/
   Exemplo: .../examples/concursos/*/05-mup.md (primeira que existir)

3. Fallback padrão: ~/.claude/skills/helix-system-agent/references/examples/relacionamento/quimica-amarracao-infiel/
   Exemplo: .../examples/relacionamento/quimica-amarracao-infiel/05-mup.md

DETECÇÃO DE NICHO:
──────────────────
Extraído do cwd via pattern: copywriting-ecosystem/{nicho}/{oferta}

Exemplos:
• cwd: ~/copywriting-ecosystem/concursos/hacker → nicho: concursos, oferta: hacker
• cwd: ~/copywriting-ecosystem/saude/diabetes → nicho: saude, oferta: diabetes

CASOS ESPECIAIS:
────────────────
• criativos → usa swipe-files por nicho: ~/.claude/skills/criativos-agent/references/swipe-files/{nicho}/
• landingpage → usa: ~/.claude/skills/landing-page-agent/references/swipes/
```

---

## Escape Mechanisms Summary

| Contexto | Escape Phrases |
|----------|----------------|
| **Skill Auto-Invoke** | "não use skill", "faça manualmente", "manual", "bypass" |
| **Phase Sequencing** | "pular fase", "skip phase", "fora de ordem", "forçar fase" |
| **Tool Priority** | "forçar playwright", "bypass apify", "apify falhou" |
| **All Gates** | "--force" (universal flag) |

---

## Troubleshooting

### Gate bloqueando indevidamente

```bash
# Verificar estado da sessão
cat ~/.claude/session-state/current-session.json

# Resetar estado
rm ~/.claude/session-state/current-session.json

# Verificar fases existentes
ls ~/copywriting-ecosystem/{nicho}/{oferta}/briefings/phases/
```

### Tool Priority bloqueando Apify

Se Apify está falhando e você precisa usar Playwright:
1. Diga "apify falhou" ou "forçar playwright" no prompt
2. Ou use `--force` flag

### Phase Sequencing bloqueando

Se você realmente precisa escrever fora de ordem:
1. Diga "pular fase" ou "fora de ordem"
2. Ou crie arquivos placeholder nas fases anteriores

---

## Arquivos de Implementação

| Gate | Arquivo | Função |
|------|---------|--------|
| #1-3 | `~/.claude/hooks/user-prompt.ts` | Prompt-level gates |
| #4-7 | `~/.claude/hooks/pre-tool-use-gate.ts` | Tool-level gates |
| Lib | `~/.claude/hooks/lib/platform-actors.ts` | Tool priority logic |
| Lib | `~/.claude/hooks/lib/helix-phases.ts` | Phase sequencing logic |
| Lib | `~/.claude/hooks/lib/skill-triggers.ts` | Skill detection |
| Lib | `~/.claude/hooks/lib/session-state.ts` | State management |

---

*Last updated: 2026-01-26 | Ecosystem v4.9.6 | FASE 3: ENFORCEMENT*
