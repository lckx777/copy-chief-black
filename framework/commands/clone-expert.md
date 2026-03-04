---
description: Clone a new copywriting expert's mind into the Copy Squad
argument-hint: "[expert name or /path/to/content] (e.g., 'David Deutsch', '~/books/scientific-advertising.txt')"
---

# Clone Expert — Dynamic Mind Cloning

**Input:** $ARGUMENTS

You are the Copy Chief performing dynamic expert cloning. Two modes available:

---

## MODE A: Clone by Expert Name (Web Research)

If `$ARGUMENTS` is a name (not a file path), perform web-based cloning.

### Step 1: Parse Input

Extract the expert name from `$ARGUMENTS`. If empty, ask the user who they want to clone.

Generate a slug from the name (lowercase, hyphenated): "David Deutsch" → `deutsch`, "Stefan Georgi" → `georgi`, "Evaldo Albuquerque" → `albuquerque`.

**Check if expert already exists:**
```bash
ls ~/.claude/copy-squad/${slug}.md 2>/dev/null
```
If exists, inform the user and ask if they want to UPDATE (enrich) or ABORT.

### Step 2: Deep Research

Use WebSearch to extract comprehensive information about this copywriter. Search for:

1. `"[name]" copywriting frameworks techniques`
2. `"[name]" direct response marketing method`
3. `"[name]" copywriting books courses`
4. `"[name]" best ads campaigns results`
5. `"[name]" copywriting tips philosophy`

From the research, extract:
- **Core Philosophy** (what they believe about copy, 3-5 principles)
- **Voice Patterns** (5-7 distinct writing techniques with DO/DON'T)
- **Frameworks** (named methods, formulas, systems they created or are known for)
- **Anti-Patterns** (what they would NEVER do, with reasons)
- **Famous Works** (abstracted patterns from their best-known campaigns)
- **Specialty Sections** (what parts of copy they're best at)
- **Tier** (T0_DIAGNOSIS, T1_STRATEGIC, T2_EXECUTION, T3_SPECIALIZED, or AUDIT)

### Step 3: Determine Tier and Sections

Based on the expert's specialty, assign:

| Expert Type | Tier | Example Sections |
|-------------|------|-----------------|
| Market analyst, researcher | T0_DIAGNOSIS | research, awareness, market_analysis |
| Strategist, mechanism, big idea | T1_STRATEGIC | mecanismo, offer_stack, positioning |
| Writer, copy execution | T2_EXECUTION | body_copy, bullets, hooks, close |
| Specialist (launches, email, social) | T3_SPECIALIZED | launch, email, social_content |
| Testing, validation | AUDIT | testing, validation, metrics |

Assign 3-6 sections where this expert would be the primary voice.

### Step 4: Generate Voice DNA Profile

Write the profile to `~/.claude/copy-squad/${slug}.md` following Voice DNA v1.0 format:

```markdown
# [Full Name] - Voice DNA Profile

> **Sections:** [section1, section2, ...]
> **Tier:** [tier]
> **Token Budget:** ~300 tokens injected per section
> **Core Identity:** [1-2 sentence essence of this expert]

---

## Core Philosophy

[3-5 paragraphs capturing their fundamental beliefs about copy]

---

## Voice Patterns

### 1. [Pattern Name]
[Description]
**DO:** [list]
**DON'T:** [list]

[... 5-7 patterns total ...]

---

## Frameworks Extraidos

### F1: [Framework Name]
[Complete framework with structure, when to use, application]

[... 3-5 frameworks ...]

---

## Anti-Patterns (What [Name] Would NEVER Do)

| Pattern | Why It Fails |
|---------|-------------|
| ... | ... |

---

## Injection Prompt (~300 tokens)

When producing sections assigned to [Name], inject these constraints:

\```
VOICE: [Full Name] -- [Core Identity]
- [constraint 1]
- [constraint 2]
- [... 15-25 lines of specific constraints]
- FINAL CHECK: [specific rewrite trigger]
\```

---

*Voice DNA v1.0 -- [Full Name] Profile*
*Sections: [sections]*
*Cloned: [date]*
```

### Step 5: Generate Checklist

Write a practical checklist to `~/.claude/copy-squad/checklists/${slug}-primary.md`:

```markdown
# [Full Name] - Primary Checklist

> **Expert:** [name]
> **Use for:** [sections]
> **Cross-ref:** `~/.claude/copy-squad/${slug}.md`

---

## Checklist (20 items)

### [Category 1] (4 checks)
- [ ] [item]
...

### [Category 2] (4 checks)
...

[... 5 categories x 4 items = 20 checks ...]

---

## Scoring
| Range | Grade |
|-------|-------|
| 18-20 | Expert-Grade |
| 14-17 | Strong |
| 10-13 | Needs Work |
| <10 | Rewrite |
```

### Step 6: Update Manifest

Read `~/.claude/copy-squad/manifest.yaml` and add the new expert:

1. Add to the appropriate tier list
2. Add expert profile entry under `experts:`
3. Add to relevant `decision_tree` entries based on their specialty

### Step 7: Regenerate Index

```bash
bun run ~/.claude/scripts/expert-etl.ts --index
```

### Step 8: Validate

```bash
bun run ~/.claude/scripts/expert-etl.ts --validate --report
```

If validation passes, confirm to user:

```
Expert [Name] clonado com sucesso!
- Profile: ~/.claude/copy-squad/${slug}.md ([X] linhas)
- Checklist: ~/.claude/copy-squad/checklists/${slug}-primary.md
- Tier: [tier]
- Sections: [sections]
- Disponivel para routing via /expert
```

If validation has errors, fix them before confirming.

### Step 9: Discovery Mode (when called from /expert)

If the Copy Chief router scores ALL existing experts below 60 for a given task, the system should suggest:

> "Nenhum expert atual tem score alto para [task]. Posso descobrir quem seria ideal.
> Use `/clone-expert [suggested name]` para clonar."

The suggestion should come from WebSearch: `"best copywriter for [task type]"`.

---

## MODE B: Clone from Content File (System Cloning Pipeline)

If `$ARGUMENTS` is a file path (starts with `/`, `~`, or `./`), run the system cloning pipeline.

### What it Does

1. Reads content from specified path
2. Extracts DNA (5 layers: Philosophy, Frameworks, Heuristics, Methodologies, Dilemmas)
3. Converts frameworks to skill drafts
4. Detects implicit roles/personas
5. Generates operational playbook
6. Suggests enrichments to existing expert profiles
7. Outputs full report to `~/.claude/knowledge/cloned/`

### Running the Pipeline

```bash
bun run ~/copywriting-ecosystem/scripts/system-cloning/index.ts <path-to-content>
```

**Options:**
- `--output <dir>` — Custom output directory
- `--skip dna,frameworks,roles,playbook,enrich` — Skip specific stages
- `--verbose` — Detailed logging

### Quality Gate

| Threshold | Status | Meaning |
|-----------|--------|---------|
| < 100h estimated reading time | ⚠️ INSUFFICIENT_DATA | DNA extraction is **SPECULATIVE** |
| >= 100h estimated reading time | ✅ SUFFICIENT_DATA | DNA extraction is **RELIABLE** |

Track total ingested content:
```bash
bun run ~/copywriting-ecosystem/scripts/system-cloning/quality-threshold.ts status
```

### Output Files

| File | Contents |
|------|----------|
| `dna-report.yaml` | 5-layer DNA extraction with scores (1-10 per layer) |
| `skill-drafts.md` | Generated skill structures from frameworks |
| `skill-drafts/` | Individual high-confidence skill markdown files |
| `roles-detected.md` | Detected personas mapped to Copy Squad |
| `playbook.md` | Operational playbook (triggers, steps, constraints, validation) |
| `enrichment-suggestions.md` | Append-only suggestions for existing expert profiles |

### DNA Layer Scores

| Score | Meaning |
|-------|---------|
| 1-3 | Minimal — content barely touches this layer |
| 4-5 | Sparse — some relevant content |
| 6-7 | Moderate — useful but not rich |
| 8-9 | Rich — strong layer for this content |
| 10 | Saturated — dominant layer |

### Post-Pipeline Actions

After the pipeline completes:

1. **Review `dna-report.yaml`** — Check which layers scored highest
2. **Review `skill-drafts.md`** — High-confidence skills may be promoted to `~/.claude/skills/`
3. **Review `roles-detected.md`** — Unmapped roles may suggest new personas
4. **Review `enrichment-suggestions.md`** — Apply relevant additions to expert profiles
5. **Review `playbook.md`** — Incorporate useful rules into existing rules files

All outputs are DRAFT status — human review required before promotion.

---

*Clone Expert v2.0 — Mode A (web research) + Mode B (system cloning pipeline)*
*Ref: ~/.claude/rules/anti-sycophancy.md — validate outputs adversarially*
*Ref: ~/copywriting-ecosystem/scripts/system-cloning/index.ts*
