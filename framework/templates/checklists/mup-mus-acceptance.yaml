# MUP/MUS Acceptance Checklist v1.0
# Segue: checklist-definition.schema.yaml
# Fontes: tool-usage-matrix.md, mecanismo-unico.md, copy-squad-constitution.md
# Criado: 2026-02-27

id: mup-mus-acceptance
name: "Criterios de Aceitacao — MUP/MUS (Mecanismo Unico)"
applies_to: mup-mus
gate: briefing

tasks:
  - id: mup-consensus
    name: "Rodar consensus com TOP 3 candidatos MUP"
    owner: "@briefer"
    tools: [consensus]
    order: 1

  - id: mup-bc
    name: "Rodar blind_critic no MUP Statement (copy_type: headline)"
    owner: "@critic"
    tools: [blind_critic]
    depends_on: [mup-consensus]
    order: 2

  - id: mus-define
    name: "Definir MUS baseado no MUP validado"
    owner: "@briefer"
    tools: []
    depends_on: [mup-bc]
    order: 3

  - id: mus-bc
    name: "Rodar blind_critic no MUS Statement (copy_type: headline)"
    owner: "@critic"
    tools: [blind_critic]
    depends_on: [mus-define]
    order: 4

  - id: mup-mus-est
    name: "Rodar emotional_stress_test no MUP+MUS concatenados (copy_type: lead)"
    owner: "@critic"
    tools: [emotional_stress_test]
    depends_on: [mus-bc]
    order: 5

  - id: mup-mus-voc
    name: "Rodar voc_search para validar linguagem alinhada com avatar"
    owner: "@researcher"
    tools: [voc_search]
    depends_on: [mup-mus-est]
    order: 6

  - id: mup-mus-human
    name: "Submeter MUP+MUS para aprovacao humana final"
    owner: "@chief"
    tools: []
    depends_on: [mup-mus-voc]
    order: 7

criteria:
  - id: consensus-agreement
    criterion: "consensus: multi-model agreement nos TOP 3 MUPs"
    type: process
    blocking: true
    weight: 1.0

  - id: bc-mup-score
    criterion: "blind_critic score >= 8 no MUP Statement"
    type: score
    tool: blind_critic
    threshold: 8
    operator: ">="
    blocking: true
    weight: 1.0

  - id: bc-mus-score
    criterion: "blind_critic score >= 8 no MUS Statement"
    type: score
    tool: blind_critic
    threshold: 8
    operator: ">="
    blocking: true
    weight: 1.0

  - id: est-genericidade
    criterion: "emotional_stress_test genericidade >= 8 no MUP+MUS juntos"
    type: score
    tool: emotional_stress_test
    threshold: 8
    operator: ">="
    blocking: true
    weight: 1.0

  - id: voc-alignment
    criterion: "voc_search retorna quotes alinhadas com linguagem do MUP/MUS"
    type: content
    blocking: true
    weight: 1.0

  - id: human-approval
    criterion: "Humano aprova MUP+MUS final"
    type: human
    blocking: true
    weight: 1.0

metadata:
  version: "1.0.0"
  sources:
    - "tool-usage-matrix.md § FASE 5 HELIX: MUP/MUS"
    - "mecanismo-unico.md § Sequencia de Validacao"
    - "copy-squad-constitution.md § Checklist de Saida — Atlas"
