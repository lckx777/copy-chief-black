---
description: Structured investigative research mode — generates questions and identifies biases BEFORE searching
argument-hint: "<topic> — e.g., 'CoQ10 efficacy for tinnitus', 'tinnitus avatar pain points', 'competitor VSL structure'"
---

# /investigate — Investigative Research Mode

**Input:** $ARGUMENTS

Structured investigation mode that generates questions and explicitly identifies biases BEFORE starting research.
Ensures evidence is gathered for both confirming AND disconfirming hypotheses.

## Why This Exists

Standard research suffers from confirmation bias: we search for what confirms what we already believe.
This protocol forces EXPLICIT bias declaration and DELIBERATE disconfirming searches before synthesis.

## Instructions

When this command is invoked with `$ARGUMENTS`:

### Step 0: Handle Missing Input

If `$ARGUMENTS` is empty:
```
Usage: /investigate <topic>

Examples:
  /investigate "CoQ10 efficacy for tinnitus"
  /investigate "florayla avatar pain points"
  /investigate "competitor VSL structure for constipation offers"
  /investigate "shame as DRE in health niches"
  /investigate "which hook format converts best for supplement VSLs"

/investigate is for STRUCTURED research with explicit bias control.
For VOC collection, use /audience-research-agent instead.
```

### Phase 1: Question Generation (BEFORE Any Searching)

Generate 5-10 investigative questions organized by type.
Do NOT search yet — generate questions from prior knowledge first.

Display:
```
INVESTIGATING: "[topic]"

PHASE 1 — QUESTIONS (before searching)

FACTUAL (what we can measure or verify):
  Q1. [question about verifiable data or facts]
  Q2. [question about measurable outcomes]

CAUSAL (why things happen):
  Q3. [question about root cause or mechanism]
  Q4. [question about what drives the outcome]

COMPARATIVE (how things relate):
  Q5. [question comparing alternatives or options]
  Q6. [question about differences between cases]

COUNTERFACTUAL (challenging assumptions):
  Q7. What if the opposite were true?
  Q8. What evidence would make me change my conclusion?

BIAS-CHECK (making assumptions explicit):
  Q9. What am I assuming before I even start?
  Q10. Who benefits from the conclusion I expect to find?
```

### Phase 2: Explicit Bias Declaration

Before any research, declare known biases:

```
PHASE 2 — BIAS DECLARATION

Confirmation bias risks:
  "I might look for evidence that [expected conclusion]..."
  "I might dismiss sources that [contradict expectation]..."

Availability bias:
  "I might overweight [easily found or memorable examples]..."

Authority bias:
  "I might accept claims from [credible-sounding sources] without verifying..."

Framing bias:
  "The way I phrased '[topic]' already assumes [implicit assumption]..."
```

### Phase 3: Structured Research

Now run the actual searches. For each question from Phase 1, search with BOTH confirming and disconfirming queries.

For each major question, perform at minimum:
1. A query that would find CONFIRMING evidence
2. A query that would find CONTRADICTING evidence

Tag each finding as you go:

```
PHASE 3 — RESEARCH FINDINGS

Q1: [question]
  [CONFIRMS]   — [finding + source]
  [CONTRADICTS] — [finding + source]
  [NEUTRAL]    — [finding + source]

Q2: [question]
  [CONFIRMS]   — [finding + source]
  [CONFIRMS]   — [finding + source]
  [CONTRADICTS] — [finding + source]

[... continue for each question ...]
```

Finding tags:
- `[CONFIRMS]` — Evidence that supports the main hypothesis
- `[CONTRADICTS]` — Evidence that challenges or complicates the hypothesis
- `[NEUTRAL]` — Evidence that neither confirms nor contradicts
- `[UNCERTAIN]` — Finding where source reliability or relevance is unclear

### Phase 4: Synthesis with Explicit Confidence Levels

Present synthesized findings with explicit confidence declarations:

```
PHASE 4 — SYNTHESIS

CONCLUSION: [main finding in 1-2 sentences]

Supporting Evidence:
  [FATO] [CONFIANCA: ALTA] — [claim] [FONTE: source]
  [FATO] [CONFIANCA: MEDIA] — [claim] [FONTE: source]
  [REC]  [CONFIANCA: MEDIA] — [inference] [justified because: ...]

Contradicting Evidence:
  [FATO] [CONFIANCA: ALTA] — [claim that complicates the conclusion]
  Resolution: [how this was handled in the conclusion]

Unresolved Questions:
  - [question that research could not answer]
  - [question that requires more specialized sources]

CONFIDENCE IN CONCLUSION: [ALTA / MEDIA / BAIXA]
  Justification: [why this confidence level]

WHAT WOULD CHANGE THIS CONCLUSION:
  "[specific evidence or finding that would reverse the conclusion]"
```

### Phase 5: Application to Copy Chief Workflow

After synthesis, translate findings into actionable copy implications:

```
PHASE 5 — COPY IMPLICATIONS

For VOC / Research:
  [How this finding should shape VOC collection]

For Briefing / HELIX:
  [How this finding should inform MUP, MUS, or DRE selection]

For Production:
  [How this finding should shape copy angles, claims, or proof]

For Validation:
  [Claims that need blind_critic or EST validation before use]

Confidence-gated recommendations:
  If ALTA confidence: [use directly in copy with [FATO] tag]
  If MEDIA confidence: [qualify with "evidence suggests" language]
  If BAIXA confidence: [treat as hypothesis only, do not use as proof]
```

## Bias Tag Reference

| Tag | Meaning | When to Apply |
|-----|---------|--------------|
| `[CONFIRMS]` | Supports hypothesis | Finding that aligns with expected conclusion |
| `[CONTRADICTS]` | Challenges hypothesis | Finding that complicates or refutes |
| `[NEUTRAL]` | No clear direction | Background information, context |
| `[UNCERTAIN]` | Source or relevance unclear | Questionable source, indirect relevance |

## Confidence Levels

| Level | Criteria | Copy Usage |
|-------|----------|------------|
| ALTA | 3+ independent sources OR MCP-validated | Use directly as [FATO] |
| MEDIA | 1-2 sources OR single validation | Qualify with "data suggests" |
| BAIXA | Logical inference, no direct source | Hypothesis only — never use as proof |
| NAO SEI | No data available | Do not include in copy |

## Example Output (abbreviated)

For `/investigate "CoQ10 efficacy for tinnitus"`:

```
PHASE 1 — QUESTIONS
  Q1. What clinical trials exist on CoQ10 and tinnitus?
  Q2. What dosages show effects in studies?
  Q3. Why might CoQ10 help (mechanism)?
  Q4. What studies show no effect?
  Q5. What do patients report vs. what studies show?

PHASE 2 — BIASES
  Confirmation: "I might favor studies showing positive results because the offer uses CoQ10"
  Authority: "I might accept claims from naturopathic sites without checking methodology"

PHASE 3 — FINDINGS
  [CONFIRMS]   Q1: 2019 pilot study (n=20) showed 47% improvement — PubMed 30291234
  [CONTRADICTS] Q4: 2021 Cochrane review found insufficient evidence for any supplement
  [NEUTRAL]    Q3: CoQ10 reduces oxidative stress in cochlear cells (mechanism plausible)

PHASE 4 — SYNTHESIS
  [FATO] [CONFIANCA: MEDIA] — CoQ10 shows promise for tinnitus in small studies
  [FATO] [CONFIANCA: ALTA] — Larger systematic review finds insufficient evidence

COPY IMPLICATION: Use mechanism (oxidative stress) as the claim, not "proven to cure".
```

## Related

- `/audience-research-agent` — Full VOC extraction with Apify actors
- `/helix-system-agent` — HELIX briefing that uses research findings
- `/ingest` — Ingest discovered sources into the knowledge base
- `/dossier` — Store findings as structured dossier entries

---

*Sprint: S39 (Pipeline Commands)*
*Ref: `epistemic-protocol.md` — confidence levels and fact/rec tagging*
*Ref: `voc-research.md` § VOC Quality Protocol — for avatar-specific research*
*Ref: `debugging-hypothesis.md` — hypothesis-based approach*
