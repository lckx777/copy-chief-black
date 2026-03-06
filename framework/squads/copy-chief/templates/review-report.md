# Review Report Output Template

```yaml
template:
  id: review-report
  version: 1.0.0
  created: 2026-03-06
  purpose: "Structured output format for copy review and validation reports by @critic (Hawk) and @gatekeeper (Sentinel)"
  used_by: ["@critic", "@gatekeeper"]
  output_path: "{offer}/production/{deliverable_type}/reviews/{DELIVERABLE_NAME}-review.md"
```

---

## Template Body

```markdown
---
review_type: {{REVIEW_TYPE}}
deliverable_name: "{{DELIVERABLE_NAME}}"
deliverable_type: {{DELIVERABLE_TYPE}}
offer: {{OFFER_NAME}}
reviewer: {{REVIEWER}}
date: {{DATE}}
verdict: {{VERDICT}}
average_score: {{AVERAGE_SCORE}}
status: complete
---

# Review Report: {{DELIVERABLE_NAME}}

> Type: {{REVIEW_TYPE}} | Reviewer: {{REVIEWER}} | Verdict: **{{VERDICT}}**

---

## Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | {{SCORES.clarity}}/10 | |
| DRE | {{SCORES.dre}}/10 | |
| Believability | {{SCORES.believability}}/10 | |
| Flow | {{SCORES.flow}}/10 | |
| Specificity | {{SCORES.specificity}}/10 | |
| Urgency | {{SCORES.urgency}}/10 | |
| Uniqueness | {{SCORES.uniqueness}}/10 | |
| Proof | {{SCORES.proof}}/10 | |
| CTA | {{SCORES.cta}}/10 | |
| **Average** | **{{AVERAGE_SCORE}}/10** | |

---

## Anti-Homogenization Check

{{ANTI_HOMOG_CHECK}}

- **Red flags found:** ___/10 patterns checked
- **Specific flags:** [list each AI pattern detected]
- **Penalty applied:** ___ (0 if <= 2 flags; -0.5 per flag beyond 2)
- **Adjusted average:** ___/10

---

## Verdict: {{VERDICT}}

[[LLM: VERDICT DETERMINATION

Based on the adjusted average score:
- >= 7.0 = PASS
- 5.0 - 6.9 = NEEDS_REVISION
- < 5.0 = FAIL

State the verdict clearly and explain WHY in one sentence.]]

**Decision:** {{VERDICT}}
**Adjusted Score:** {{AVERAGE_SCORE}}/10

---

## Strengths

> What this deliverable does well. Be specific — cite exact lines or sections.

{{STRENGTHS}}

---

## Weaknesses

> What needs improvement. Be specific — cite exact lines or sections and explain WHY
> they are weak, not just THAT they are weak.

{{WEAKNESSES}}

---

## Required Fixes

> Actionable instructions for the production agent. Each fix should be specific enough
> to execute without ambiguity. Prioritized by impact.

{{FIXES_REQUIRED}}

1. **[Priority: HIGH/MEDIUM/LOW]** — [Specific fix instruction]
2. **[Priority: HIGH/MEDIUM/LOW]** — [Specific fix instruction]
3. ...

---

## Additional Notes

{{NOTES}}

---

## Review Metadata

```yaml
review_summary:
  review_type: "{{REVIEW_TYPE}}"
  deliverable: "{{DELIVERABLE_NAME}}"
  deliverable_type: "{{DELIVERABLE_TYPE}}"
  offer: "{{OFFER_NAME}}"
  reviewer: "{{REVIEWER}}"
  date: "{{DATE}}"
  scores:
    clarity: {{SCORES.clarity}}
    dre: {{SCORES.dre}}
    believability: {{SCORES.believability}}
    flow: {{SCORES.flow}}
    specificity: {{SCORES.specificity}}
    urgency: {{SCORES.urgency}}
    uniqueness: {{SCORES.uniqueness}}
    proof: {{SCORES.proof}}
    cta: {{SCORES.cta}}
  anti_homog_penalty: ___
  average_raw: ___
  average_adjusted: {{AVERAGE_SCORE}}
  verdict: "{{VERDICT}}"
  strengths_count: ___
  weaknesses_count: ___
  fixes_required_count: ___
  high_priority_fixes: ___
```
```

---

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{REVIEW_TYPE}}` | Type of review conducted | `blind-critic`, `full-validation`, `black-validation`, `emotional-stress-test` |
| `{{DELIVERABLE_NAME}}` | File name of the reviewed deliverable | `chapter-01.md`, `batch-02.md`, `block-05-proof.md` |
| `{{DELIVERABLE_TYPE}}` | Category of deliverable | `vsl-chapter`, `creative-batch`, `lp-block`, `email` |
| `{{OFFER_NAME}}` | Offer identifier | `florayla`, `neuvelys`, `cognixor` |
| `{{REVIEWER}}` | Reviewing agent handle | `@critic`, `@gatekeeper` |
| `{{SCORES}}` | Object containing 9 dimension scores | `{clarity: 8, dre: 7, ...}` |
| `{{SCORES.clarity}}` | Clarity dimension score | `8` |
| `{{SCORES.dre}}` | DRE dimension score | `7` |
| `{{SCORES.believability}}` | Believability dimension score | `9` |
| `{{SCORES.flow}}` | Flow dimension score | `7` |
| `{{SCORES.specificity}}` | Specificity dimension score | `6` |
| `{{SCORES.urgency}}` | Urgency dimension score | `8` |
| `{{SCORES.uniqueness}}` | Uniqueness dimension score | `7` |
| `{{SCORES.proof}}` | Proof dimension score | `8` |
| `{{SCORES.cta}}` | CTA dimension score (or `N/A`) | `9` or `N/A` |
| `{{AVERAGE_SCORE}}` | Calculated average (adjusted for anti-homog) | `7.4` |
| `{{VERDICT}}` | Review decision | `PASS`, `NEEDS_REVISION`, `FAIL` |
| `{{STRENGTHS}}` | Specific strong points with citations | Multi-line text with quoted examples |
| `{{WEAKNESSES}}` | Specific weak points with citations | Multi-line text with quoted examples |
| `{{FIXES_REQUIRED}}` | Prioritized, actionable fix instructions | Numbered list with priority tags |
| `{{ANTI_HOMOG_CHECK}}` | Anti-homogenization analysis | Red flags found, patterns detected |
| `{{NOTES}}` | Additional reviewer observations | Compliance flags, strategic suggestions |
| `{{DATE}}` | Review date | `2026-03-06` |

---

## Usage Notes

[[LLM: USAGE GUIDANCE FOR @CRITIC (HAWK) AND @GATEKEEPER (SENTINEL)

1. Read the deliverable AND the offer context before scoring
   - CONTEXT.md for offer background
   - mecanismo-unico.yaml for MUP/MUS reference
   - research/synthesis.md for avatar and DRE validation
2. Score each dimension INDEPENDENTLY (do not let halo effect inflate scores)
3. Use the calibration files before scoring:
   - data/critic/exemplos-aprovados.md — What 8+ looks like
   - data/critic/exemplos-reprovados.md — What 4- looks like
4. STRENGTHS section: cite specific lines from the copy that work well
5. WEAKNESSES section: cite specific lines AND explain why they are weak
6. FIXES section: each fix must be executable — "Rewrite paragraph 3 to..."
   not "improve the flow"
7. The YAML metadata block at the bottom is machine-readable for dashboards
8. Review types and their contexts:
   - blind-critic: First pass, no context about previous reviews
   - full-validation: After revisions, with context of previous scores
   - black-validation: Final gate, highest bar, run by @gatekeeper
   - emotional-stress-test: DRE-specific deep dive

REVIEW PHILOSOPHY:
- Be the critic the copy NEEDS, not the critic it wants
- Every weakness must come with a fix
- Praise what works — it teaches the production agent what to do MORE of
- A NEEDS_REVISION verdict is not failure — it is the normal iteration cycle]]

---

**Version:** 1.0.0
**Created:** 2026-03-06
**Standard:** Copy Chief BLACK Review Pipeline
