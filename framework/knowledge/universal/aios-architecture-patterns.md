# AIOS Core — Architecture Patterns for Copy Chief BLACK

> Curado de: github.com/SynkraAI/aios-core (ingested 2026-03-03)
> Foco: Patterns reusaveis e deltas vs nosso fork
> Classificacao: UNIVERSAL

---

## 1. Synapse Engine (8-Layer Context Injection)

### Arquitetura
Engine processa prompts em pipeline de 8 camadas sequenciais.
Cada camada herda de `LayerProcessor` (abstract base com `_safeProcess()` wrapper).

| Layer | Nome | Trigger | Timeout | Bracket |
|-------|------|---------|---------|---------|
| L0 | Constitution | ALWAYS_ON | 5ms | ALL |
| L1 | Global | ALWAYS_ON | 10ms | ALL |
| L2 | Agent | session.active_agent.id | 15ms | MOD+ |
| L3 | Workflow | session.active_workflow.id | 15ms | MOD+ |
| L4 | Task | session.active_task.id | 20ms | MOD+ |
| L5 | Squad | squads/ discovery | 20ms | MOD+ |
| L6 | Keyword | prompt keyword match | 15ms | ALL |
| L7 | Star-Command | *command regex | 5ms | ALL |

### Bracket System (Context-Aware Budgets)
| Bracket | Context % | Token Budget | Active Layers |
|---------|-----------|-------------|---------------|
| FRESH | 60-100% | 800 | [0,1,2,6,7] |
| MODERATE | 40-60% | 1500 | [0-7] |
| DEPLETED | 25-40% | 2000 | [0-7] + memory |
| CRITICAL | 0-25% | 2500 | [0-7] + memory + handoff |

### Output Format
XML `<synapse-rules>` com secoes ordenadas:
1. CONTEXT_BRACKET (always first)
2. CONSTITUTION (protected, never truncated)
3. AGENT (protected, never truncated)
4. WORKFLOW, TASK, SQUAD, KEYWORD
5. MEMORY_HINTS (DEPLETED/CRITICAL only)
6. STAR_COMMANDS, HANDOFF_WARNING
7. SUMMARY (always last, first to truncate)

### Manifest Format (.synapse/manifest)
```
{DOMAIN}_STATE=active|inactive
{DOMAIN}_ALWAYS_ON=true|false
{DOMAIN}_NON_NEGOTIABLE=true|false
{DOMAIN}_AGENT_TRIGGER=agent_id
{DOMAIN}_WORKFLOW_TRIGGER=workflow_id
{DOMAIN}_RECALL=keyword1,keyword2
{DOMAIN}_EXCLUDE=keyword1,keyword2
```

### Design Principles
- Pipeline hard timeout: 100ms total
- Graceful degradation: missing files = skip, no error
- Token budget enforcement via truncation (remove from end, protect constitution+agent)
- Metrics persisted to .synapse/metrics/hook-metrics.json

---

## 2. Agent System (12 Personas)

### Frontmatter Schema
```yaml
agent:
  name: "Human-readable name"
  id: "agent-id"
  title: "Role description"
  icon: "emoji"
  aliases: ["alt names"]
  whenToUse: "Task categories"
persona:
  role: "Professional role"
  style: "Decision-making style"
  identity: "Multi-line philosophy"
commands:
  - name: "cmd", description: "what it does"
dependencies:
  data: ["path/to/files"]
```

### 4-Tier Activation Pipeline
| Tier | O que Carrega | Fallback | Timing |
|------|--------------|----------|--------|
| 1 (FATAL) | Agent persona + frontmatter | ABORT | 5-50ms |
| 2 (GRACEFUL) | Shared craft data (dependencies.data) | warn+skip | 50-200ms |
| 2.5 (GRACEFUL) | Agent memory (episodic, execution-log) | skip | 20-100ms |
| 3 (GRACEFUL) | Offer context (CONTEXT.md, helix-state) | warn+skip | 100-300ms |

### Authority Hierarchy
```
TIER 1 EXECUTIVE: Helix (orchestrate), Ops (destructive), Strategist (business)
TIER 2 RESEARCH: Vox (VOC), Cipher (ads spy)
TIER 3 PRODUCTION: Atlas (briefing), Echo/Forge/Scout/Blade (copy)
TIER 4 VALIDATION: Hawk (review), Sentinel (gates)
```

### Hard Blocks (agent-authority-gate.cjs)
- `git push`, `git reset --hard`, `rm -rf` → ONLY @ops
- Multi-agent safe: ANY active agent is ops → allow (SET pattern)
- Fail-open: parse failure → allow

### Handoff Protocol
```yaml
handoff:
  id: "handoff-{ts}-{from}-{to}"
  from_agent, to_agent, offer_path
  artifacts: [{path, required, exists}]
  context: {confidence, gate_passed, scores}
  receiving_checklist: ["verify X", "check Y"]
  validation: {all_required_present, missing}
```

Chaining map: vox→atlas, atlas→echo, echo/forge/scout/blade→hawk, hawk→sentinel

### Agent Memory (3-File Architecture)
Per agent em `~/.claude/agent-memory/{agentId}/`:
- **episodic.yaml** (cap 50) — task learnings
- **execution-log.yaml** (cap 30) — run history
- **technique-register.yaml** (cap 20) — reusable patterns
- **_index.yaml** — cross-agent index for semantic search

---

## 3. Quality Gates (3-Layer Pipeline)

### Layer 1: Tool Enforcement
Verifica uso de MCP tools obrigatorias por fase:
- research: firecrawl + voc_search (MANDATORY)
- briefing: get_phase_context (MANDATORY)
- production: blind_critic + EST (MANDATORY)

### Layer 2: Quality Scores
| Tool | Threshold | Fase |
|------|-----------|------|
| blind_critic | >= 8/10 | production |
| emotional_stress_test | >= 8/10 | production |
| black_validation | >= 8/10 | delivery |
| genericidade_score | >= 8/10 | production |

### Layer 3: Human Review
- Production: mecanismo state = VALIDATED/APPROVED
- Delivery: human_approved = true

### Weighted Gates (5 Criterios, 0-100)
**Research Gate:**
1. VOC Depth (30%) — 50+ quotes/platform = 10
2. Competitor Analysis (25%) — 5+ competitors = 10
3. Mechanism Discovery (20%) — sexy_cause + new_cause = 10
4. Avatar Definition (20%) — DRE + Escalada + Segments = 10
5. Structure Compliance (5%) — 4/4 dirs = 10

Verdicts: >=85 PASSED, 70-84 NEEDS_REVIEW, <70 FAILED

**Production Gate:**
1. Emotional Impact (30%) — blind_critic avg
2. Specificity (25%) — data markers per 1K words
3. MUP/MUS Alignment (20%) — gimmick+sexy_cause+authority
4. Anti-Homog (20%) — cliche count
5. Formatting (5%) — template header

### Gate Auto-Advance
Phase order: idle → research → briefing → production → delivered
Trigger: PostToolUse from validate_gate/black_validation
Guard: mecanismo must be VALIDATED/APPROVED before production

---

## 4. Hook Architecture (Event-Driven OS Layer)

### Thin Wrapper Pattern
```javascript
const context = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const { Module } = require(HOME + '/.aios-core/copy-chief/module');
const result = new Module().doWork(context);
process.stdout.write(JSON.stringify({
  hookSpecificOutput: { additionalContext: result }
}));
process.exit(0); // ALWAYS succeed (fail-open)
```

### Key Events por Funcao
| Funcao | Evento | Hook Critico |
|--------|--------|-------------|
| Routing | SessionStart | helix-orchestrator-boot.cjs |
| Context | UserPromptSubmit | synapse-engine.cjs |
| Auto-dispatch | UserPromptSubmit | pipeline-intent-detector.cjs |
| Authority | PreToolUse:Bash | agent-authority-gate.cjs |
| Circuit breaker | Pre/Post/Failure | mcp-circuit-breaker-hook.cjs |
| Agent loading | SubagentStart | agent-activation-hook.cjs |
| Chaining | SubagentStop | handoff-validator-hook.cjs |
| Enforce dispatch | Stop | pipeline-enforcer.cjs |
| Memory | PostToolUse:MCP | agent-state-recorder.cjs |
| Session save | PreCompact | plan-session-guard.cjs |

### Safety Patterns
1. **Fail-open:** Exceptions never block Claude
2. **Atomic writes:** temp file + rename
3. **TTL markers:** 1-min expiry prevents infinite loops
4. **Active agent SET:** JSON object (not single marker) for parallel safety
5. **Sync I/O only:** No async waits under hook budgets (<5s)
6. **Graceful parse:** Invalid JSON → empty context, continue

### Dispatch Queue System
```yaml
queue:
  - id: dispatch-001
    agent_id: echo, model: opus
    parallel_group: "phase-produce-vsl"
    status: pending|dispatched|completed|failed
    expected_outputs: ["production/vsl/chapter-*.md"]
    source: pipeline|chaining|delegation
```

Flow: Intent detector → queue → enforcer blocks → Claude dispatches → activation → handoff → chain next

### Circuit Breaker (Per-Tool)
States: CLOSED → (5 failures) → OPEN → (60s) → HALF_OPEN → (1 probe) → CLOSED/OPEN
Protected: 20 MCP tools (copywriting, firecrawl, zen, fb_ad_library, apify)
Non-blocking: warnings only (fail-open)

---

## 5. AIOS Constitution (6 Principles)

| # | Principio | Severidade | Regra Core |
|---|-----------|-----------|------------|
| I | CLI First | NON-NEGOTIABLE | CLI > Observability > UI |
| II | Agent Authority | NON-NEGOTIABLE | Cada agente tem autoridades exclusivas |
| III | Story-Driven | MUST | Todo dev comeca com story |
| IV | No Invention | MUST | Specs derivam de requisitos, nao inventam |
| V | Quality First | MUST | lint + typecheck + test + build passam |
| VI | Absolute Imports | SHOULD | Sempre @/ nunca ../../ |

Gate Severity: BLOCK (NON-NEGOTIABLE), WARN (MUST), INFO (SHOULD)

---

## 6. Config System

### core-config.yaml
```yaml
project:
  type: EXISTING_AIOS
  version: 2.1.0
slashPrefix: AIOS
dataLocation: .aios-core/data
ide:
  selected: [claude-code, cursor, codex, gemini, vscode]
mcp:
  enabled: true
  docker_mcp:
    gateway: {transport: http, url: localhost:8080/mcp}
    presets: {minimal: [context7,desktop-commander,playwright], full: +exa}
```

### Framework vs Project Boundary (4 Layers)
| Layer | Mutabilidade | Exemplos |
|-------|-------------|----------|
| L1 Core | NEVER | .aios-core/core/, constitution.md |
| L2 Templates | NEVER (extend-only) | tasks/, templates/, checklists/ |
| L3 Config | Mutable (exceptions) | data/, MEMORY.md, core-config.yaml |
| L4 Runtime | ALWAYS | stories/, packages/, squads/, tests/ |

---

## 7. Upstream AIOS Patterns NAO no Nosso Fork

### 7.1 Squad System (Domain Expansion)
AIOS permite criar squads para qualquer dominio (nao apenas dev):
- `squads/` dir com agents, tasks, workflows, data
- Squad creator agent com mind cloning (Voice DNA + Thinking DNA)
- L5 Synapse layer auto-descobre squads e injeta regras

**Delta vs nosso fork:** Temos `squads/copy-chief/` mas nao usamos o squad creator workflow.

### 7.2 Story-Driven Development
Ciclo: @po cria story → @sm detalha → @dev implementa → @qa valida → @devops push
Stories em `docs/stories/` com checkboxes + file list + acceptance criteria.

**Delta vs nosso fork:** Nosso "story" e mais solto. AIOS tem enforcement formal via gate.

### 7.3 Template Processing System
Templates YAML com embedded LLM instructions:
- `{{placeholders}}` para substituicao
- `[[LLM: instructions]]` para diretivas AI
- `template-format.md` define a spec
- `create-doc.md` orquestra geracao

**Delta vs nosso fork:** Usamos YAML puro (helix-state, mecanismo-unico). Templates AIOS sao mais ricos para doc generation.

### 7.4 Doctor/Health System
Modular check system em `.aios-core/core/doctor/checks/`:
- agent-memory, entity-registry, commands-count, npm-packages, hooks-count, skills-count, core-config

**Delta vs nosso fork:** Temos health-check.ts mas nao e modular. AIOS pattern e mais extensivel.

### 7.5 Workflow Intelligence
Arquivo `workflow-intelligence/` com orquestracao de pipelines.
Workflows como YAML com fases, agents envolvidos, artifacts esperados, condicoes de transicao.

**Delta vs nosso fork:** Temos workflows como YAML implicito (helix-state). AIOS formaliza como spec executavel.

### 7.6 Multi-IDE Sync
Parity entre Claude Code, Cursor, Gemini CLI, Codex CLI.
Scripts `sync:ide` mantêm agents/rules sincronizados entre IDEs.
Cada IDE tem adapter diferente (.cursor/rules, .gemini/rules, .codex/skills, .claude/agents).

**Delta vs nosso fork:** Somos Claude Code-only. Pattern util se expandirmos.

### 7.7 Manifest Generator + Validator
`.aios-core/core/manifest/` — gera e valida manifests de agentes/squads.
Garante dependencias resolvidas, estrutura correta, versionamento.

**Delta vs nosso fork:** Nao temos manifest validation formal. Nosso manifest e .synapse/manifest puro.

---

## 8. Patterns para Incorporar (Prioridade)

### P1 — Alta Prioridade
1. **Doctor modular** — Cada check como modulo isolado (agent-memory.js, entity-registry.js, etc.). Extensivel com `checks/*.js` pattern.
2. **Template YAML enriched** — `[[LLM: instruction]]` blocks para templates de production. Separacao clean entre instructions e output.
3. **Manifest validation** — Validar .synapse/manifest na inicializacao. Detectar domains declarados sem arquivo, arquivos sem manifest entry.

### P2 — Media Prioridade
4. **Squad creator workflow** — Formalizar criacao de novos squads (para quando expandir alem de copy-chief).
5. **Story enforcement formal** — Gate que bloqueia production/ writes sem story.md referenciada.
6. **Workflow YAML spec** — Formalizar production-pipeline, research-pipeline como YAML executaveis com fases, agents, artifacts.

### P3 — Futura
7. **Multi-IDE sync** — Se expandir para Cursor/Gemini.
8. **Web builder** — Bundle agents em .txt para web UI (ChatGPT/Gemini).
9. **Elicitation system** — Advanced prompting para document creation (10 brainstorming actions).

---

*Curado por Copy Chief BLACK. Fonte: SynkraAI/aios-core (2645 files, 195 filtered, 3605 insights).*
*Ultima atualizacao: 2026-03-03*
