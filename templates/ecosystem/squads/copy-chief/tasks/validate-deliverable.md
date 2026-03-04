---
task:
  id: validate-deliverable
  title: "Adversarial Deliverable Validation"
  agent: hawk
  input:
    - type: directory
      path: "{offer}/production/"
  output:
    - type: file
      path: "{offer}/production/validation-report.md"
  checklist:
    - item: "5-phase adversarial process completed"
    - item: "blind_critic >= 8 per unit"
    - item: "emotional_stress_test genericidade >= 8"
    - item: "Logo Test PASS"
    - item: "black_validation >= 8"
    - item: "Binary verdict: PASS or NEEDS_REVISION"
---

## Instructions

Run full adversarial validation. 5 phases: Decompose cold, Stress test, Adversarial challenge, Zen/MCP validation, Final Verdict. Job is NOT to validate but to CHALLENGE. If copy doesn't break here, the market will break it later. Return PASS or NEEDS_REVISION with specific, actionable issues.
