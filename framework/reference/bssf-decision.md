---
phases: [ON_DEMAND]
priority: MEDIUM
tokens: ~1000
---

# BSSF - Best Solution Selection Framework (v1.0)

> **Regra:** Toda análise de gap OBRIGATORIAMENTE usa BSSF.
> **Princípio:** NUNCA band-aid. SEMPRE explorar 5 soluções antes de recomendar.
> **Fonte:** Downloads/BSSF-implementation.md

---

## CRITICAL CONSTRAINT

```
EXPLORAÇÃO OBRIGATÓRIA - NUNCA BAND-AID

Você NÃO PODE recomendar uma solução sem:

1. GERAR EXATAMENTE 5 SOLUÇÕES ESTRUTURALMENTE DIFERENTES
   - Solução 1: Mais rápida (band-aid típico)
   - Solução 2: Mais escalável (100x volume)
   - Solução 3: Mais mantível (menos debt)
   - Solução 4: Mais criativa/inovadora
   - Solução 5: Mais resiliente (falha graciosa)

2. AVALIAR CONTRA CRITÉRIOS COM PESOS
   - Integridade Estrutural (40%)
   - Escalabilidade (20%)
   - Mantibilidade (20%)
   - Impacto Imediato (10%)
   - Impacto Longo Prazo (10%)

3. CRIAR MATRIZ DE DECISÃO
   - Score cada solução 1-10 por critério
   - Calcular score ponderado total
   - Documentar por que cada alternativa foi rejeitada

4. APENAS ENTÃO recomendar a MELHOR (não a mais rápida)
   - Apresentar top 3 com rationale
   - Explicar trade-offs de cada uma
   - Deixar claro por que #1 é estruturalmente superior

PROIBIDO:
- Convergir antes de explorar 5 opções
- Recomendar sem matriz de decisão
- Escolher pelo speed (tempo de resposta)
- Retornar band-aid sem sinalizar risco
```

---

## Critérios de Decisão

| Critério | Peso | O que Avalia |
|----------|------|--------------|
| Integridade Estrutural | 40% | Resolve raiz ou sintoma? Volta em 4-8 semanas? |
| Escalabilidade | 20% | Funciona em 1x volume? 10x? 100x? |
| Mantibilidade | 20% | Quanto tech/process debt? Quanto skill necessário? |
| Impacto Imediato | 10% | Quanto resolve NOW? |
| Impacto Longo Prazo | 10% | Ainda funciona em 6 meses? 1 ano? |

---

## GBS (Greedy Bypass Score)

> **Pergunta-chave:** "Em quantas semanas este problema volta?"

| Timeline | GBS | Status |
|----------|-----|--------|
| 1-2 semanas | 10-30 | 🔴 **REJEITAR** |
| 3-4 semanas | 40-60 | 🟡 QUESTIONAR |
| 5-8 semanas | 70-85 | 🟢 ACEITAR |
| 8+ semanas | 90-100 | 🟢✓ ESTRUTURAL |

**Rule:** Nunca implementar GBS < 70

---

## Quando Usar BSSF

| Cenário | BSSF | Direct |
|---------|------|--------|
| Gap de enforcement | ✅ | ❌ |
| Problema de arquitetura | ✅ | ❌ |
| Hooks/MCPs não funcionam | ✅ | ❌ |
| Copy quality gap | ✅ | ❌ |
| Hallucination | ✅ | ❌ |
| Criatividade baixa | ✅ | ❌ |
| Formatação/typo | ❌ | ✅ |
| Routine edit | ❌ | ✅ |
| Bug simples | ❌ | ✅ |

---

## Template de Output

```markdown
## BSSF: [Nome do Gap]

### Gap Description
[2-3 frases]

### 80% Driver
[Qual é a causa-raiz primária]

### 5 Soluções
1. [Rápida/Band-aid] - GBS X%
2. [Escalável] - GBS X%
3. [Mantível] - GBS X%
4. [Criativa] - GBS X%
5. [Resiliente] - GBS X%

### Matriz de Decisão
| Critério | Peso | Sol 1 | Sol 2 | Sol 3 | Sol 4 | Sol 5 |
|----------|------|-------|-------|-------|-------|-------|
| Estrutura | 40% | X | X | X | X | X |
| Escalável | 20% | X | X | X | X | X |
| Mantível | 20% | X | X | X | X | X |
| Imediato | 10% | X | X | X | X | X |
| LP | 10% | X | X | X | X | X |
| **TOTAL** | 100% | X.X | X.X | X.X | X.X | X.X |

### Recomendação
**Solução #X** - Score X.X - GBS X%

Por que MELHOR: [rationale]
Por que NÃO as outras: [rejeições]

### Implementação
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]
```

---

## Proibições Explícitas

❌ **NUNCA faça isto:**
```
Problema: Regex tem falso positivo
Recomendação: "Adiciona contexto negativo ao regex"
[1 linha, sem exploração, band-aid puro]
```

✅ **SEMPRE faça isto:**
```
Problema: Regex tem falso positivo
Análise: Raiz é regex? Ou é falta de estado explícito?
5 Soluções: [lista com trade-offs]
Matriz: [decisão com scores]
Recomendação: Solução #X é melhor porque...
GBS: 90% (não volta)
```

---

## Auditoria

Manter log de decisões em `~/.claude/gap-decision-log.md`:
- Data/hora
- Gap description
- 5 soluções geradas
- Matriz de decisão
- Solução escolhida + rationale
- GBS da escolha

---

*v1.0 - Baseado em BSSF-implementation.md*
*Regra: GBS < 70 = REJEITAR*
*Atualizado: 2026-02-02*
