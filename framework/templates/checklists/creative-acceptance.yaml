# Creative Acceptance Checklist v1.0
# Segue: checklist-definition.schema.yaml
# Fontes: tool-usage-matrix.md, copy-squad-constitution.md
# Criado: 2026-02-27

id: creative-acceptance
name: "Criterios de Aceitacao — Criativo"
applies_to: creative
gate: production

tasks:
  - id: crt-bc
    name: "Rodar blind_critic no criativo"
    owner: "@critic"
    tools: [blind_critic]
    order: 1

  - id: crt-est
    name: "Rodar emotional_stress_test no criativo"
    owner: "@critic"
    tools: [emotional_stress_test]
    depends_on: [crt-bc]
    order: 2

  - id: crt-black-validation
    name: "Rodar black_validation como gate final"
    owner: "@gatekeeper"
    tools: [black_validation]
    depends_on: [crt-est]
    order: 3

criteria:
  - id: bc-score
    criterion: "blind_critic score >= 8"
    type: score
    tool: blind_critic
    threshold: 8
    operator: ">="
    blocking: true

  - id: est-genericidade
    criterion: "emotional_stress_test genericidade >= 8"
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
    - "tool-usage-matrix.md § Tasks por Deliverable / Criativo"
    - "copy-squad-constitution.md § Checklist de Saida — Scout"
