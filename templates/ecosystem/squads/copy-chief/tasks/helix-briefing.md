---
task:
  id: helix-briefing
  title: "HELIX 10-Phase Strategic Briefing"
  agent: atlas
  input:
    - type: file
      path: "{offer}/research/synthesis.md"
    - type: file
      path: "{offer}/CONTEXT.md"
  output:
    - type: directory
      path: "{offer}/briefings/phases/"
    - type: file
      path: "{offer}/briefings/helix-complete.md"
  checklist:
    - item: "get_phase_context at start of each phase"
    - item: "10 phases completed sequentially"
    - item: "consensus validates TOP 3 MUP candidates"
    - item: "blind_critic >= 8 for MUP statement"
    - item: "blind_critic >= 8 for MUS statement"
    - item: "emotional_stress_test >= 8 for MUP+MUS"
    - item: "voc_search confirms language alignment"
    - item: "Human approval at phases 5-6"
---

## Instructions

Execute the 10-phase HELIX briefing system. Each phase builds on the previous. Phases 5-6 (MUP/MUS) require consensus validation and human approval before advancing. All claims must trace to VOC or research data. Create helix-complete.md as the master briefing document.
