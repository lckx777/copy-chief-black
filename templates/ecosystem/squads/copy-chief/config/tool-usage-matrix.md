---
phases: [RESEARCH, BRIEFING, PRODUCTION, REVIEW]
priority: CRITICAL
tokens: ~2600
---

# Matriz de Uso de Ferramentas v7.5

> **Princípio:** Ferramenta disponível + relevante = USAR.
> **Enforcement:** Offer State (persistente) + PreToolUse validation.
> **Criado:** 2026-02-02
> **Atualizado:** 2026-02-20 (v7.5 - Subagent Tool Access + general-purpose enforcement)

---

## 🚨 NOVO EM v7.4: OFFER STATE SYSTEM

> **PROBLEMA RESOLVIDO:** Tracking de ferramentas era por SESSÃO (volátil).
> Ao fechar terminal ou após 2h, estado era perdido, permitindo bypass.
>
> **SOLUÇÃO:** Estado agora é por OFERTA em `{oferta}/helix-state.yaml`.
> Persiste entre sessões. BSSF Score 8.3, GBS 95%.

### Arquitetura v7.4

```
{oferta}/helix-state.yaml (PERSISTENTE - fonte de verdade)
         │
         ├── Registra ferramentas usadas por fase HELIX
         ├── Persiste entre sessões do Claude Code
         └── Hooks leem/escrevem aqui

~/.claude/session-state/current-session.json (VOLÁTIL - sessão)
         │
         └── Mantido para compatibilidade, expira em 2h
```

### Arquivos do Sistema

| Arquivo | Propósito |
|---------|-----------|
| `~/.claude/schemas/helix-state.schema.yaml` | Schema do estado |
| `~/.claude/templates/helix-state-template.yaml` | Template para novas ofertas |
| `~/.claude/hooks/lib/offer-state.ts` | Biblioteca de gerenciamento |
| `~/.claude/hooks/phase-advance-gate.ts` | Hook que valida (atualizado v7.4) |
| `~/.claude/hooks/record-tool-in-offer.ts` | Hook que registra uso (NOVO) |
| `scripts/sync-helix-state.sh` | Script de sincronização |

---

## 🚨 Subagent Tool Access (v7.5 - NOVO)

> **PROBLEMA RESOLVIDO (2026-02-20):** Custom subagent types (`researcher`, `copywriter`, `reviewer`, etc)
> NÃO herdam MCPs no runtime. Tools Apify/Firecrawl/Playwright são "deferred" e requerem `ToolSearch`
> para carregar, mas ToolSearch NÃO está disponível para custom types.
> Resultado: 100% fallback para WebSearch em 8/8 subagents researcher.
>
> **SOLUÇÃO:** Usar `general-purpose` para QUALQUER task que precise de MCP.
> BSSF Score 9.2, GBS 95%.

| Subagent Type | Read | Write | WebSearch | ToolSearch | MCPs (Apify, Firecrawl, etc) |
|---------------|------|-------|-----------|------------|------------------------------|
| **general-purpose** | ✅ | ✅ | ✅ | ✅ | ✅ |
| researcher | ✅ | ✅ | ✅ | ❌ | ❌ |
| copywriter | ✅ | ✅ | ❌ | ❌ | ❌ |
| reviewer | ✅ | ✅ | ❌ | ❌ | ❌ |
| synthesizer | ✅ | ✅ | ❌ | ❌ | ❌ |
| voc-processor | ✅ | ✅ | ❌ | ❌ | ❌ |
| competitor-analyzer | ✅ | ✅ | ❌ | ❌ | ❌ |
| copy-validator | ✅ | ❌ | ❌ | ❌ | ❌ |

**REGRA:** Para QUALQUER task que precise de MCP → usar `general-purpose`.
Custom types são PROMPT TEMPLATES (`~/.claude/agents/*.md`), não configuração de runtime.
Prompt templates extraídos em `~/.claude/templates/agent-prompts/`.

---

## Subagent Model Selection (AIOS Token Economy)

> **Princípio:** Modelo certo para task certa. Haiku para repetitivo, Opus para estratégico.
> **Ref:** context-management.md § Token Economy Practices

| Task Type | Modelo | Justificativa |
|-----------|--------|---------------|
| Research/VOC extraction | `sonnet` | Volume alto, precision média suficiente |
| Competitor analysis | `sonnet` | Processamento de dados estruturados |
| Briefing/Strategy (HELIX) | `opus` | Decisões complexas, arquitetura de persuasão |
| MUP/MUS definition | `opus` | Core da oferta requer máxima qualidade |
| Production copy (Leads) | `opus` | Hook e first screen são críticos |
| Production copy (Body) | `sonnet` | Volume maior, qualidade média ok |
| Validation/Review | `sonnet` | Checklist checking, threshold comparisons |
| Formatting/Cleanup | `haiku` | Repetitivo, baixa complexidade |
| VOC Processing/ETL | `haiku` | Extração de quotes, dedup, limpeza |
| Chunk merging | `haiku` | Consolidação mecânica |

### Economia Estimada

| Cenário | Antes (tudo opus) | Depois (model routing) | Economia |
|---------|-------------------|------------------------|----------|
| Pipeline completo | ~$15-20 | ~$8-12 | ~40-50% |
| Sessão de produção | ~$5-8 | ~$3-5 | ~35-40% |
| Validação em lote | ~$3-5 | ~$1-2 | ~60-70% |

### Como Aplicar

```typescript
// No Task tool, especificar model quando diferente de default
Task({
  description: "VOC extraction",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "haiku"  // Economia de custo para ETL
})

Task({
  description: "MUP definition",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "opus"  // Máxima qualidade para core da oferta
})
```

---

## REGRA CARDINAL

> **"Se a ferramenta existe e é relevante, o sistema FORÇA seu uso."**
> Não depender de memória. Não depender de boa vontade.

---

## Por Fase do Workflow

### FASE 1: RESEARCH

| Ferramenta | Obrigatório | Quando Usar |
|------------|-------------|-------------|
| `firecrawl_agent` | ✅ | Coleta autônoma de dados (preferencial) |
| `firecrawl_scrape` | ⚠️ | Fallback se agent falhar |
| `voc_search` | ✅ | Validar hipóteses com VOC |
| `playwright` | ⚠️ | Sites que bloqueiam scraping |
| `fb_ad_library.get_meta_ads` | ✅ | Descobrir concorrentes |
| `fb_ad_library.analyze_ad_video` | ✅ | Análise de vídeos TOP 5 |
| `rlm_chunk` | ⚠️ | Antes de /compact |

### FASE 2: BRIEFING (HELIX)

| Ferramenta | Obrigatório | Quando Usar |
|------------|-------------|-------------|
| `get_phase_context` | ✅ | Início de cada fase |
| `voc_search` | ✅ | Validar hipóteses com VOC |
| `consensus` (zen) | ✅ | Validar TOP 3 MUPs |
| `thinkdeep` (zen) | ⚠️ | Decisões complexas |
| `sequential-thinking` | ⚠️ | Planejamento multi-step |

### 🚨 FASE 5 HELIX: MUP/MUS (CRÍTICO - v7.2)

> **MUP/MUS Statement É COPY.** Não é "conceito abstrato" - é o texto que será usado em toda comunicação.
> Validação emocional do core da oferta é OBRIGATÓRIA.

| Ferramenta | Obrigatório | Input | Threshold |
|------------|-------------|-------|-----------|
| `consensus` (zen) | ✅ | TOP 3 MUPs para escolher | Multi-model agreement |
| `blind_critic` | ✅ | MUP Statement completo | Média ≥8/10 |
| `blind_critic` | ✅ | MUS Statement completo | Média ≥8/10 |
| `emotional_stress_test` | ✅ | MUP + MUS concatenados | Genericidade ≥8/10 |
| `voc_search` | ✅ | Validar linguagem do MUP/MUS com VOC | Quotes encontradas |

**SEQUÊNCIA OBRIGATÓRIA:**
```
1. consensus → Selecionar MUP entre candidatos
2. blind_critic → Validar MUP Statement (copy_type: "headline")
3. Definir MUS baseado no MUP validado
4. blind_critic → Validar MUS Statement (copy_type: "headline")
5. emotional_stress_test → Validar MUP+MUS juntos (copy_type: "lead")
6. voc_search → Confirmar linguagem alinhada com avatar
7. HUMANO → Aprovação final obrigatória
```

**SE THRESHOLD NÃO ATINGIDO:**
- consensus não aprova → REFAZER candidato
- Critérios de NOME não passam → Ver seção "Validação de NOMES" abaixo
- NUNCA avançar para Fase 6 sem validação completa

### ⚠️ VALIDAÇÃO DE NOMES DE MECANISMO (v7.2 - CRÍTICO)

> **DISTINÇÃO:** Validar NOMES ≠ Validar COPY.
> blind_critic e emotional_stress_test são para COPY produzida, não para NOMES.

**CRITÉRIOS ESPECÍFICOS PARA NOMES:**

| Elemento | Critério Principal | Teste | Threshold |
|----------|-------------------|-------|-----------|
| **Sexy Cause** | Transmissibilidade | "A pessoa vai CONTAR para alguém?" | SIM obrigatório |
| **Gimmick Name** | Chiclete + Ingrediente | "Gruda E está ligado ao ingrediente hero?" | AMBOS SIM |
| **Origin Story** | Credibilidade + Curiosidade | "De onde veio? É verificável?" | Plausível |
| **Authority Hook** | Super Estrutura | "Referencia algo reconhecido (medicamento, instituição, elite)?" | SIM obrigatório |

**CRITÉRIOS RMBC (todos os nomes):**

| Critério | Score 1-10 | Threshold |
|----------|------------|-----------|
| **Digerível** | Explicável em 1-2 frases? | ≥7 |
| **Único** | Gera "nunca ouvi isso antes"? | ≥7 |
| **Provável** | Faz sentido intuitivo? | ≥7 |
| **Conectado** | Liga com emoção do avatar? | ≥7 |

**VALIDAÇÃO COM CONSENSUS:**
```
1. Apresentar candidatos de nome ao consensus
2. Avaliar usando critérios acima (não critérios de copy)
3. Score médio ≥7 para aprovar
4. HUMANO dá aprovação final
```

### FASE 3: PRODUCTION

| Ferramenta | Obrigatório | Quando Usar |
|------------|-------------|-------------|
| `write_chapter` | ✅ (VSL) | Cada capítulo da VSL |
| `blind_critic` | ✅ | Após produzir qualquer copy |
| `emotional_stress_test` | ✅ | Após produzir qualquer copy |
| `layered_review` | ✅ | Refinamento em 3 camadas |
| `black_validation` | ✅ | Antes de entregar |
| `challenge` (zen) | ⚠️ | Questionar decisões |

### FASE 4: REVIEW

| Ferramenta | Obrigatório | Quando Usar |
|------------|-------------|-------------|
| `copy-critic` | ✅ | Validação STAND |
| `black_validation` | ✅ | Gate final |
| `consensus` (zen) | ⚠️ | Validação multi-modelo |

---

---

## Enforcement Automatico (v7.1)

**Fluxo:** IDLE -> RESEARCH -> BRIEFING -> PRODUCTION -> DELIVERED. Cada transicao requer validate_gate (ou black_validation para production).

### Hooks

| Hook | Evento | Verifica |
|------|--------|----------|
| `validate-gate-prereq.ts` | PreToolUse | Ferramentas obrigatorias usadas antes de validate_gate |
| `gate-tracker.ts` | PostToolUse | Registra resultado de gates |
| `phase-gate.ts` | PreToolUse | Bloqueia Write sem gate anterior |
| `tool-enforcement-gate.ts` | Stop | Validacoes antes de sair |
| `pre-compact-save.sh` | PreCompact | Lembra rlm_chunk |

### Ferramentas Obrigatórias por Gate (v7.1)

| Gate | Ferramentas Obrigatórias | Alternativas |
|------|-------------------------|--------------|
| Research | firecrawl_agent, voc_search | firecrawl_scrape, firecrawl_search, playwright |
| Briefing | get_phase_context | - |
| Production | blind_critic, emotional_stress_test | - |

### Ferramentas Recomendadas (Warning Only)

| Gate | Ferramentas Recomendadas |
|------|-------------------------|
| Research | fb_ad_library.get_meta_ads, analyze_ad_video |
| Briefing | consensus, thinkdeep |
| Production | layered_review, write_chapter |

### Mensagem de Bloqueio (validate_gate)

Se ferramentas obrigatórias nao foram usadas, validate_gate mostra lista de faltantes e bloqueia avanco.

---

## Tasks por Deliverable

> **Regra:** Tasks sao ACOES no imperativo. Persona executa. Ref: `~/.claude/schemas/task-definition.schema.yaml`

### VSL
- [ ] `write_chapter` para cada capitulo (6)
- [ ] `blind_critic` apos cada capitulo
- [ ] `emotional_stress_test` na VSL completa
- [ ] `layered_review` (3 camadas)
- [ ] `black_validation` antes de entregar

### Landing Page
- [ ] `blind_critic` por bloco
- [ ] `emotional_stress_test` na LP completa
- [ ] `layered_review` (3 camadas)
- [ ] `black_validation` antes de entregar

### Criativo
- [ ] `blind_critic` no criativo
- [ ] `emotional_stress_test` no criativo
- [ ] `black_validation` antes de entregar

### MUP/MUS
- [ ] `consensus` com 3 modelos (TOP 3 candidatos)
- [ ] `blind_critic` no MUP Statement
- [ ] `blind_critic` no MUS Statement
- [ ] `emotional_stress_test` no MUP+MUS juntos
- [ ] `voc_search` para validar linguagem
- [ ] Submeter para aprovacao humana

### Email Sequence
- [ ] `blind_critic` por email
- [ ] `emotional_stress_test` na sequencia completa
- [ ] `black_validation` antes de entregar

---

## Criterios de Aceitacao por Deliverable

> **Regra:** Criterios sao THRESHOLDS. Sentinel valida. Ref: `~/.claude/schemas/checklist-definition.schema.yaml`
> **Detalhes completos:** `~/.claude/templates/checklists/{deliverable}-acceptance.yaml`

### VSL
- blind_critic >= 8 (por capitulo)
- emotional_stress_test genericidade >= 8
- black_validation >= 8/10
- Humano aprova MUP antes de produzir

### Landing Page
- blind_critic >= 8 (por bloco)
- emotional_stress_test genericidade >= 8
- black_validation >= 8/10

### Criativo
- blind_critic >= 8
- emotional_stress_test genericidade >= 8
- black_validation >= 8/10

### MUP/MUS
- consensus: multi-model agreement
- blind_critic >= 8 (MUP Statement)
- blind_critic >= 8 (MUS Statement)
- emotional_stress_test genericidade >= 8 (MUP+MUS juntos)
- voc_search: quotes encontradas
- HUMANO aprova final

### Email Sequence
- blind_critic >= 8 (por email)
- emotional_stress_test genericidade >= 8
- black_validation >= 8/10

---

## 🚨 MECANISMO UNICO ENFORCEMENT (v7.3)

> Ref: mecanismo-unico.md para framework completo (estrutura, validacao, criterios RMBC).

**Resumo:** Nenhuma oferta avanca para production/ sem `mecanismo-unico.yaml` com state = VALIDATED ou APPROVED.
**Hook:** `mecanismo-validation.sh` bloqueia Write em production/* automaticamente.

### Bloqueio por Path (ATUALIZADO v7.3)

| Write em | Precondicao | Se falhar |
|----------|-------------|-----------|
| research/ | Nenhuma | - |
| briefings/ | gates.research = true | BLOQUEIA |
| production/ | gates.briefing = true **E** mecanismo state = VALIDATED/APPROVED | BLOQUEIA |

---

*v7.5 - Dedup: Mecanismo Unico replaced with ref to mecanismo-unico.md*
*Atualizado: 2026-02-23*
