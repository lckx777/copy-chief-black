# VSL Acceptance Checklist v1.0
# Segue: checklist-definition.schema.yaml
# Fontes: tool-usage-matrix.md, copy-squad-constitution.md, constraint-progressivo.md
# Criado: 2026-02-27

id: vsl-acceptance
name: "Criterios de Aceitacao — VSL"
applies_to: vsl
gate: production

tasks:
  - id: vsl-write-chapters
    name: "Escrever 6 capitulos da VSL"
    owner: "@vsl"
    tools: [write_chapter]
    order: 1

  - id: vsl-bc-per-chapter
    name: "Rodar blind_critic apos cada capitulo"
    owner: "@critic"
    tools: [blind_critic]
    depends_on: [vsl-write-chapters]
    order: 2

  - id: vsl-est-complete
    name: "Rodar emotional_stress_test na VSL completa"
    owner: "@critic"
    tools: [emotional_stress_test]
    depends_on: [vsl-bc-per-chapter]
    order: 3

  - id: vsl-layered-review
    name: "Aplicar layered_review em 3 camadas (Cortar, Visceralidade, Voz Alta)"
    owner: "@critic"
    tools: [layered_review]
    depends_on: [vsl-est-complete]
    order: 4

  - id: vsl-black-validation
    name: "Rodar black_validation como gate final"
    owner: "@gatekeeper"
    tools: [black_validation]
    depends_on: [vsl-layered-review]
    order: 5

  - id: vsl-human-mup
    name: "Submeter MUP para aprovacao humana antes de produzir"
    owner: "@chief"
    tools: []
    order: 0  # Pre-condicao

criteria:
  - id: bc-score-chapter
    criterion: "blind_critic score >= 8 em cada capitulo"
    type: score
    tool: blind_critic
    threshold: 8
    operator: ">="
    blocking: true
    weight: 1.0

  - id: est-genericidade
    criterion: "emotional_stress_test genericidade >= 8 na VSL completa"
    type: score
    tool: emotional_stress_test
    threshold: 8
    operator: ">="
    blocking: true
    weight: 1.0

  - id: bv-final
    criterion: "black_validation score >= 8"
    type: score
    tool: black_validation
    threshold: 8
    operator: ">="
    blocking: true
    weight: 1.0

  - id: human-mup-approval
    criterion: "Humano aprova MUP antes de iniciar producao"
    type: human
    blocking: true
    weight: 1.0

metadata:
  version: "1.0.0"
  sources:
    - "tool-usage-matrix.md § Tasks por Deliverable / VSL"
    - "copy-squad-constitution.md § Checklist de Saida — Blade"
    - "constraint-progressivo.md § Iteracao 4"
