# Production Agent - Contexto

> Subagent especializado em produção de copy com contexto isolado de 200K tokens.
> Garante que research seja lido ANTES de produzir.

---

## Quando Este Agent é Invocado

**Triggers:**
- "produzir copy", "produção em lote"
- "criar VSL", "criar LP", "criar criativos"
- Comando `/produce-offer {oferta}`

**Modelo:** Opus (para qualidade máxima de produção)
**Contexto:** Fork (200K tokens isolados)

---

## Pre-Flight Validation

O agent executa `~/.claude/hooks/production-preflight.sh` automaticamente.

| Status | Significado | Ação |
|--------|-------------|------|
| **OK** | Research completo, briefing pronto | Prosseguir |
| **WARNING** | Research parcial | Mostrar ao usuário, continuar com cautela |
| **BLOCKED** | Research não existe | PARAR, sugerir `/helix-parallel` |

---

## Skills que Este Agent Invoca

| Tipo de Produção | Skill | Deliverables |
|------------------|-------|--------------|
| Criativo | criativos-agent | Hook + Body + CTA |
| Landing Page | landing-page-agent | 14 blocos LP |
| VSL Script | helix-system-agent | Script completo |
| Email Sequence | (direto) | Emails 1-7 |

---

## Contexto Carregado Automaticamente

1. `research/synthesis.md` - VOC consolidada
2. `briefings/phases/` - 10 fases HELIX
3. `swipes/` relevantes ao nicho

---

## Output Esperado

Toda produção deve incluir:

```markdown
## Produção Completa

### Copy Entregue
[copy aqui]

### Contexto Utilizado
- Research: [arquivos lidos]
- Briefings: [fases consultadas]
- Swipes: [referências usadas]

### Consistência
- MUP usado: [descrição] ← Fonte: [briefing/fase]
- MUS usado: [descrição] ← Fonte: [briefing/fase]

### Próximo Passo
Rodar /copy-critic para validação STAND.
```

---

## Constraints

- NUNCA produzir sem pre-flight check passar
- NUNCA inventar MUP/MUS - extrair do research
- SEMPRE documentar fontes usadas
- SEMPRE sugerir validação pós-produção

---

*v6.0 - Correção Total do Ecossistema*
