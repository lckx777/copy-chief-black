# Hooks Guide - Ecossistema v4.9.6

> Guia completo de automações que executam em eventos de sessão Claude Code.
> **Atualizado:** 2026-01-26

---

## Visão Geral

| Hook | Trigger | Função | Timeout |
|------|---------|--------|---------|
| **session-start.ts** | SessionStart | Injeta session primer com contexto temporal | 5s |
| **user-prompt.ts** | UserPromptSubmit | Copy Chief + Skill Auto-Invoke + Research Gate | 5s |
| **curation.ts** | PreCompact, SessionEnd | Cura memórias antes de compactar contexto | 5s |
| **post-tool-use.ts** | PostToolUse | Rastreia leituras e Sequential Thinking | Sync |
| **pre-tool-use-gate.ts** | PreToolUse | Gate de qualidade para operações de escrita | Sync |

### Bibliotecas de Suporte

| Arquivo | Função |
|---------|--------|
| `lib/session-state.ts` | Gerenciamento de estado da sessão (arquivos lidos, metodologia, depth) |
| `lib/skill-triggers.ts` | Detecção de triggers para auto-invoke de skills |

---

## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────────┐
│                      INÍCIO DA SESSÃO                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     session-start.ts          │
              │  - Injeta session primer      │
              │  - Carrega contexto temporal  │
              │  - Registra início de sessão  │
              └───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PROMPT DO USUÁRIO                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     user-prompt.ts            │
              │                               │
              │  GATE #1: Skill Detection     │
              │  - Detecta triggers de skills │
              │  - Injeta skill obrigatória   │
              │                               │
              │  GATE #2: Research Gate       │
              │  - Se briefing trigger        │
              │  - Valida research completo   │
              │                               │
              │  GATE #3: Copy Chief          │
              │  - Detecta tipo de copy       │
              │  - Injeta arquivos requeridos │
              │  - Injeta gold standards      │
              │                               │
              │  + Memórias relevantes        │
              └───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USO DE FERRAMENTA                          │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
     ┌─────────────────┐             ┌─────────────────┐
     │   LEITURA       │             │   ESCRITA       │
     │   (Read, View)  │             │   (Write, Edit) │
     │                 │             │                 │
     │   SEMPRE        │             │   GATED         │
     │   PERMITIDO     │             │   (verificar)   │
     └─────────────────┘             └────────┬────────┘
              │                               │
              │                               ▼
              │                ┌───────────────────────────┐
              │                │  pre-tool-use-gate.ts     │
              │                │                           │
              │                │  Verifica:                │
              │                │  1. É arquivo de copy?    │
              │                │  2. Metodologia lida?     │
              │                │  3. Reasoning depth ≥60%? │
              │                │  4. Sequential Thinking?  │
              │                │                           │
              │                │  allow | deny             │
              │                └───────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     post-tool-use.ts          │
              │  - Registra arquivo lido      │
              │  - Atualiza reasoning depth   │
              │  - Detecta Sequential Thinking│
              │  - Detecta criação de plano   │
              └───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               COMPACTAÇÃO / FIM DE SESSÃO                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     curation.ts               │
              │  - Cura memórias importantes  │
              │  - Envia para memory server   │
              │  - Preserva antes de compact  │
              └───────────────────────────────┘
```

---

## 1. session-start.ts

### Função
Injeta contexto temporal no início de cada sessão, conectando com sessões anteriores.

### Trigger
- `SessionStart` (startup ou resume)

### O que faz
1. Lê input da sessão (session_id, cwd)
2. Consulta memory server para session primer
3. Registra início de sessão
4. Injeta primer no contexto

### Dados Injetados
- Quando foi a última sessão
- O que estava sendo trabalhado
- Status do projeto
- Memórias recentes relevantes

### Configuração
```typescript
const MEMORY_API_URL = process.env.MEMORY_API_URL || 'http://localhost:8765'
const TIMEOUT_MS = 5000
```

### Fail-Safe
Se memory server não estiver disponível, hook completa silenciosamente sem injetar nada.

---

## 2. user-prompt.ts

### Função
Hook mais complexo: executa 3 gates de enforcement antes de cada prompt do usuário.

### Trigger
- `UserPromptSubmit`

### Gates

#### Gate #1: Skill Auto-Invoke
Detecta triggers e exige uso de skill especializada.

**Triggers mapeados:**
| Skill | Triggers |
|-------|----------|
| audience-research-agent | pesquisa público, VOC, avatar, dores |
| voc-research-agent | extrair comentários, Apify, quotes viral |
| helix-system-agent | helix, briefing, fases, MUP, MUS |
| criativos-agent | criativo, hook, anúncio, ads |
| landing-page-agent | landing page, LP, página vendas |
| copy-critic | validar, criticar, stress-test, STAND |
| fragment-agent | fragmentar, dividir, RAG |
| ai-setup-architect | criar prompt, setup IA, arquitetar |

**Exceções (bypass):**
- "não use skill"
- "faça manualmente"
- "manual"
- "bypass"

#### Gate #2: Research Gate
Se detecta trigger de briefing (helix, fases 4-10), valida research completo.

```bash
python3 ~/.claude/scripts/validate-gate.py RESEARCH ~/copywriting-ecosystem/{offer}
```

Se BLOCKED → injeta lista de deliverables faltantes.

#### Gate #3: Copy Chief Enforcement
Detecta tipo de copy e injeta arquivos obrigatórios.

**Categorias detectadas:**
| Categoria | Triggers | Arquivos Injetados |
|-----------|----------|-------------------|
| MUP | mup, vilao, problema, fase 5 | briefing_fase05_*.md, principios_fundamentais.md |
| MUS | mus, mecanismo, solução, fase 6 | briefing_fase06_*.md, puzzle_pieces.md |
| Headlines | headline, hook, gancho, fase 9 | briefing_fase09_*.md, angulos-hooks.md |
| Criativos | criativo, anúncio, ads | estrutura-criativos.md, frameworks/ |
| VSL | vsl, script | briefing_fase10_*.md, briefing_fase08_*.md |
| Landing Page | lp, página de vendas | landing-page-agent/SKILL.md |
| Avatar | avatar, dre, psicologia, fase 3 | briefing_fase03_*.md, psicologia_engenheiro.md |
| Pitch | pitch, cta, fase 8 | briefing_fase08_*.md |
| Offer | big offer, stack, bonus, fase 7 | briefing_fase07_*.md |
| Validation | validar, rmbc, copy-critic | copy-critic/SKILL.md, formulas_e_criterios.md |

**Checklist Injetado:**
```markdown
**Promessa Canônica:** [Identificar]
**Framework Aplicado:** [Qual metodologia]
**Arquivos Lidos:** [Listar]

**Validação:**
- [ ] Promessa é OUTCOME, não FEATURE?
- [ ] Linguagem é do AVATAR (VOC)?
- [ ] Mecanismo tem 4 Camadas?
- [ ] Atinge nível do Gold Standard?
- [ ] Passa no teste "mostra, não conta"?
```

---

## 3. curation.ts

### Função
Cura memórias importantes antes de perder contexto.

### Triggers
- `PreCompact` (contexto sendo compactado)
- `SessionEnd` (sessão terminando)

### O que faz
1. Detecta tipo de trigger (compact vs end)
2. Envia checkpoint para memory server
3. Memory server processa observações importantes
4. Armazena para sessões futuras

### Configuração
```typescript
const MEMORY_API_URL = process.env.MEMORY_API_URL || 'http://localhost:8765'
```

### Output
- `🧠 Curating memories (PreCompact)...` no stderr
- `✨ Memory curation started` se sucesso
- `⚠️ Memory server not available` se falha

---

## 4. post-tool-use.ts

### Função
Rastreia uso de ferramentas para alimentar gates de qualidade.

### Trigger
- `PostToolUse` (após qualquer uso de ferramenta)

### O que rastreia

#### Leituras de Arquivo
```typescript
if (['Read', 'View', 'Cat'].includes(toolName)) {
  recordFileRead(filePath);
}
```

#### Criação de Plano
```typescript
if (['Write', 'Edit'].includes(toolName)) {
  if (/PLAN|OUTLINE|STRATEGY/i.test(filePath)) {
    markPlanCreated();
  }
}
```

#### Sequential Thinking
```typescript
if (toolName.includes('sequential-thinking')) {
  recordSequentialThinking();
}
```

### State Persistence
Estado salvo em: `~/.claude/session-state/current-session.json`

```typescript
interface SessionState {
  sessionId: string;
  startedAt: string;
  filesRead: string[];
  methodologyLoaded: boolean;
  frameworksConsulted: string[];
  reasoningDepth: number;      // 0.0 - 1.0
  planCreated: boolean;
  sequentialThinkingUsed: boolean;
  lastActivity: string;
}
```

### Reasoning Depth Calculation
- Arquivo de fundamentos: +0.25
- Arquivo de metodologia: +0.15
- Sequential Thinking: +0.20
- Máximo: 1.0

---

## 5. pre-tool-use-gate.ts

### Função
Gate de qualidade que pode BLOQUEAR operações de escrita.

### Trigger
- `PreToolUse` (antes de usar ferramenta)

### Ferramentas Gated
```typescript
const GATED_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'];
```

### Ferramentas Sempre Permitidas
```typescript
const ALWAYS_ALLOWED = ['Read', 'View', 'Cat', 'Glob', 'Grep', 'LS', 'Bash', 'Task', 'WebSearch', 'WebFetch'];
```

### Arquivos Isentos (MACRO Pattern)
Detecta automaticamente por padrão, não lista hardcoded:

```typescript
const EXEMPT_PATTERNS = [
  /PLAN/i, /OUTLINE/i, /NOTES/i, /TODO/i, /STRATEGY/i,
  /\.json$/i, /\.yml$/i, /\.yaml$/i, /\.ts$/i, /\.sh$/i,
  /CHANGELOG/i, /CLAUDE\.md$/i, /RUNBOOK/i, /GUIA/i, /README/i,
  /ecosystem-status/i, /\.version$/i, /SKILL\.md$/i,
  /\.claude\//i, /scripts\//i, /hooks\//i, /templates\//i, /logs\//i,
  /research\//i, /briefings\//i, /findings/i, /progress/i, /task_plan/i,
];
```

### Gates de Qualidade (sequencial)

#### Gate 1: Metodologia
```
Se não leu metodologia → BLOCK
"🚫 BLOQUEADO - METODOLOGIA NÃO CONSULTADA"
```

#### Gate 2: Profundidade
```
Se reasoningDepth < 60% → BLOCK
"🧠 BLOQUEADO - PROFUNDIDADE INSUFICIENTE"
```

#### Gate 3: Sequential Thinking
```
Se não usou Sequential Thinking → BLOCK
"🧠 BLOQUEADO - SEQUENTIAL THINKING NÃO USADO"
```

### Output Format (Jan/2026)
```typescript
interface PreToolUseOutput {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse';
    permissionDecision: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
  };
}
```

---

## Bibliotecas de Suporte

### lib/session-state.ts

Gerencia estado persistente da sessão.

**Funções exportadas:**
| Função | Descrição |
|--------|-----------|
| `getSessionState()` | Retorna estado atual (ou cria novo) |
| `saveSessionState(state)` | Persiste estado em arquivo |
| `recordFileRead(path)` | Registra leitura e atualiza depth |
| `hasReadMethodology()` | Verifica se metodologia foi lida |
| `hasMinimumReasoningDepth(threshold)` | Verifica depth mínimo |
| `markPlanCreated()` | Marca que plano foi criado |
| `recordSequentialThinking()` | Marca uso de Sequential Thinking |
| `hasUsedSequentialThinking()` | Verifica uso de ST |
| `getRequiredReadings(taskType)` | Retorna leituras obrigatórias |

**Expiração de sessão:** 2 horas de inatividade

### lib/skill-triggers.ts

Detecta triggers para auto-invoke de skills.

**Funções exportadas:**
| Função | Descrição |
|--------|-----------|
| `detectRequiredSkill(prompt)` | Retorna skill obrigatória ou null |
| `hasSkillException(prompt)` | Verifica se há bypass |
| `isBriefingTrigger(prompt)` | Verifica se é trigger de briefing |
| `extractOfferFromPrompt(prompt)` | Extrai nome da oferta |

---

## Configuração em settings.json

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "bun run ~/.claude/hooks/session-start.ts"
      }
    ],
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "bun run ~/.claude/hooks/user-prompt.ts"
      }
    ],
    "PreCompact": [
      {
        "type": "command",
        "command": "bun run ~/.claude/hooks/curation.ts"
      }
    ],
    "PostToolUse": [
      {
        "type": "command",
        "command": "bun run ~/.claude/hooks/post-tool-use.ts"
      }
    ],
    "PreToolUse": [
      {
        "type": "command",
        "command": "bun run ~/.claude/hooks/pre-tool-use-gate.ts"
      }
    ]
  }
}
```

---

## Troubleshooting

### Hook não executa

```bash
# Verificar se bun está instalado
which bun

# Verificar sintaxe do hook
bun build ~/.claude/hooks/session-start.ts

# Verificar permissões
ls -la ~/.claude/hooks/
```

### Gate bloqueando indevidamente

```bash
# Ver estado atual da sessão
cat ~/.claude/session-state/current-session.json

# Resetar sessão
rm ~/.claude/session-state/current-session.json
```

### Memory server não disponível

```bash
# Verificar se está rodando
curl http://localhost:8765/health

# Hooks funcionam sem memory server (fail-open)
```

### Sequential Thinking gate

Se bloqueando por Sequential Thinking:
1. Use `mcp__sequential-thinking__sequentialthinking` antes de escrever
2. Ou escreva em arquivo EXEMPT (research/, briefings/, .json, .yaml)

---

## Boas Práticas

### 1. Respeitar os Gates
Os gates existem para garantir qualidade. Não tente burlar - eles protegem contra copy genérica.

### 2. Carregar Metodologia Primeiro
Sempre leia arquivos de metodologia antes de produzir copy:
```
Read skills/helix-system-agent/SKILL.md
Read skills/helix-system-agent/references/fundamentos/principios_fundamentais.md
```

### 3. Usar Sequential Thinking
Para copy de produção, sempre usar raciocínio estruturado primeiro.

### 4. Atualizar Session State
Se precisar resetar gates: `rm ~/.claude/session-state/current-session.json`

---

*Last updated: 2026-01-26 | Ecosystem v4.9.6*
