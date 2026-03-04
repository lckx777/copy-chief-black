---
task:
  id: produce-emails
  title: "Email Sequence Production"
  agent: blade
  input:
    - type: file
      path: "{offer}/briefings/helix-complete.md"
    - type: directory
      path: "{offer}/production/vsl/"
  output:
    - type: directory
      path: "{offer}/production/emails/"
  checklist:
    - item: "blind_critic >= 8 per email"
    - item: "DRE in subject line"
    - item: "emotional_stress_test >= 8 on sequence"
    - item: "black_validation >= 8"
---

## Instructions

Produce email sequence that references VSL narrative and LP structure. Each email activates DRE in subject line. Subject lines are DRE-loaded, not clever. Body escalates emotion and drives to action. Validate each email with blind_critic.
