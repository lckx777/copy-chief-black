---
template_name: "copy-validation-checklist"
template_version: "1.0.0"
template_type: "checklist"
description: "Checklist de validacao de copy com 5 Lentes e thresholds por deliverable"
phase: "production"
output_format: "markdown"
validation_tools: ["blind_critic", "emotional_stress_test", "black_validation"]
---

# Copy Validation Checklist v6.0

> Checklist de validação baseado no CRITIC Framework.
> Baseado em Pesquisa 6 (Copy Validation).

---

## QUANDO USAR

Usar este checklist:
- [ ] Antes de entregar qualquer copy final
- [ ] Após produzir VSL, LP, criativos ou emails
- [ ] Para validar MUP/MUS de briefings
- [ ] Quando copy-critic retornar REVISE

---

## CRITIC FRAMEWORK

### Processo de Validação

```
Output inicial
      ↓
Interação com tools (checklist, VOC, briefing)
      ↓
Avaliação de aspectos ESPECÍFICOS
      ↓
Revisão baseada no feedback
      ↓
Output melhorado
```

> **Regra:** Validar com CRITÉRIOS OBJETIVOS, não impressões subjetivas.

---

## 1. GATE DE LEITURA

### Arquivos Obrigatórios Lidos?

| Arquivo | Lido? | Elemento Extraído |
|---------|-------|-------------------|
| CONTEXT.md | [ ] | [elemento específico] |
| synthesis.md | [ ] | [elemento específico] |
| Fase 03 (Avatar) | [ ] | [sinestesia específica] |
| Fase 05 (MUP) | [ ] | [nome do MUP] |
| Fase 06 (MUS) | [ ] | [nome do MUS] |
| Fase 07 (One Belief) | [ ] | [crença específica] |

### Critério de Aprovação

| Status | Condição |
|--------|----------|
| ✅ PASS | Elementos são ESPECÍFICOS (ex: "acordar 3AM sem fome") |
| ❌ FAIL | Elementos são GENÉRICOS (ex: "li o arquivo") |

---

## 2. VALIDAÇÃO MUP

### Critérios RMBC

| Critério | Pergunta | ✓/✗ | Evidência |
|----------|----------|-----|-----------|
| **R**essonância | Avatar se identifica? | | [quote VOC] |
| **M**emorabilidade | É fácil de lembrar? | | [nome proprietário] |
| **B**elievability | É crível/plausível? | | [prova/lógica] |
| **C**ompetitive | Diferente da concorrência? | | [comparação] |

### Score RMBC

| Score | Status |
|-------|--------|
| 4/4 | ✅ STAND |
| 3/4 | 🟡 REVISE (menor) |
| <3/4 | ❌ REFAZER |

---

## 3. VALIDAÇÃO MUS

### Espelho MUP ↔ MUS

| MUP (Problema) | MUS (Solução) | Espelha? |
|----------------|---------------|----------|
| [elemento 1] | [componente 1] | [ ] |
| [elemento 2] | [componente 2] | [ ] |
| [elemento 3] | [componente 3] | [ ] |

### Critérios de Validação

| Critério | ✓/✗ | Evidência |
|----------|-----|-----------|
| MUS resolve EXATAMENTE o MUP | | |
| Cada componente tem função clara | | |
| Nomenclatura é proprietária | | |
| Complexidade adequada ao ticket | | |

---

## 4. VALIDAÇÃO VOC

### Presença de Linguagem do Avatar

| Elemento | Presente? | Exemplo |
|----------|-----------|---------|
| Sinestesia emocional | [ ] | "[sensação específica]" |
| Expressões literais | [ ] | "[quote exata]" |
| Palavras-gatilho do nicho | [ ] | "[palavras]" |
| Tom de voz correto | [ ] | [autoridade/empático/casual] |

### Triangulação

| Quote | Fonte 1 | Fonte 2 | Fonte 3 | Peso |
|-------|---------|---------|---------|------|
| "[quote]" | [ ] | [ ] | [ ] | [1-3] |

> Quotes trianguladas (3 fontes) = peso máximo.

---

## 5. VALIDAÇÃO ESTRUTURAL

### Para VSL

| Bloco | Presente? | MUP Aparece? | Linguagem Avatar? |
|-------|-----------|--------------|-------------------|
| Hook | [ ] | [ ] | [ ] |
| Problema | [ ] | [ ] | [ ] |
| Vilão | [ ] | [ ] | [ ] |
| Mecanismo | [ ] | [ ] | [ ] |
| Prova | [ ] | [ ] | [ ] |
| Oferta | [ ] | [ ] | [ ] |
| CTA | [ ] | [ ] | [ ] |

### Para LP

| Bloco | Presente? | Função Clara? |
|-------|-----------|---------------|
| Headline | [ ] | [ ] |
| Problema | [ ] | [ ] |
| Mecanismo | [ ] | [ ] |
| Solução | [ ] | [ ] |
| Prova Social | [ ] | [ ] |
| Stack | [ ] | [ ] |
| Garantia | [ ] | [ ] |
| CTA (3x mínimo) | [ ] | [ ] |
| FAQ | [ ] | [ ] |

### Para Criativos

| Elemento | Presente? | Critério |
|----------|-----------|----------|
| Hook (0-3s) | [ ] | Para scroll |
| Loop aberto | [ ] | Cria curiosidade |
| Body progressivo | [ ] | Desenvolve interesse |
| CTA único | [ ] | Ação clara |
| 3+ variações | [ ] | Para teste |

### Para Emails

| Elemento | Presente? | Critério |
|----------|-----------|----------|
| Subject < 50 chars | [ ] | Deliverability |
| Preview complementar | [ ] | Não repete subject |
| Gancho na primeira linha | [ ] | Open → Read |
| CTA único por email | [ ] | Clareza |
| P.S. com reforço | [ ] | Último argumento |

---

## 6. ANTI-PATTERNS (Rejeitar se presente)

| Anti-Pattern | Detectado? | Correção |
|--------------|------------|----------|
| "A copy está boa" (impressão) | [ ] | Usar critérios RMBC |
| "Li o arquivo" (genérico) | [ ] | Extrair elemento específico |
| "Parece persuasivo" (vago) | [ ] | Verificar triangulação VOC |
| Linguagem de marketer | [ ] | Reescrever com VOC |
| MUP/MUS genéricos | [ ] | Renomear com nomenclatura proprietária |
| Vilão interno (culpa prospect) | [ ] | Externalizar para vilão |

---

## 7. TWO-MODEL VALIDATION

### Quando Usar

| Situação | Two-Model Obrigatório? |
|----------|------------------------|
| MUP/MUS críticos | ✅ Sim |
| One Belief | ✅ Sim |
| VSL completa | ✅ Sim |
| Criativo individual | ❌ Opcional |
| Email individual | ❌ Opcional |

### Configuração

| Papel | Modelo |
|-------|--------|
| **Produção** | Sonnet/Opus |
| **Crítica** | Opus (se Sonnet produziu) |

> **Regra:** Modelo crítico deve ser DIFERENTE do produtor.

---

## 8. COURTROOM MODEL (Para MUP/MUS)

### Papéis

| Papel | Função | Resultado |
|-------|--------|-----------|
| **Advocate** | Defende a proposta | Lista de forças |
| **Challenger** | Questiona pontos fracos | Lista de fraquezas |
| **Judge** | Avalia argumentos | STAND ou REVISE |

### Deliberação

**Argumentos do Advocate:**
1. [força 1]
2. [força 2]
3. [força 3]

**Argumentos do Challenger:**
1. [fraqueza 1]
2. [fraqueza 2]
3. [fraqueza 3]

**Veredicto do Judge:**
- [ ] STAND (forças superam fraquezas)
- [ ] REVISE (fraquezas críticas identificadas)

**Se REVISE, ações necessárias:**
1. [correção 1]
2. [correção 2]

---

## 9. SCORE FINAL

### Cálculo

| Seção | Peso | Score (0-10) | Ponderado |
|-------|------|--------------|-----------|
| Gate de Leitura | 20% | | |
| Validação MUP | 20% | | |
| Validação MUS | 15% | | |
| Validação VOC | 20% | | |
| Estrutural | 15% | | |
| Anti-Patterns | 10% | | |
| **TOTAL** | 100% | | **/10** |

### Interpretação

| Score | Status | Ação |
|-------|--------|------|
| 8-10 | ✅ STAND | Aprovado para entrega |
| 6-7.9 | 🟡 REVISE | Correções menores necessárias |
| <6 | ❌ REFAZER | Voltar ao briefing |

---

## 10. PRÓXIMOS PASSOS

### Se STAND
- [ ] Documentar validação no arquivo de produção
- [ ] Marcar como pronto para implementação
- [ ] Atualizar project_state.yaml

### Se REVISE
- [ ] Listar correções específicas
- [ ] Aplicar correções
- [ ] Rodar checklist novamente
- [ ] Repetir até STAND

### Se REFAZER
- [ ] Voltar à fase HELIX correspondente
- [ ] Revalidar MUP/MUS
- [ ] Produzir novamente do zero

---

*Checklist v6.0 - Baseado em CRITIC Framework (Pesquisa 6)*
*Criado em 2026-01-30*
