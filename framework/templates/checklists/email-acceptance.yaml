# Email Acceptance Checklist v1.0
# Segue: checklist-definition.schema.yaml
# Fontes: tool-usage-matrix.md, constraint-progressivo.md
# Criado: 2026-02-27

id: email-acceptance
name: "Criterios de Aceitacao — Email Sequence"
applies_to: email
gate: production

tasks:
  - id: email-bc-per-email
    name: "Rodar blind_critic por email"
    owner: "@critic"
    tools: [blind_critic]
    order: 1

  - id: email-est-complete
    name: "Rodar emotional_stress_test na sequencia completa"
    owner: "@critic"
    tools: [emotional_stress_test]
    depends_on: [email-bc-per-email]
    order: 2

  - id: email-black-validation
    name: "Rodar black_validation como gate final"
    owner: "@gatekeeper"
    tools: [black_validation]
    depends_on: [email-est-complete]
    order: 3

criteria:
  - id: bc-score-email
    criterion: "blind_critic score >= 8 por email"
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
    - "tool-usage-matrix.md § Tasks por Deliverable / Email"
    - "constraint-progressivo.md § Email Sequence (7 Emails)"
