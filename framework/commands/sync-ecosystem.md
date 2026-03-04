---
description: Sincroniza todas as ofertas com padrões v4.9.8 e atualiza tracking global
argument-hint: "[--dry-run] [--offer=nome]"
---

# Sync Ecosystem v4.9.8

Sincroniza TODAS as ofertas do ecossistema com os padrões atuais (v4.9.8), atualizando arquivos de tracking e garantindo consistência.

**Argumentos:** $ARGUMENTS

**Diferença do /update-ecosystem:**
- `/update-ecosystem` = Atualiza o INSTALLER (packaging)
- `/sync-ecosystem` = Atualiza as OFERTAS (conteúdo)

---

## FASE 1: DISCOVERY

### 1.1 Listar Ofertas

```bash
# Encontrar todas as ofertas (estrutura: {nicho}/{oferta}/)
find ~/copywriting-ecosystem -mindepth 2 -maxdepth 2 -type d -name "*" | grep -v "swipes\|templates\|scripts" | sort
```

**Ofertas (Auto-Descoberta via discover-components.sh):**

```bash
# Listar ofertas automaticamente (MACRO)
~/.claude/scripts/discover-components.sh --list-offers
```

> **REGRA MACRO:** Nunca hardcodar lista de ofertas. Usar auto-descoberta.

### 1.2 Verificar Arquivos de Tracking

Para CADA oferta, verificar:

| Arquivo | Existe? | Tamanho | Status |
|---------|---------|---------|--------|
| `task_plan.md` | ? | ? | ? |
| `findings.md` | ? | ? | ? |
| `progress.md` | ? | ? | ? |
| `CLAUDE.md` | ? | ? | ? |

```bash
# Verificar tamanho dos arquivos de tracking
for offer in $(find ~/copywriting-ecosystem/concursos -mindepth 1 -maxdepth 1 -type d); do
  echo "=== $(basename $offer) ==="
  wc -c "$offer"/{task_plan,findings,progress,CLAUDE}.md 2>/dev/null || echo "Arquivos faltando"
done
```

**Critério:**
- ✅ OK se tamanho > 100 bytes
- ❌ VAZIO se tamanho < 100 bytes ou arquivo não existe

---

## FASE 2: AUDIT

### 2.1 Research Status

Para cada oferta, verificar:

```bash
# Verificar se synthesis.md existe e tem confidence
for offer in $(find ~/copywriting-ecosystem/concursos -mindepth 1 -maxdepth 1 -type d); do
  echo "=== $(basename $offer) ==="
  if [ -f "$offer/research/synthesis.md" ]; then
    grep -i "confidence\|confiança" "$offer/research/synthesis.md" | head -1
  else
    echo "❌ synthesis.md NÃO EXISTE"
  fi
done
```

### 2.2 Briefing Status

```bash
# Contar fases HELIX
for offer in $(find ~/copywriting-ecosystem/concursos -mindepth 1 -maxdepth 1 -type d); do
  echo "=== $(basename $offer) ==="
  ls "$offer/briefings/phases/"*fase*.md 2>/dev/null | wc -l
done
```

### 2.3 Calcular Score

| Oferta | Research | Briefing | Production | Tracking | Score Total |
|--------|----------|----------|------------|----------|-------------|
| ? | ?% | ?% | ?% | ?% | ?% |

**Fórmula:**
- Research: 0% (sem synthesis) / 50% (synthesis sem STAND) / 100% (synthesis + STAND)
- Briefing: (fases_existentes / 10) × 100%
- Production: (outputs_existentes / outputs_esperados) × 100%
- Tracking: (arquivos_preenchidos / 4) × 100%
- **Score Total:** (Research × 0.3) + (Briefing × 0.3) + (Production × 0.3) + (Tracking × 0.1)

---

## FASE 3: SYNC

### 3.1 Adicionar Fase 0 (se necessário)

Para ofertas SEM "Fase 0" ou "Biblioteca" no task_plan.md:

```bash
# Verificar se tem Fase 0
grep -l "Fase 0\|biblioteca" ~/copywriting-ecosystem/concursos/*/task_plan.md
```

**Se não tiver, adicionar no INÍCIO do task_plan.md:**

```markdown
### Fase 0: Carregar Biblioteca do Nicho (OBRIGATÓRIO)
- [ ] Ler `../biblioteca_nicho_concursos_CONSOLIDADA.md`
- [ ] Extrair avatar base para esta oferta
- [ ] Identificar dores/desejos relevantes
- [ ] Documentar VOC herdada em findings.md
- **Status:** pending
- **Gate:** findings.md tem seção "VOC Herdada"
```

### 3.2 Preencher Arquivos Vazios

**Se findings.md vazio (< 100 bytes):**

```markdown
# Findings: {nome_oferta}

## VOC Herdada da Biblioteca do Nicho

### Avatar Base
[Carregar de ../biblioteca_nicho_concursos_CONSOLIDADA.md]

### Dores Principais (Top 5)
1. [A extrair da biblioteca]
2.
3.
4.
5.

### Desejos Principais (Top 5)
1. [A extrair da biblioteca]
2.
3.
4.
5.

---

## Hipóteses Iniciais
[A documentar durante pesquisa]

## Descobertas
[A documentar durante pesquisa]

## Decisões
| Data | Decisão | Rationale |
|------|---------|-----------|
|      |         |           |

---

*Criado: {data}*
```

**Se progress.md vazio (< 100 bytes):**

```markdown
# Progress Log: {nome_oferta}

## 5-Question Reboot Check

| Question | Answer |
|----------|--------|
| Where am I? | Setup inicial - aguardando Fase 0 |
| Where am I going? | Fase 0 → Research → Briefing → Production |
| What's the goal? | [Definir objetivo da oferta] |
| What have I learned? | [A preencher durante execução] |
| What have I done? | Estrutura criada |

---

## Session Log

### {data} - Setup Inicial
- Estrutura de diretórios criada
- Arquivos de tracking inicializados
- Próximo: Executar Fase 0 (Carregar Biblioteca)

---

## Métricas

| Métrica | Target | Current | Status |
|--------|--------|---------|--------|
| Research | 100% | 0% | 🔴 |
| Briefing | 100% | 0% | 🔴 |
| Production | 100% | 0% | 🔴 |

---

*Atualizado: {data}*
```

### 3.3 Padronizar Nomes de Arquivos

Se existir arquivo com nome não-padrão:

| De | Para |
|----|------|
| `avatar/processed/avatar-profile.md` | `avatar/processed/summary.md` |
| `mechanism/processed/mup-mus-definition.md` | `mechanism/processed/summary.md` |

```bash
# Verificar arquivos fora do padrão
find ~/copywriting-ecosystem -name "avatar-profile.md" -o -name "mup-mus-definition.md"
```

**Ação:** Renomear para `summary.md` no mesmo diretório

### 3.4 Atualizar CLAUDE.md das Ofertas

Para cada oferta, atualizar:

1. **Status:** Refletir fase atual real
2. **Checkboxes:** Marcar tarefas concluídas
3. **Quality Gates:** Atualizar com scores reais
4. **Próximo Passo:** Definir ação seguinte

---

## FASE 4: UPDATE GLOBAL

### 4.1 Atualizar ecosystem-status.md (MACRO: Automático)

Usar o script de geração automática:

```bash
# Gerar apenas a tabela (MACRO)
~/.claude/scripts/generate-offers-table.sh --table
```

> **REGRA MACRO:** Tabela gerada automaticamente, nunca hardcoded.

**Status possíveis:**
- 🔴 Scaffolding (0-15%)
- 🟡 Research (16-40%)
- 🟠 Briefing (41-65%)
- 🟢 Production (66-90%)
- ✅ Complete (91-100%)

### 4.2 Atualizar CLAUDE.md Global (MACRO: Automático)

Gerar tabela de ofertas automaticamente:

```bash
# Gerar tabela atualizada (MACRO)
~/.claude/scripts/generate-offers-table.sh --markdown
```

**Output esperado:**
```markdown
## Ofertas Ativas (v{VERSION})

| Nicho | Oferta | Tipo | Status | Score | Diretório |
|-------|--------|------|--------|-------|-----------|
| ... | (auto-descoberto) | ... | (calculado) | ...% | ... |
```

**IMPORTANTE:** Copiar o output do script e substituir a seção "Ofertas Ativas" no `~/.claude/CLAUDE.md`.

> **REGRA MACRO:** Nunca editar a tabela manualmente. Sempre usar o script.

### 4.3 Atualizar task_plan.md do Ecossistema

Atualizar `~/copywriting-ecosystem/task_plan.md` com prioridades baseadas em score:

```markdown
## Prioridades (Atualizado {data})

### Alta Prioridade
1. [Oferta com menor score que precisa avançar]

### Média Prioridade
2. [Ofertas em progresso]

### Baixa Prioridade
3. [Ofertas quase completas]
```

---

## FASE 5: REPORT

### Gerar Relatório Final

```markdown
## /sync-ecosystem Report

**Data:** {data}
**Versão:** v4.9.8

### Ofertas Auditadas

| Oferta | Antes | Depois | Ações Tomadas |
|--------|-------|--------|---------------|
| Gabaritando | ?% | ?% | [lista] |
| Hacker | ?% | ?% | [lista] |
| GPT Aprovados | ?% | ?% | [lista] |
| CONCURSA.AI | ?% | ?% | [lista] |

### Gaps Corrigidos

- [ ] Arquivos vazios preenchidos: X
- [ ] Fase 0 adicionada: X ofertas
- [ ] Nomes padronizados: X arquivos
- [ ] CLAUDE.md atualizados: X ofertas
- [ ] Arquivos globais atualizados: 3

### Próximas Ações Recomendadas

1. [Oferta com menor score]: [Ação específica]
2. ...
```

---

## Quality Gate

### ✅ SYNC BEM-SUCEDIDO SE:

- Todas ofertas têm task_plan.md, findings.md, progress.md não-vazios
- Todas ofertas têm Fase 0 referenciando biblioteca
- ecosystem-status.md reflete scores reais
- CLAUDE.md global tem todas ofertas listadas

### ⚠️ ALERTAR SE:

- Oferta com score < 10% (estrutura apenas)
- Arquivos de research faltando (synthesis.md)
- Briefing incompleto (< 10 fases)

---

## Notas

- Este comando NÃO executa research ou produção - apenas SINCRONIZA estado
- Para iniciar work em uma oferta específica, usar `/squad-research {oferta}` ou `/helix-parallel {oferta}`
- Executar após cada sessão de trabalho para manter tracking atualizado
- Versão atual do ecossistema: **v4.9.8**

---

*Comando criado: 2026-01-23 | v4.9.8*
