---
task:
  id: validate-mecanismo
  title: "Mecanismo Unico Validation"
  agent: sentinel
  input:
    - type: file
      path: "{offer}/mecanismo-unico.yaml"
  output:
    - type: file
      path: "{offer}/mecanismo-unico.yaml"
  checklist:
    - item: "4 Puzzle Pieces defined (Sexy Cause, Gimmick Name, Origin Story, Authority Hook)"
    - item: "RMBC scores >= 7 for all criteria"
    - item: "consensus validates mechanism"
    - item: "State advanced to VALIDATED"
    - item: "Human approval for APPROVED"
---

## Instructions

Validate Mecanismo Unico against RMBC criteria (Digerivel, Unico, Provavel, Conectado). Verify all 4 Puzzle Pieces are defined. Run consensus for multi-model validation. Advance state from PENDING to VALIDATED. Human approval required for APPROVED state.
