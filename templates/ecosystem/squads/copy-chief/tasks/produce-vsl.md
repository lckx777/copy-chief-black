---
task:
  id: produce-vsl
  title: "VSL Script Production"
  agent: echo
  input:
    - type: file
      path: "{offer}/briefings/helix-complete.md"
    - type: file
      path: "{offer}/mecanismo-unico.yaml"
  output:
    - type: directory
      path: "{offer}/production/vsl/"
  checklist:
    - item: "write_chapter for each of 6 chapters"
    - item: "blind_critic >= 8 per chapter"
    - item: "DRE escalation mapped per chapter"
    - item: "Retention per second architecture"
    - item: "emotional_stress_test >= 8 on complete VSL"
    - item: "layered_review (3 layers)"
    - item: "black_validation >= 8"
---

## Instructions

Produce VSL script in 6 chapters using write_chapter MCP tool. Each chapter is a persuasion unit with mapped emotional entry/exit points. Lead chapter sells desire to keep watching (not the product). Validate each chapter with blind_critic. Run emotional_stress_test on complete VSL. Final black_validation before delivery.
