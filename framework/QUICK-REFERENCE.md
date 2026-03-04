# Quick Reference - Ecossistema Copy Chief v6.4

> Referência rápida para produção de copy com Claude Max 20x.

---

## Atalhos CLI (Mac)

| Atalho | Função |
|--------|--------|
| `Option+T` | Toggle Extended Thinking |
| `Ctrl+Shift+B` | Enviar para background |
| `/compact` | Compactar contexto |
| `/clear` | Limpar sessão |
| `/memory` | Ver memories carregados |

---

## Skills (Auto-Invoke)

| Trigger | Skill | Uso |
|---------|-------|-----|
| "pesquisa", "VOC", "avatar" | `audience-research-agent` | Pesquisa de público |
| "briefing", "HELIX", "MUP" | `helix-system-agent` | Briefing estratégico |
| "produzir", "VSL", "LP" | `production-agent` | Produção de copy |
| "validar", "stress-test" | `copy-critic` | Validação adversarial |
| "nova oferta", "qual fase" | `ecosystem-guide` | Navegação |

---

## Commands (Slash)

| Comando | Função |
|---------|--------|
| `/produce-offer {oferta}` | Produção paralela (4 tasks) |
| `/review-all {oferta}` | Validação multi-modelo |
| `/create-offer` | Criar estrutura nova oferta |
| `/sync-project` | Enviar para Claude.ai Projects |
| `/update-ecosystem` | Gerar ZIP do ecossistema |

---

## Features por Ambiente

| Feature | CLI | Web | Quando Usar |
|---------|:---:|:---:|-------------|
| Extended Thinking | Option+T | Toggle | MUP/MUS, briefing, validação |
| Research | Via Chrome | Toggle | Dados externos (5-30 min) |
| Memory | CLAUDE.md | Auto | Projetos de longo prazo |
| Skills | Auto | ❌ | Produção estruturada |
| Subagents | Task tool | ❌ | Contexto isolado 200K |
| RAG | ❌ | Até 2M | Arquivos grandes |

---

## Regras de Contexto

| Limite | Ação |
|--------|------|
| 50-60% | Executar `/compact` |
| >75% | Zona crítica - qualidade degrada |

**3-Tier Memory:**
- **HOT:** synthesis.md + briefing atual (sempre carregado)
- **WARM:** references/, swipes/ (sob demanda)
- **COLD:** raw/, dados brutos (NUNCA no contexto)

---

## Quality Gates

| Gate | Validação | Threshold |
|------|-----------|-----------|
| Research | `validate-gate.py RESEARCH` | Todos deliverables |
| Briefing | 10 fases + STAND | Copy-critic ≥8 |
| Production | Internal review | ≥12/16 |

---

## BLACK Validation (Obrigatório)

**5 Critérios para Aprovar Copy:**
1. Medo ativado? (visceral, não abstrato)
2. Especificidade? (nome, idade, cidade, número exato)
3. Mecanismo? (proprietário + parece científico)
4. Linguagem? (zero "pode ser", "talvez")
5. Logo Test? (concorrente NÃO usaria)

**Score < 8 = REFAZER**

---

## Fluxo Canônico

```
1. PESQUISA
   └── audience-research-agent → VOC, competitors, mechanism, avatar

2. BRIEFING
   └── helix-system-agent → 10 fases HELIX

3. PRODUÇÃO
   └── production-agent → VSL, LP, criativos, emails

4. VALIDAÇÃO
   └── copy-critic → Stress-test adversarial
```

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Não sei onde parei" | `task_plan.md` + `progress.md` |
| Contexto poluído | `/compact` ou `/clear` |
| Copy genérica | Verificar BLACK gates |
| Gate bloqueado | `validate-gate.py` |
| Skill não ativa | Verificar triggers em CLAUDE.md |

---

*v6.4 - 2026-01-31*
