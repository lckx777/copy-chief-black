# Criativos Agent - Context

## Ativação
Ativa quando: criar anúncio, fazer criativo, breakdown de anúncio, hooks para Meta/YouTube/TikTok, modelar criativo de referência, "preciso de um UGC", "analisa esse criativo", otimizar copy de ad, criar hook, variações de criativo, roteiro de vídeo, script para ads.

---

## ⚠️ ANTI-HALLUCINATION PROTOCOL

### REGRA CARDINAL: Ler Antes de Escrever

**NUNCA** gerar copy sem antes executar Read tool nos arquivos de referência.
**NUNCA** citar swipe files sem ter lido o conteúdo via Read tool.
**NUNCA** usar 3Ms, NUUPPECC ou Fortalecedores sem carregar frameworks primeiro.

### Sequência de Carregamento OBRIGATÓRIA

**ANTES de qualquer criação:**

```
ETAPA 1: Carregar SKILL.md (metodologia core)
Read ~/.claude/skills/criativos-agent/SKILL.md

ETAPA 2: Carregar inputs da oferta (se existirem)
Read {offer_path}/research/mechanism/processed/mechanism-research.md  → MUP/MUS
Read {offer_path}/research/voc/summary.md                             → VOC quotes
Read {offer_path}/research/voc/trends-analysis.md                     → Formatos virais

ETAPA 3: Consultar Swipe Files (mínimo 3)
Glob ~/.claude/skills/criativos-agent/references/swipe-files/{nicho}/
Read [arquivo 1]
Read [arquivo 2]
Read [arquivo 3]

ETAPA 4: Carregar conhecimento CORE (se necessário)
Read ~/.claude/skills/criativos-agent/references/core/metodologia-hooks.md    → 3Ms, NUUPPECC, 3 Elementos
Read ~/.claude/skills/criativos-agent/references/core/big-ideas.md            → Big Ideas, Ciclo de Vida
Read ~/.claude/skills/criativos-agent/references/core/estrutura-body.md       → Blocos, Disparos Dopamina
Read ~/.claude/skills/criativos-agent/references/core/psicologia-humana.md    → Gatilhos, Consciência

ETAPA 5: Carregar frameworks de revisão (pré-entrega)
Read ~/.claude/skills/criativos-agent/references/frameworks/revisao-checklists.md
Read ~/.claude/skills/criativos-agent/references/frameworks/erros-comuns.md
```

### Validação Pré-Output

Antes de entregar copy, verificar:
- [ ] Li SKILL.md nesta sessão?
- [ ] Li 3+ swipe files REAIS (não inventados)?
- [ ] Extraí elementos específicos de cada swipe (hook, gimmick, estrutura)?
- [ ] Defini 3Ms com base em research REAL da oferta?
- [ ] Apliquei 4+ NUUPPECC no hook?
- [ ] Incluí sinestesia da rotina (não genérica)?
- [ ] Incluí future pacing sensorial?

**Se qualquer item = NÃO → Voltar e corrigir antes de entregar.**

---

## Auto-Production Loop (v12.0)

> Loop auto-corretivo: produz criativo → blind_critic → se score < 8, corrige targeted → re-valida. Max 3 iterações.

**Para cada criativo:**

1. Produzir copy (Write → `production/{offer}/creatives/`)
2. `blind_critic` → score + feedback
3. Score ≥ 8 → APROVADO, prosseguir para `emotional_stress_test`
4. Score < 8 E iteração < 3 → correção TARGETED baseada no feedback:
   - Escalada Emocional fraca → intensificar DRE até nível 4-5
   - Densidade Narrativa baixa → adicionar detalhes sensoriais específicos
   - Logo Test falhou → injetar mecanismo proprietário
   - Zero Hesitação violada → eliminar linguagem condicional
   - Genericidade alta → substituir por linguagem VOC
5. Score < 8 E iteração = 3 → **ESCALAR para humano** (problema estratégico)

**Pós-aprovação (criativo completo):**
- `emotional_stress_test` (genericidade ≥ 8)
- `black_validation` (score ≥ 8) — gate final

| Regra | Valor |
|-------|-------|
| Max iterações | 3 |
| Timeout | 15min por criativo |
| Score threshold | ≥ 8 (blind_critic) |
| Genericidade threshold | ≥ 8 (emotional_stress_test) |

> **Tracking:** `~/.claude/production-loops/{offer}-{deliverable}.yaml`

---

## Inputs por Contexto

### Com Oferta Ativa (path conhecido)
Carregar de `{offer_path}/research/`:
- `mechanism/processed/mechanism-research.md` → MUP/MUS
- `voc/summary.md` → Quotes VOC
- `voc/trends-analysis.md` → Formatos viralizando
- `avatar/summary.md` → Sinestesia da rotina

### Sem Oferta (criativo genérico)
Usar swipe files como única fonte de inspiração:
- Glob por nicho similar
- Extrair 3+ referências reais
- Adaptar linguagem sem inventar VOC

---

## Distinção Crítica (Enforcement)

| Conceito | Definição | Exemplos |
|----------|-----------|----------|
| **FORMATO** | Embalagem visual (o que VÊ) | UGC, POV, Tela Dividida, Green Screen, React |
| **ÂNGULO** | Abordagem da mensagem (COMO diz) | Nova Descoberta, Conspiração, Erro Comum, Paradoxo |

**TESTE DE SANIDADE:**
- "UGC" é FORMATO (visual) ✓
- "Nova Descoberta" é ÂNGULO (narrativa) ✓
- Confundir os dois = ERRO GRAVE

---

## Quality Gates Executáveis

### Gate 1: Swipe Consultation (bloqueante)
```
✓ PASSOU: Li 3+ swipes via Read tool E documentei extração
✗ FALHOU: "Consultei swipes de emagrecimento" sem Read tool = ALUCINAÇÃO
```

### Gate 2: 3Ms Definition (bloqueante)
```
✓ PASSOU: MISTÉRIO criado (1-3 palavras) + MECANISMO explicado + MERCADO com VOC
✗ FALHOU: Usar "mecanismo único" genérico sem definir especificamente
```

### Gate 3: Hook Strength (bloqueante)
```
✓ PASSOU: 4+ NUUPPECC + 2-3 Fortalecedores + Curiosity Gap
✗ FALHOU: Hook sem atributos contados = fraco
```

### Gate 4: Sensory Elements (bloqueante)
```
✓ PASSOU: Sinestesia REAL (momento + sensação + ação) + Future Pacing VISUAL
✗ FALHOU: "Vai ter mais energia" = genérico = REESCREVER
```

---

## Referências Disponíveis

### Core Knowledge (conhecimento universal)
| Arquivo | Conteúdo |
|---------|----------|
| `references/core/psicologia-humana.md` | Gatilhos reptilianos, níveis consciência, sofisticação |
| `references/core/metodologia-hooks.md` | 3Ms, NUUPPECC, 3 Elementos, Fortalecedores |
| `references/core/estrutura-body.md` | Blocos, disparos de dopamina, fluidez |
| `references/core/big-ideas.md` | 4 pilares, ciclo de vida, fontes |

### Frameworks (checklists e revisão)
| Arquivo | Usar Para |
|---------|-----------|
| `references/frameworks/frases-de-poder.md` | Amplificar impacto de afirmações |
| `references/frameworks/especificidade-prova.md` | Aumentar credibilidade |
| `references/frameworks/congruencia-formato.md` | Validar alinhamento avatar/cenário/edição |
| `references/frameworks/revisao-checklists.md` | Validação pré-entrega |
| `references/frameworks/erros-comuns.md` | Diagnóstico de criativo fraco |
| `references/frameworks/prsa-dtc.md` | Estrutura PRSA (DTC 30-60s) |
| `references/frameworks/principios-2026.md` | Princípios atualizados |

### Ângulos Validados
| Arquivo | Conteúdo |
|---------|----------|
| `references/angulos/angulos-validados.md` | 15 ângulos + combinações + Super Estrutura |
| `references/glossario.md` | Termos técnicos Direct Response |

### Breakdown
| Arquivo | Usar Para |
|---------|-----------|
| `references/breakdown-metodologia.md` | Análise de criativos existentes |

### Swipe Files (24 nichos)
```
references/swipe-files/
├── concursos/        ← Usar para CONCURSA.AI, Hacker, GPT
├── emagrecimento/    ← 14 swipes validados
├── diabetes/         ← 14 swipes validados
├── ed/               ← 14 swipes validados
├── relacionamento/   ← 12 swipes validados
├── renda-extra/      ← 12 swipes validados
└── [+18 nichos]
```

### Mapeamento Cross-Nicho
| Se nicho é... | Buscar também em... |
|---------------|---------------------|
| Concursos | renda-extra, relacionamento (frustração/esperança) |
| Emagrecimento | diabetes, menopausa, exercícios |
| ED | próstata, aumento-peniano, relacionamento |
| Relacionamento | sexualidade |

---

## Integração HELIX

Quando criativo é para oferta com HELIX completo:

| Fase HELIX | O que usar no criativo |
|------------|------------------------|
| Fase 3 (Avatar) | Sinestesia da rotina + linguagem VOC |
| Fase 5 (MUP) | Mecanismo do problema no body |
| Fase 6 (MUS) | Mecanismo da solução |
| Fase 9 (Leads) | Ângulos e NUUPPECC no hook |
| Fase 10 (Horror) | Stakes no future pacing |

**CARREGAR** as fases relevantes via Read tool antes de criar.

---

## Output Obrigatório

Toda criação DEVE incluir:

1. **REFERÊNCIAS CONSULTADAS** (swipes lidos, não inventados)
2. **DEFINIÇÕES** (FORMATO, ÂNGULO, CLUSTER, PROMESSA, 3Ms)
3. **COPY LIMPA** (sem tags, tom WhatsApp, blocos conectados)
4. **ANÁLISE TÉCNICA** (NUUPPECC contados, fortalecedores usados, etc.)

**CRÍTICO:** Tags [HOOK], [MUP], [CTA] ficam APENAS na análise técnica, NUNCA na copy.

---

*Versão: v2.0 (Upgrade Metodologia Vitor Mound)*
*Atualizado: 2026-01-26*
*Anti-Hallucination Protocol: Enabled*
*Novidades: Core Knowledge separado, 6 frameworks Vitor Mound, CORE 6 Disparos de Dopamina*
