---
description: Diagnose why an offer isn't converting — cross-check all quality areas
argument-hint: "[offer-name]"
---

# Diagnose Offer — Cross-System Quality Audit

**Arguments:** $ARGUMENTS

## Step 1: Locate the Offer

Extract offer name from `$ARGUMENTS`. Search for the offer directory:

```bash
find ~/copywriting-ecosystem -maxdepth 3 -name "helix-state.yaml" 2>/dev/null
```

Match the offer name (case-insensitive, partial match OK) to find the offer root path.

If no match found, list available offers and ask the user to clarify.

## Step 2: Run 5 Diagnostic Checks

For each check, assign a status: **PASS** (green), **WARN** (yellow), or **FAIL** (red).

---

### Check 1: VOC Quality

Read `{offer}/research/synthesis.md` and `{offer}/research/voc/summary.md`.

| Criterion | PASS | WARN | FAIL |
|-----------|------|------|------|
| synthesis.md exists | Yes | — | No |
| Confidence score | >= 80% | 70-79% | < 70% or missing |
| Platforms with quotes | 4+ | 2-3 | 0-1 |
| Total quotes | 100+ | 50-99 | < 50 |
| DRE defined | Yes, with escalada | Mentioned but vague | Missing |
| Emotions categorized | 5+ categories | 3-4 | < 3 |

**Score:** Count PASS=2pts, WARN=1pt, FAIL=0pts. Max 12. Normalize to /10.

---

### Check 2: MUP/MUS Quality

Read `{offer}/mecanismo-unico.yaml`.

| Criterion | PASS | WARN | FAIL |
|-----------|------|------|------|
| File exists | Yes | — | No |
| State | APPROVED | VALIDATED | DRAFT/UNDEFINED |
| MUP nova_causa filled | Yes, specific | Generic | Empty |
| MUP sexy_cause filled | Yes, transmissible | Exists but weak | Empty |
| MUS gimmick_name filled | Yes, sticky | Exists but weak | Empty |
| MUS origin_story filled | Yes, with paradox | Exists but generic | Empty |
| MUS authority_hook filled | Yes, super structure | Exists but weak | Empty |
| RMBC avg score | >= 8 | 7-7.9 | < 7 or missing |

**Score:** Count PASS=2pts, WARN=1pt, FAIL=0pts. Max 16. Normalize to /10.

---

### Check 3: Copy Quality (Production Gates)

Read `{offer}/helix-state.yaml` for tools_used in production phase. Check for validation scores.

| Criterion | PASS | WARN | FAIL |
|-----------|------|------|------|
| blind_critic used | Yes, score >= 8 | Used, score < 8 | Not used |
| emotional_stress_test used | Yes, score >= 8 | Used, score < 8 | Not used |
| layered_review used | Yes | — | Not used |
| black_validation used | Yes, score >= 8 | Used, score < 8 | Not used |

Also check for production files:

| Criterion | PASS | WARN | FAIL |
|-----------|------|------|------|
| Production files exist | Expected count met | Partial | 0 files |

**Score:** Normalize to /10.

---

### Check 4: Avatar Alignment

Read `{offer}/research/avatar/summary.md` and `{offer}/briefings/phases/fase-02-*.md` or `fase-03-*.md`.

| Criterion | PASS | WARN | FAIL |
|-----------|------|------|------|
| Avatar summary exists | Yes | — | No |
| DRE explicitly defined | Yes, with type + escalada | Type only | Missing |
| Escalada documented (5 levels) | 3+ levels | 1-2 levels | None |
| Consciousness level defined | Yes | — | No |
| Failed solutions listed | 4+ with quotes | 1-3 | None |
| VOC quotes support DRE | 10+ quotes match | 5-9 | < 5 |

**Score:** Normalize to /10.

---

### Check 5: Funnel Completeness

Check production directories for expected deliverables.

**For TSL (Landing Page) offers:**

| Criterion | PASS | WARN | FAIL |
|-----------|------|------|------|
| LP blocks produced | 14/14 | 7-13 | < 7 |
| Criativos produced | 3+ | 1-2 | 0 |
| Email sequence | Exists | — | Missing |

**For VSL offers:**

| Criterion | PASS | WARN | FAIL |
|-----------|------|------|------|
| VSL chapters produced | 6/6 | 3-5 | < 3 |
| LP blocks produced | 14/14 | 7-13 | < 7 |
| Criativos produced | 3+ | 1-2 | 0 |
| Email sequence | Exists | — | Missing |

**Score:** Normalize to /10.

---

## Step 3: Generate Diagnostic Report

### Output Format

```markdown
# Diagnostic Report: {offer-name}
## Date: {YYYY-MM-DD}

---

### Summary

| Area | Score | Status |
|------|-------|--------|
| VOC Quality | X/10 | PASS/WARN/FAIL |
| MUP/MUS Quality | X/10 | PASS/WARN/FAIL |
| Copy Quality | X/10 | PASS/WARN/FAIL |
| Avatar Alignment | X/10 | PASS/WARN/FAIL |
| Funnel Completeness | X/10 | PASS/WARN/FAIL |
| **Overall** | **X/10** | **STATUS** |

Status thresholds: >= 8 = PASS, 6-7.9 = WARN, < 6 = FAIL

---

### Probable Root Cause

{Identify the area with the LOWEST score. Explain WHY this is likely the bottleneck.}

### Recommended Actions (by priority)

1. **[CRITICAL]** {Action for lowest-scoring area}
2. **[HIGH]** {Action for second-lowest area}
3. **[MEDIUM]** {Actions for WARN areas}

### Detailed Findings

{For each of the 5 checks, list every criterion with its status and specific evidence found.}
```

## Step 4: Save Report

**If the offer has a production/ directory:**
```bash
mkdir -p {offer-path}/reviews/
# Write to: {offer-path}/reviews/diagnostic-{YYYY-MM-DD}.md
```

**If no production/ directory:**
Output the full report in chat.

## Constraints

- NEVER guess scores. Read the actual files and count real evidence.
- NEVER skip a check. All 5 areas must be evaluated even if files are missing (that's a FAIL).
- The root cause analysis must be SPECIFIC, not "needs improvement." Say exactly WHAT is missing.
- Recommended actions must be ACTIONABLE — specific commands or files to create/edit.
- If an offer is in early phases (research/briefing), it's EXPECTED that production checks fail. Note this context.
