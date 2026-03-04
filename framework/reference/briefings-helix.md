---
phases: [BRIEFING]
paths:
  - "briefings/**/*.md"
  - "**/briefings/**/*.md"
priority: HIGH
tokens: ~900
---

# HELIX Briefing Rules

> Regras específicas para contexto de briefings HELIX.
> Só carrega quando trabalhando em arquivos briefings/**/*.md

## Fases HELIX (Ordem Obrigatória)

| Fase | Conteúdo | Dependências |
|------|----------|--------------|
| 1 | Discovery | - |
| 2 | Ads Library Spy | - |
| 3 | Avatar Profundo | VOC + Competitors |
| 4 | DRE | Research synthesis |
| 5 | MUP | Avatar + DRE |
| 6 | MUS | MUP |
| 7 | One Belief | MUP + MUS |
| 8 | CRO | One Belief |
| 9 | NUUPPECC Leads | Avatar + MUP |
| 10 | Horror Stories | Avatar |

## Formato de Fase

Cada fase deve seguir o template:

```markdown
# HELIX Fase X: [Nome]

## Objetivo
[O que esta fase descobre/define]

## Inputs Necessários
- [Arquivos de research]
- [Fases anteriores]

## Output
[Conteúdo da fase]

## Validação
- [ ] Elemento A definido
- [ ] Elemento B definido
- [ ] Consistente com fases anteriores
```

## Constraints

- NUNCA pular fases ou criar fora de ordem
- SEMPRE validar inputs antes de preencher
- SEMPRE manter referências cruzadas entre fases

---

## Extended Thinking Bifásica (Pesquisa Externa 01)

> **Descoberta crítica:** Extended Thinking é ANALÍTICO, não criativo.
> Pode PREJUDICAR criatividade em até 36% quando mal aplicado.
> **v6.4:** Adaptado para Subscription Max 20x

### Contexto de Uso (Subscription)

| Ambiente | Como Ativar ET | Como Desativar |
|----------|----------------|----------------|
| **CLI** | `Option+T` (Mac) | `Option+T` novamente |
| **Web** | Toggle na interface | Toggle novamente |

### Abordagem Bifásica (OBRIGATÓRIA)

| Fase | Extended Thinking | Por quê |
|------|-------------------|---------|
| **Análise** | ✅ ON (Option+T) | Estruturação, avaliação, síntese |
| **Criação** | ❌ OFF | Geração divergente, ideação, copy |

### Tabela de Decisão por Fase HELIX

| Fase | Tipo | Extended Thinking | Como Ativar |
|------|------|-------------------|-------------|
| 1-2 | Análise | ✅ ON | Option+T |
| 3-4 | Psicologia profunda | ✅ ON | Option+T |
| 5 | MUP Discovery | ✅ ON → ❌ OFF | Bifásico (alternar com Option+T) |
| 6 | MUS Discovery | ✅ ON → ❌ OFF | Bifásico (alternar com Option+T) |
| 7 | One Belief | ✅ ON (síntese) | Option+T |
| 8-10 | Execução | ❌ OFF | Desativar |

### Complexidade vs Recomendação

| Complexidade | Recomendação |
|--------------|--------------|
| Raciocínio simples | ET OFF (desnecessário) |
| Média complexidade | ET ON |
| Análise complexa (HELIX 1-7) | ET ON |
| Produção criativa (HELIX 8-10) | ET OFF |

> **Nota:** Em subscription, o "budget" é automático. O princípio de retornos decrescentes ainda se aplica conceitualmente.

### Modelo por Tarefa

| Tarefa | Modelo | Extended Thinking |
|--------|--------|-------------------|
| Brainstorming estruturado | Sonnet 4.5 | ON (planning) → OFF (ideação) |
| Copywriting/headlines | Sonnet 4.5 | ❌ OFF |
| Análise de brief complexo | Opus 4.5 | ✅ ON |
| Big ideas | Sonnet 4.5 | ❌ OFF |
| Avaliação de conceitos | Opus 4.5 | ✅ ON |
| Volume de variações | Haiku 4.5 | ❌ OFF |

### Prompting Eficaz vs Ineficaz

**INEFICAZ (over-prescriptivo):**
```
Pense neste problema passo a passo:
1. Primeiro, identifique as variáveis
2. Depois, configure a equação
```

**EFICAZ (high-level):**
```
Pense sobre este problema de copywriting em grande profundidade.
Considere múltiplas abordagens e mostre seu raciocínio completo.
Tente métodos diferentes se sua primeira abordagem não funcionar.
```

---

## Divergent-Convergent Phases (Pesquisa 2)

### Modelo de Raciocínio por Fase

| Tipo | Fases | Comportamento |
|------|-------|---------------|
| **Divergente** | 1-4 | Explorar opções, múltiplas hipóteses |
| **Convergente** | 5-7 | Decidir MUP/MUS, fechar direção |
| **Executivo** | 8-10 | Aplicar decisões, produzir outputs |

### Calibração de Raciocínio

**Fases 1-4 (Divergente):**
- Fazer muitas perguntas
- Explorar ângulos alternativos
- Não fechar decisões cedo demais

**Fases 5-7 (Convergente):**
- Avaliar opções com critérios RMBC
- Decidir e documentar
- Validar com copy-critic

**Fases 8-10 (Executivo):**
- Seguir briefing definido
- Foco em qualidade de execução
- Não re-abrir decisões estratégicas

---

*v6.4 - Adaptado para Subscription Max 20x (Option+T em vez de trigger words)*
*Atualizado: 2026-01-31*
