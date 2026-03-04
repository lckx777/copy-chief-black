# Landing Page Acceptance Checklist v1.0
# Segue: checklist-definition.schema.yaml
# Fontes: tool-usage-matrix.md, copy-squad-constitution.md
# Criado: 2026-02-27

id: landing-page-acceptance
name: "Criterios de Aceitacao — Landing Page"
applies_to: landing-page
gate: production

tasks:
  - id: lp-bc-per-block
    name: "Rodar blind_critic por bloco (14 blocos)"
    owner: "@critic"
    tools: [blind_critic]
    order: 1

  - id: lp-est-complete
    name: "Rodar emotional_stress_test na LP completa"
    owner: "@critic"
    tools: [emotional_stress_test]
    depends_on: [lp-bc-per-block]
    order: 2

  - id: lp-layered-review
    name: "Aplicar layered_review em 3 camadas"
    owner: "@critic"
    tools: [layered_review]
    depends_on: [lp-est-complete]
    order: 3

  - id: lp-black-validation
    name: "Rodar black_validation como gate final"
    owner: "@gatekeeper"
    tools: [black_validation]
    depends_on: [lp-layered-review]
    order: 4

criteria:
  - id: bc-score-block
    criterion: "blind_critic score >= 8 por bloco"
    type: score
    tool: blind_critic
    threshold: 8
    operator: ">="
    blocking: true

  - id: est-genericidade
    criterion: "emotional_stress_test genericidade >= 8 na LP completa"
    type: score
    tool: emotional_stress_test
    threshold: 8
    operator: ">="
    blocking: true

  - id: bv-final
    criterion: "black_validation score >= 8"
    type: score
    tool: black_validation
    threshold: 8
    operator: ">="
    blocking: true

metadata:
  version: "1.0.0"
  sources:
    - "tool-usage-matrix.md § Tasks por Deliverable / Landing Page"
    - "copy-squad-constitution.md § Checklist de Saida — Forge"
