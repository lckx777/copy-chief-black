# Synthesis Flow Mnemonic (v1.0)

> Fonte: AIOS Framework (Alan Nicolas) — §4.7
> Adaptado: Copy Chief BLACK — Copywriting Direct Response
> Principio: 7 passos antes de criar qualquer componente novo no ecossistema.
> Criado: 2026-02-27

---

## REGRA CARDINAL

> **"Nao crie antes de verificar. Nao verifique antes de precisar."**
> Componentes novos sem passar por este fluxo = debt garantido.
> Cada componente adicionado custa manutencao, contexto e complexidade.

---

## O Mnemonico: 7 Passos

### 1. VERIFICAR — O que ja existe?

Antes de criar qualquer hook, rule, script, template ou schema:

```bash
# Buscar componentes similares
find ~/.claude -name "*[keyword]*" -type f
grep -r "[conceito]" ~/.claude/rules/ ~/.claude/hooks/ ~/.claude/scripts/
```

**Pergunta:** Alguem ja resolveu isso? Existe hook, rule ou script que faz algo parecido?

**Anti-Pattern:** Criar `new-validation-hook.ts` sem verificar que `validate-gate-prereq.ts` ja faz 80% do que precisa.

---

### 2. REUSAR — Posso usar algo existente?

Se encontrou algo similar no passo 1:

| Cenario | Acao |
|---------|------|
| Componente existente faz 80%+ do necessario | ESTENDER, nao criar novo |
| Componente existente faz 50-80% | AVALIAR: fork ou extend? |
| Componente existente faz <50% | Criar novo, mas referenciar o existente |
| Nada similar existe | Prosseguir para passo 3 |

**Pergunta:** Posso resolver com edits em vez de criacao?

**Anti-Pattern:** Criar `context-health-checker.ts` quando `context-tiering.ts` ja tem `getContextHealth()`.

---

### 3. PRECISAR — O que EXATAMENTE precisa ser criado?

Definir escopo ANTES de implementar:

```markdown
## Scope: [Nome do Componente]

**Problema que resolve:** [1 frase]
**Input:** [o que recebe]
**Output:** [o que produz]
**Integracoes:** [quais hooks/rules/scripts interage com]
**NAO faz:** [o que esta FORA do escopo]
```

**Pergunta:** Consigo explicar em 2 frases o que este componente faz e por que precisa existir?

**Anti-Pattern:** "Vou criar um script que faz varias coisas..." — se nao consegue precisar, nao esta pronto para criar.

---

### 4. SIMPLIFICAR — Qual a versao minima viavel?

Principio KISS aplicado:

| Complexidade | Acao |
|--------------|------|
| Pode ser resolvido com 1 funcao | NAO crie arquivo separado |
| Pode ser resolvido com 1 arquivo | NAO crie diretorio |
| Pode ser resolvido com config | NAO crie script |
| Pode ser resolvido com hook existente | NAO crie hook novo |

**Pergunta:** Qual e a versao mais simples que resolve o problema?

**Anti-Pattern:** Criar framework de 500 linhas para problema que resolve com 20 linhas em hook existente.

> Ref: aios-principles.md #11 (Regra do Over-Engineering) — 3 linhas duplicadas > 1 abstracao prematura.

---

### 5. PRESERVAR — O que nao pode ser perdido?

Antes de modificar componentes existentes:

- [ ] Funcionalidade atual continua funcionando?
- [ ] Hooks que dependem deste componente nao quebram?
- [ ] Estado persistente (helix-state.yaml, mecanismo-unico.yaml) nao e corrompido?
- [ ] Templates referenciados continuam validos?

**Pergunta:** Minha mudanca quebra algo que ja funciona?

**Anti-Pattern:** Refatorar `phase-advance-gate.ts` e quebrar 3 hooks que dependem dele.

> Ref: ceremony-detection.md — verificar dependencias antes de modificar/remover.

---

### 6. FOCAR — Uma coisa por vez.

Cada commit/edicao deve fazer UMA coisa:

| Errado | Correto |
|--------|---------|
| Criar hook + modificar 3 rules + update schema | Criar hook (commit 1), update rules (commit 2), update schema (commit 3) |
| "Refatorei tudo para ficar melhor" | "Adicionei campo X ao schema Y" |
| PR com 15 arquivos modificados | PR com 3-5 arquivos focados |

**Pergunta:** Se esta mudanca der errado, consigo reverter sem afetar outras coisas?

**Anti-Pattern:** "Aproveitei e tambem mudei..." — scope creep em edicoes.

> Ref: aios-principles.md #10 (Commits Atomicos) e #12 (So o que Foi Pedido).

---

### 7. SILENCIO — Parar quando terminar.

Apos implementar:

- [ ] Componente funciona conforme precisado no passo 3?
- [ ] Nada alem do necessario foi adicionado?
- [ ] Nenhum "bonus" ou "melhoria futura" foi incluido?

**Pergunta:** Terminei o que foi pedido. Devo parar ou ha mais a fazer?

Se a resposta for "poderia tambem fazer X..." — PARE. X e outra task.

**Anti-Pattern:** "Ja que estou aqui, vou tambem..." — feature creep pos-implementacao.

> Ref: aios-principles.md #12 (So o que Foi Pedido) — Feature nao solicitada e debito, nao credito.

---

## Aplicacao Pratica

### Antes de Criar Hook

```
1. VERIFICAR: grep -r "[funcionalidade]" ~/.claude/hooks/
2. REUSAR: Hook existente pode ser estendido?
3. PRECISAR: Evento (Pre/Post), trigger, acao
4. SIMPLIFICAR: Precisa de arquivo proprio ou cabe em hook existente?
5. PRESERVAR: Hooks dependentes continuam ok?
6. FOCAR: 1 hook = 1 funcao
7. SILENCIO: Registrar em settings.json e parar
```

### Antes de Criar Rule

```
1. VERIFICAR: ls ~/.claude/rules/ | grep "[tema]"
2. REUSAR: Rule existente cobre? Pode consolidar?
3. PRECISAR: Fase(s), tokens estimados, prioridade
4. SIMPLIFICAR: Precisa de rule separada ou cabe em existente?
5. PRESERVAR: synapse-manifest.yaml atualizado?
6. FOCAR: 1 rule = 1 tema
7. SILENCIO: Registrar em synapse-manifest e parar
```

### Antes de Criar Script

```
1. VERIFICAR: ls ~/copywriting-ecosystem/scripts/ | grep "[funcao]"
2. REUSAR: Script existente pode ser parametrizado?
3. PRECISAR: CLI interface, input/output, dependencias
4. SIMPLIFICAR: Script ou funcao em lib existente?
5. PRESERVAR: Daemon scheduler precisa atualizar?
6. FOCAR: 1 script = 1 funcao
7. SILENCIO: Documentar CLI e parar
```

---

## Checklist Rapido (Copiar e Usar)

Antes de criar qualquer componente:

- [ ] VERIFICAR: Busquei por componentes similares existentes?
- [ ] REUSAR: Descartei opcao de estender existente?
- [ ] PRECISAR: Escopo definido em 2 frases?
- [ ] SIMPLIFICAR: Esta e a versao mais simples possivel?
- [ ] PRESERVAR: Nada existente quebra com esta mudanca?
- [ ] FOCAR: Mudanca faz UMA coisa?
- [ ] SILENCIO: Parei quando terminou?

---

*v1.0 — AIOS §4.7 Synthesis Flow adaptado para Copy Chief BLACK*
*Mnemonico: VERIFICAR → REUSAR → PRECISAR → SIMPLIFICAR → PRESERVAR → FOCAR → SILENCIO*
*Ref: aios-principles.md #26, constitution.md § Regras Operacionais*
*Criado: 2026-02-27*
