---
description: Create new offer project structure via guided pipeline
argument-hint: "<nicho> <oferta>"
---

# Create Offer Pipeline

Creates a complete offer structure for: $ARGUMENTS

This command runs a 3-step pipeline:
1. **create-niche-pack.ts** — Generates niche library and templates (if niche is new)
2. **offer-elicitation.ts** — Generates YAML setup template, human fills it, then scaffolds offer
3. **workflow-generator.ts** — Generates `workflow.yaml` for bob-orchestrator to consume

---

## Step 0: Parse Arguments

```bash
NICHO=$(echo "$ARGUMENTS" | cut -d' ' -f1)
OFERTA=$(echo "$ARGUMENTS" | cut -d' ' -f2)
BASE=~/copywriting-ecosystem/$NICHO/$OFERTA
NICHE_LIBRARY=~/copywriting-ecosystem/$NICHO/biblioteca_nicho_${NICHO}_CONSOLIDADA.md
```

---

## Step 1: Create Niche Pack (if niche is new)

Check whether the niche library already exists:

```bash
if [ ! -f "$NICHE_LIBRARY" ]; then
  echo "Niche '$NICHO' is new — generating niche expansion pack..."
  bun run ~/.claude/scripts/create-niche-pack.ts --niche "$NICHO" --offer "$OFERTA"
else
  echo "Niche '$NICHO' already exists — skipping niche pack creation."
  echo "Library: $NICHE_LIBRARY"
fi
```

`create-niche-pack.ts` generates:
- `$NICHO/biblioteca_nicho_${NICHO}_CONSOLIDADA.md` — Niche library skeleton
- `$NICHO/_templates/` — Niche-adapted templates (voc extraction, ads spy, etc.)
- If `--offer` is also passed: full offer scaffolding (CONTEXT.md, helix-state.yaml, mecanismo-unico.yaml, task_plan.md, full directory tree)

**When niche already exists**, skip this step entirely to avoid overwriting an existing library.

---

## Step 1.5: 3-Pass Exploration (AIOS Pattern)

Before scaffolding the offer, run a structured 3-pass exploration to map the territory. This prevents creating in a vacuum.

### Pass 1: Topologia do Nicho
Read the niche library (`biblioteca_nicho_${NICHO}_CONSOLIDADA.md`) and map:
- How many offers already exist in this niche?
- What VOC data is already collected cross-offer?
- What clichés are documented (to avoid from day 1)?
- What experts have relevant coverage?

### Pass 2: Contratos e Concorrentes
Check the competitive landscape:
- Read any existing `research/competitors/summary.md` from sibling offers in the same niche
- Check if `ads-library-spy.md` exists for similar offers
- Identify what angles are already being used (to differentiate)
- List any cross-offer dependencies (e.g., front-end → SaaS upsell)

### Pass 3: Fragilidades e Gaps
Identify risks before starting:
- Is the mecanismo hypothesis differentiated from existing offers in the niche?
- Does the avatar overlap with another offer (cannibalization risk)?
- Are there compliance constraints for this sub-niche?
- What's the weakest link in the funnel hypothesis?

**Output:** Display a brief summary of findings from all 3 passes before proceeding to Step 2. This ensures the human has full context before filling the setup template.

---

## Step 2: Generate Setup Template (Elicitation)

Run the elicitation engine to produce a YAML template for the human to fill:

```bash
SETUP_FILE=~/copywriting-ecosystem/${NICHO}/${OFERTA}-setup.yaml
bun run ~/.claude/scripts/offer-elicitation.ts --generate "$SETUP_FILE"
echo ""
echo "Setup template generated: $SETUP_FILE"
echo ""
echo "NEXT: Open the file, fill all fields, then continue to Step 2b."
echo "  Fields to fill: nicho, offer_name, tipo, funil, ticket, expert,"
echo "  business_context, avatar_hypothesis (gender/age_range/dre_hypothesis),"
echo "  mup_hypothesis, mus_hypothesis"
```

### Step 2b: Validate the Filled Template

After the human fills the YAML file:

```bash
bun run ~/.claude/scripts/offer-elicitation.ts --validate "$SETUP_FILE"
```

If validation passes (exit 0), continue to Step 2c. If it fails, show the errors and ask the human to correct the file.

### Step 2c: Create Offer Structure from Template

```bash
bun run ~/.claude/scripts/offer-elicitation.ts --create "$SETUP_FILE"
```

This creates the full offer directory at `~/copywriting-ecosystem/$NICHO/$OFERTA/` with:
- `CONTEXT.md` — Pre-filled from template data
- `helix-state.yaml` — Initialized to IDLE
- `mecanismo-unico.yaml` — Initialized to UNDEFINED
- `project_state.yaml` — Phase: SETUP, next action defined
- `task_plan.md` — Full pipeline checklist
- All required subdirectories (`research/`, `briefings/`, `production/`, `reviews/`, `swipes/`)

**Note:** If Step 1 already scaffolded the offer directory (via `--offer` flag on create-niche-pack.ts), Step 2c will overwrite only the template files, preserving the directory structure.

---

## Step 3: Generate Workflow (after human fills YAML)

Once the setup YAML has been validated and the offer structure created, generate the workflow for bob-orchestrator:

```bash
# Read funnel type from the filled setup YAML
# Map: VSL -> vsl | TSL -> tsl | Quiz -> quiz | SaaS -> saas | Webinar -> webinar
FUNNEL_TYPE=$(grep "^tipo:" "$SETUP_FILE" | awk '{print $2}' | tr '[:upper:]' '[:lower:]')

bun run ~/.claude/scripts/workflow-generator.ts --type "$FUNNEL_TYPE" --offer "$NICHO/$OFERTA"
```

`workflow-generator.ts` writes `~/copywriting-ecosystem/$NICHO/$OFERTA/workflow.yaml` — the machine-readable pipeline that `bob-orchestrator.ts` consumes to track phases, validate gates, and advance the offer through Research → Briefing → Production.

Available workflow types:
| Flag | Funnel |
|------|--------|
| `tsl` | TSL (Landing Page → Checkout) |
| `vsl` | VSL (Video → LP → Checkout) |
| `quiz` | Quiz Funnel (Quiz → VSL/TSL → Checkout) |
| `saas` | SaaS (Home + Features + Pricing + Onboarding) |
| `webinar` | Webinar (Registro + Script + Replay + Follow-up) |

Use `--dry-run` to preview the workflow table without writing the file.

---

## Step 4: Expert Coverage Check

After creating the structure, check if the Copy Squad has adequate coverage for this niche.

Read all expert profiles from `~/.claude/copy-squad/*.md` and extract their `specialties` or `nicho` fields.

### Coverage Calculation

For the given `$NICHO`, count how many of the 24 experts have a relevant specialty:

| Niche | Relevant Specialties (keywords to match) |
|-------|------------------------------------------|
| concursos | education, concursos, study, memorization, exam, test prep |
| saude | health, supplement, weight loss, medical, pain, wellness, fitness |
| relacionamento | relationship, dating, marriage, attraction, seduction, love, reconquista |
| riqueza | wealth, money, business, income, investment, entrepreneurship, finance |

**Algorithm:**
1. For each expert profile, check if any of their specialties/tags match the niche keywords
2. Count matches as `relevant_experts`
3. Calculate `coverage = relevant_experts / 24 * 100`

### Output

**If coverage >= 60%:**
```
Copy Squad Coverage: {coverage}% ({relevant_experts}/24 experts relevant)
Boa cobertura para o nicho {NICHO}. Pronto para pesquisa.
```

**If coverage < 60%:**
```
Copy Squad Coverage: {coverage}% ({relevant_experts}/24 experts relevant)

Para melhorar cobertura no nicho {NICHO}, considere clonar:
- [Expert Name] — especialista em [relevancia] → /clone-expert [name]
- [Expert Name] — especialista em [relevancia] → /clone-expert [name]

Estes experts agregariam [justificativa especifica para o nicho].
```

Suggest 1-3 experts known for that niche who aren't yet in the squad. Use your knowledge of famous DR copywriters to recommend relevant additions.

---

## Summary: What Was Created

After all steps complete, output this summary:

```
OFFER CREATION COMPLETE
=======================
Niche:    $NICHO
Offer:    $OFERTA
Path:     ~/copywriting-ecosystem/$NICHO/$OFERTA/

Files created:
  CONTEXT.md              — Offer context (pre-filled)
  helix-state.yaml        — HELIX state tracker (IDLE)
  mecanismo-unico.yaml    — Mecanismo tracker (UNDEFINED)
  project_state.yaml      — Pipeline state (SETUP)
  task_plan.md            — Full pipeline checklist
  workflow.yaml           — bob-orchestrator pipeline

Niche library: ~/copywriting-ecosystem/$NICHO/biblioteca_nicho_${NICHO}_CONSOLIDADA.md

Next steps:
1. Run /helix-parallel $OFERTA  — or —
2. Invoke audience-research-agent to start Research phase
3. Track progress: bun run ~/.claude/scripts/bob-orchestrator.ts --status --offer $NICHO/$OFERTA
```

---

## Full Pipeline Reference

```bash
# STEP 1 — New niche only
bun run ~/.claude/scripts/create-niche-pack.ts --niche <nicho> --offer <oferta>

# STEP 2a — Generate template
bun run ~/.claude/scripts/offer-elicitation.ts --generate ~/copywriting-ecosystem/<nicho>/<oferta>-setup.yaml

# STEP 2b — Validate filled template
bun run ~/.claude/scripts/offer-elicitation.ts --validate ~/copywriting-ecosystem/<nicho>/<oferta>-setup.yaml

# STEP 2c — Create offer from template
bun run ~/.claude/scripts/offer-elicitation.ts --create ~/copywriting-ecosystem/<nicho>/<oferta>-setup.yaml

# STEP 3 — Generate workflow
bun run ~/.claude/scripts/workflow-generator.ts --type <vsl|tsl|quiz|saas|webinar> --offer <nicho>/<oferta>

# VERIFY — Check bob-orchestrator sees the new offer
bun run ~/.claude/scripts/bob-orchestrator.ts --status --offer <nicho>/<oferta>
```
