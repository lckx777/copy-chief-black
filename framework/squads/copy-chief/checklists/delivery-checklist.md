# Delivery Checklist

```yaml
checklist:
  id: delivery-checklist
  version: 1.0.0
  created: 2026-03-06
  purpose: "Final validation before marking an offer as DELIVERED — ensures all deliverables are produced, reviewed, and organized"
  mode: blocking  # ALL items must pass for delivery
  pipeline_phase: delivery
  triggered_by: "@chief (Helix) after all production and review cycles are complete"
```

---

## Instructions

[[LLM: INITIALIZATION INSTRUCTIONS - DELIVERY CHECKLIST

This is the FINAL gate before an offer is marked as DELIVERED. It validates that:
1. All planned deliverables have been produced
2. All deliverables passed quality review
3. Files are properly organized
4. State tracking is updated

EXECUTION APPROACH:

1. Read the offer's project_state.yaml or helix-state.yaml to identify planned deliverables
2. Verify each deliverable file exists in production/
3. Cross-reference each deliverable against quality gate scores
4. Check file organization and naming
5. Verify state files are current
6. Confirm git status is clean

This checklist is the last line of defense. If something is wrong, catch it here.
Once DELIVERED, the offer enters maintenance mode and production resources move on.

IMPORTANT: Do NOT mark DELIVERED if any deliverable scored below 7.0 on the quality gate.
A partial delivery with documented gaps is better than a full delivery with hidden problems.]]

---

## Deliverable Completeness

[[LLM: Check the offer's planned deliverables against what actually exists.
The standard set is: VSL, Landing Page, Creatives, Emails. But some offers may
have fewer (e.g., no email sequence). Check project_state.yaml for the planned set.
Each deliverable that was planned MUST be present.]]

- [ ] **All planned deliverables produced** — Every deliverable listed in project_state.yaml exists as files in `{offer}/production/`:
  - [ ] VSL chapters in `production/vsl/`
  - [ ] Landing Page blocks in `production/landing-page/`
  - [ ] Ad creatives in `production/creatives/`
  - [ ] Email sequence in `production/emails/` (if planned)

### Review Validation

[[LLM: Every deliverable must have gone through the review pipeline.
Check for review report files or quality gate scores in the offer directory.
A deliverable without a review is NOT ready for delivery.]]

- [ ] **All deliverables passed blind_critic** — Each deliverable has a corresponding review with `blind_critic` score >= 8
- [ ] **All deliverables passed full_validation** — `black_validation` has been run on the complete package with score >= 8
- [ ] **Quality gate scores >= 7.0** — All 9 dimensions average >= 7.0 across all deliverables (per `copy-quality-gate.md`)

### Anti-Homogenization

[[LLM: Check the complete body of work as a WHOLE, not just individual pieces.
Do the creatives all sound the same? Does the VSL voice match the LP voice
(when they should be different)? Is there variety across the portfolio?]]

- [ ] **Anti-homogenization check passed** — No more than 2 red flags across any individual deliverable; variety exists across deliverables in the same offer

---

## File Organization

[[LLM: Check the directory structure. Files should be logically organized,
clearly named, and not contain orphaned drafts or stale versions.]]

- [ ] **Files organized in production/ directory structure:**
  ```
  {offer}/production/
    vsl/          → chapter-01.md, chapter-02.md, ...
    landing-page/ → block-01-hero.md, block-02-problem.md, ...
    creatives/    → batch-01.md, batch-02.md, ...
    emails/       → email-01-welcome.md, email-02-story.md, ...
  ```
- [ ] **No orphaned or stale files in production/** — No `*-draft.md`, `*-old.md`, `*-v2.md` remnants; only final versions remain
- [ ] **Naming convention consistent** — All files follow the pattern: `{type}-{number}-{descriptor}.md`

---

## State Tracking

[[LLM: The offer's state files must reflect reality. helix-state.yaml should
show DELIVERED status. project_state.yaml should be current. Git should be clean.]]

- [ ] **helix-state.yaml updated to DELIVERED** — Field `status` or `gates.delivery.status` is `DELIVERED` with timestamp
- [ ] **project_state.yaml current** — Reflects final deliverable list, final scores, delivery date
- [ ] **Git committed with conventional commit message** — All production files committed with message format: `feat({offer}): deliver {deliverable-type}` or `chore({offer}): mark delivered`

---

## Portfolio (If Applicable)

[[LLM: If the squad maintains a portfolio or summary of delivered offers,
update it. This is optional for offers not yet in a portfolio tracking system.
Mark N/A if portfolio tracking is not set up for this offer.]]

- [ ] **Portfolio summary updated** — Offer entry added/updated in portfolio tracker with: offer name, niche, delivery date, quality scores (or N/A if not applicable)

---

## Verdict Determination

[[LLM: VERDICT RULES

Count all items (excluding N/A):

- ALL items must be [x] PASSED for DELIVERED verdict
- ANY [ ] FAIL blocks delivery

If items 1-4 (deliverables) fail → return to production
If items 5-7 (review) fail → return to review cycle
If items 8-10 (organization) fail → fix organization then re-check
If items 11-13 (state) fail → update state files then re-check

VERDICT:
- All passed = DELIVERED — Mark offer as delivered, update helix-state.yaml
- Any failed = NOT_READY — Return specific failures with remediation steps

Return format:
```yaml
delivery_result:
  offer: "{offer_name}"
  verdict: "{DELIVERED|NOT_READY}"
  passed: "{count}/{total}"
  delivery_date: "{YYYY-MM-DD}"
  failures:
    - item: "{failed item}"
      category: "{deliverables|review|organization|state}"
      remediation: "{what needs to happen}"
  deliverables_summary:
    vsl_chapters: {n}
    lp_blocks: {n}
    creatives: {n}
    emails: {n}
  quality_summary:
    average_score: {n.n}
    weakest_dimension: "{dimension}: {score}"
```]]

---

## Integration Notes

| Trigger | Agent | Context |
|---------|-------|---------|
| After all production + review complete | @chief (Helix) | Manual or via workflow completion |
| After fixing delivery blockers | @chief (Helix) | Re-run to verify fixes |
| Portfolio update | @strategist | Reads delivery results for portfolio analysis |

**Related checklists:**
- `production-preflight.md` — Pre-production gate (must have passed before we get here)
- `copy-quality-gate.md` — Per-deliverable quality scoring (referenced in review items)

**Related files:**
- `{offer}/helix-state.yaml` — Offer pipeline state
- `{offer}/project_state.yaml` — Offer project tracking
- `{offer}/production/` — All deliverable files

---

**Version:** 1.0.0
**Created:** 2026-03-06
**Standard:** Copy Chief BLACK Delivery Pipeline
