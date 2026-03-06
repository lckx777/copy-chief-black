# Production Pre-Flight Checklist

```yaml
checklist:
  id: production-preflight
  version: 1.0.0
  created: 2026-03-06
  purpose: "Validate all prerequisites before launching any production task (VSL, LP, Creatives, Emails)"
  mode: blocking  # ALL items must pass. Any failure blocks production start.
  pipeline_phase: pre-production
  triggered_by: "@chief routing a production task to @vsl, @lp, @creative, or @producer"
```

---

## Instructions

[[LLM: INITIALIZATION INSTRUCTIONS - PRODUCTION PRE-FLIGHT

This checklist runs BEFORE any production agent starts writing copy. It validates that
Research, Briefing, and Mecanismo phases are complete and all required inputs exist.

EXECUTION APPROACH:

1. Read the offer's helix-state.yaml to check gate statuses
2. Read mecanismo-unico.yaml to verify MUP/MUS approval
3. Verify research synthesis exists and contains avatar + DRE
4. Confirm briefing completeness (all 10 HELIX phases)
5. Check that craft data and agent-specific data are accessible
6. Verify output directory structure exists

If ANY item fails, STOP. Do not proceed to production. Report the failure to @chief
with the specific item that blocked and what is needed to unblock.

IMPORTANT: This is a hard gate. No exceptions. Producing copy without validated
inputs leads to wasted cycles and low-quality output that fails review.]]

---

## Pre-Flight Items

### Phase Gates

[[LLM: Check helix-state.yaml at {offer}/.aios/helix-state.yaml or {offer}/helix-state.yaml.
Each gate must show status: PASSED or equivalent. If the file does not exist, FAIL immediately.]]

- [ ] **Research gate PASSED** — `helix-state.yaml` field `gates.research.status` is `PASSED`
- [ ] **Briefing gate PASSED** — All 10 HELIX phases show `status: complete` in `helix-state.yaml`
- [ ] **Mecanismo APPROVED** — `mecanismo-unico.yaml` field `status` is `APPROVED` (not DRAFT or PENDING)

### Research Inputs

[[LLM: Verify these files exist and contain substantive content (not empty/placeholder).
The synthesis should have avatar demographics, psychographics, and validated DRE.
If synthesis.md is missing, research has not been completed.]]

- [ ] **Avatar profile complete** — `{offer}/research/synthesis.md` exists and contains avatar section with demographics + psychographics
- [ ] **DRE identified and validated** — Synthesis or helix-state contains explicit DRE (fear, shame, frustration, or other) with escalation level (1-5)
- [ ] **One Belief statement defined** — A single core belief the audience must adopt is documented in briefing or helix-state

### Data Dependencies

[[LLM: These are shared knowledge files the production agents need. Verify they exist
at the expected paths. If data/craft/ is missing, the agent will produce generic copy
without the squad's accumulated knowledge.]]

- [ ] **Craft data loaded** — Directory `squads/copy-chief/data/craft/` exists with files: `psicologia.md`, `escrita.md`, `checklist.md`, `erros-comuns.md`
- [ ] **Agent-specific data loaded** — Appropriate data directory exists for the production type:
  - VSL: `squads/copy-chief/data/leads/`
  - LP: `squads/copy-chief/data/lp/`
  - Creatives: `squads/copy-chief/data/creative/`
  - Review: `squads/copy-chief/data/critic/`

### Output Infrastructure

[[LLM: The production directory must exist before writing begins. If it does not exist,
create it. Also check that no other agent is currently writing to the same deliverable
(check for .lock files or active dispatch-queue entries).]]

- [ ] **Output directory exists** — `{offer}/production/{deliverable}/` directory is present (create if missing)
- [ ] **No conflicting production in progress** — No `.lock` file in the output directory; no active dispatch-queue entry targeting the same deliverable

---

## Verdict Determination

[[LLM: VERDICT RULES

Count the results:

- ALL 10 items must be [x] PASSED
- ANY single [ ] FAIL blocks production entirely

VERDICT:
- 10/10 passed = GO — Production may begin
- <10 passed = NO-GO — List each failed item with specific remediation

If NO-GO, return this format:
```yaml
preflight_result:
  verdict: NO-GO
  passed: {count}/10
  failures:
    - item: "{failed item name}"
      reason: "{why it failed}"
      remediation: "{what needs to happen}"
  next_action: "{who needs to do what}"
```

If GO, return:
```yaml
preflight_result:
  verdict: GO
  passed: 10/10
  offer: "{offer_name}"
  deliverable: "{deliverable_type}"
  production_agent: "{agent handle}"
```]]

---

## Integration Notes

| Trigger | Agent | Hook |
|---------|-------|------|
| Before any production task dispatch | @chief (Helix) | `pipeline-enforcer.cjs` checks this gate |
| Manual invocation | Any agent | `*preflight {offer} {deliverable}` |
| Automated via workflow | `copy-workflow-executor.js` | Step 0 of any production workflow |

**Related files:**
- `{offer}/helix-state.yaml` — Gate statuses
- `{offer}/mecanismo-unico.yaml` — MUP/MUS approval
- `{offer}/research/synthesis.md` — Avatar and DRE
- `squads/copy-chief/data/` — Shared knowledge

---

**Version:** 1.0.0
**Created:** 2026-03-06
**Standard:** Copy Chief BLACK Production Pipeline
