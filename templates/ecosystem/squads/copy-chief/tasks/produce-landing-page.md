---
task:
  id: produce-landing-page
  title: "Landing Page Copy Production"
  agent: forge
  input:
    - type: file
      path: "{offer}/briefings/helix-complete.md"
    - type: file
      path: "{offer}/mecanismo-unico.yaml"
  output:
    - type: directory
      path: "{offer}/production/landing-page/"
  checklist:
    - item: "14 blocks produced in sequence"
    - item: "blind_critic >= 8 per block"
    - item: "Emotional continuity between adjacent blocks"
    - item: "emotional_stress_test >= 8 on complete LP"
    - item: "layered_review (3 layers)"
    - item: "black_validation >= 8"
---

## Instructions

Build landing page as 14 persuasive micro-conversion blocks. Each block has a specific emotional function. Maintain emotional continuity between adjacent blocks. Objection timing is as important as objection handling. Validate each block with blind_critic. Run emotional_stress_test on complete LP.
