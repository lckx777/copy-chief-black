# Ceremony Detection Protocol (v1.0)

> **Conceito AIOS:** "Se qualquer regra se torna cerimônia, delete." (§4.6)
> **Meta-regra:** Hooks/gates/rules que não agregam valor → remover
> **Frequência:** Auditoria mensal (1o dia do mês)
> **Script:** `~/copywriting-ecosystem/scripts/ceremony-audit.ts`
> **Criado:** 2026-02-27

---

## Definição de Cerimônia

> **Cerimônia** = componente do ecossistema que existe mas não produz efeito mensurável.
> Hooks que nunca bloqueiam, gates que nunca falham, rules que ninguém consulta.
> Cerimônias acumulam: cada uma custa tempo de execução, contexto, e complexidade.

---

## Checklist de Detecção (Rodar Mensalmente)

Para cada hook, gate, rule ou script:

- [ ] **Bloqueou** algo nos últimos 30 dias?
- [ ] **Preveniu** um erro real documentado?
- [ ] **Mudou** algum comportamento observável?
- [ ] **Remover** pioraria qualidade mensuravelmente?

### Decisão

| Respostas "SIM" | Decisão |
|------------------|---------|
| 4/4 | **MANTER** — componente ativo e valioso |
| 3/4 | **MANTER** — revisar o critério que falhou |
| 2/4 | **SIMPLIFICAR** — reduzir escopo ou frequência |
| 1/4 | **CANDIDATO A REMOÇÃO** — documentar razão de manter, ou remover |
| 0/4 | **REMOVER** — cerimônia confirmada |

---

## Categorias de Componentes

### Hooks (settings.json)

| Categoria | Quantidade Esperada | Sinal de Cerimônia |
|-----------|--------------------|--------------------|
| SessionStart | 8-12 | Hook nunca falha E output é ignorado |
| PreToolUse | 5-10 | Hook nunca bloqueia nenhuma ação |
| PostToolUse | 10-15 | Hook nunca produz warning visível |
| Stop | 2-3 | Hook nunca detecta problema |

### Gates (validate_gate)

| Gate | Sinal de Cerimônia |
|------|-------------------|
| Research | Sempre PASSED sem ferramentas obrigatórias |
| Briefing | Sempre PASSED sem fases completas |
| Production | Sempre PASSED sem validações MCP |

### Rules (~/.claude/rules/)

| Sinal de Cerimônia | Ação |
|--------------------|------|
| Rule não é referenciada por nenhum hook/skill/template | Candidata a consolidação |
| Rule duplica conteúdo de outra rule | Consolidar em uma só |
| Rule tem > 500 linhas sem ser consultada | Simplificar |

### Scripts (scripts/)

| Sinal de Cerimônia | Ação |
|--------------------|------|
| Script no daemon mas nunca executado | Remover do scheduler |
| Script sem chamador (não é hook, não é command) | Candidato a remoção |
| Script com 0 execuções em 30 dias | Investigar necessidade |

---

## Processo de Remoção

### 1. Identificar

```bash
bun run ~/copywriting-ecosystem/scripts/ceremony-audit.ts
```

### 2. Documentar Decisão

Para cada candidato:
```markdown
| Componente | Tipo | Ativações/30d | Decisão | Razão |
|------------|------|---------------|---------|-------|
| [nome] | hook/gate/rule/script | [N] | MANTER/SIMPLIFICAR/REMOVER | [razão] |
```

### 3. Aprovar com Humano

**NUNCA remover sem aprovação explícita.**

### 4. Executar

- REMOVER: Desregistrar de settings.json. Mover arquivo para `~/.claude/archive/`.
- SIMPLIFICAR: Reduzir escopo, manter funcionalidade core.
- MANTER: Documentar por que vale manter.

### 5. Verificar

```bash
bun run ~/.claude/scripts/registry-healer.ts
bun run ~/.claude/scripts/health-check.ts
```

---

## Anti-Patterns

| Anti-Pattern | Problema | Correto |
|--------------|----------|---------|
| Manter "porque sempre esteve lá" | Sunk cost fallacy | Avaliar valor ATUAL |
| Remover sem checar dependências | Pode quebrar outro componente | registry-healer.ts antes |
| Adicionar sem planejar remoção | Acúmulo infinito | Toda adição tem review date |
| Simplificar = desativar | Código morto | Remover de verdade |

---

## Métricas de Saúde

| Métrica | Saudável | Alerta | Crítico |
|---------|----------|--------|---------|
| Hooks inativos (0 ativações/30d) | 0-2 | 3-5 | 6+ |
| Rules não referenciadas | 0-1 | 2-3 | 4+ |
| Scripts orphan | 0 | 1-2 | 3+ |
| Tempo total de hooks/sessão | < 30s | 30-60s | > 60s |

---

*v1.0 — AIOS Upgrade Plan v4.0 § S2.1*
*Criado: 2026-02-27*
