---
template_name: "tools-tracking-template"
template_version: "1.0.0"
template_type: "methodology"
description: "Template para tracking de ferramentas usadas por fase de research"
phase: "research"
output_format: "markdown"
---

# Template: Tracking de Tools por Oferta

> **Objetivo:** Rastrear quais MCPs foram usados em cada fase da oferta
> **Quando usar:** Adicionar ao project_state.yaml de cada oferta
> **Criado:** 2026-02-02 | v6.9

---

## Estrutura YAML (adicionar ao project_state.yaml)

```yaml
# Seção a adicionar no project_state.yaml existente

tools_tracking:
  # Fase Research
  research:
    started_at: YYYY-MM-DD
    completed_at: null | YYYY-MM-DD
    tools_used:
      - tool: firecrawl_agent
        used: true | false
        date: YYYY-MM-DD
      - tool: voc_search
        used: true | false
        count: N  # quantas vezes foi chamado
        date: YYYY-MM-DD
      - tool: fb_ad_library.get_meta_ads
        used: true | false
        date: YYYY-MM-DD
      - tool: fb_ad_library.analyze_ad_video
        used: true | false
        videos_analyzed: N
        date: YYYY-MM-DD
      - tool: validate_gate
        used: true | false
        result: PASSED | BLOCKED
        date: YYYY-MM-DD

  # Fase Briefing
  briefing:
    started_at: YYYY-MM-DD
    completed_at: null | YYYY-MM-DD
    tools_used:
      - tool: get_phase_context
        used: true | false
        phases_loaded: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        date: YYYY-MM-DD
      - tool: voc_search
        used: true | false
        count: N
        date: YYYY-MM-DD
      - tool: consensus
        used: true | false
        mup_validated: true | false
        date: YYYY-MM-DD
      - tool: validate_gate
        used: true | false
        result: PASSED | BLOCKED
        date: YYYY-MM-DD

  # Fase Production
  production:
    started_at: YYYY-MM-DD
    completed_at: null | YYYY-MM-DD
    deliverables:
      vsl:
        status: not_started | in_progress | completed
        tools_used:
          - tool: write_chapter
            chapters_written: N
            date: YYYY-MM-DD
          - tool: blind_critic
            score: N/10
            date: YYYY-MM-DD
          - tool: emotional_stress_test
            genericidade: N/10
            date: YYYY-MM-DD
          - tool: layered_review
            layers_completed: [1, 2, 3]
            date: YYYY-MM-DD
          - tool: black_validation
            score: N/10
            date: YYYY-MM-DD

      landing_page:
        status: not_started | in_progress | completed
        tools_used:
          - tool: blind_critic
            score: N/10
            date: YYYY-MM-DD
          - tool: emotional_stress_test
            genericidade: N/10
            date: YYYY-MM-DD
          - tool: black_validation
            score: N/10
            date: YYYY-MM-DD

      creatives:
        status: not_started | in_progress | completed
        count: N  # quantos criativos produzidos
        tools_used:
          - tool: voc_search
            count: N
            date: YYYY-MM-DD
          - tool: blind_critic
            scores: [N/10, N/10, ...]  # um por criativo
            date: YYYY-MM-DD
          - tool: emotional_stress_test
            scores: [N/10, N/10, ...]
            date: YYYY-MM-DD

  # Memória
  memory:
    rlm_chunks_saved: N
    last_chunk_date: YYYY-MM-DD
    pre_compact_warnings: N
```

---

## Validação de Compliance

### Thresholds por Fase

| Fase | Ferramentas Obrigatórias | % Mínimo |
|------|-------------------------|----------|
| Research | voc_search, validate_gate | 100% |
| Briefing | get_phase_context, validate_gate | 100% |
| Production | blind_critic, emotional_stress_test, black_validation | 100% |

### Score de Compliance

```
Score = (tools_usados / tools_obrigatórios) × 100

Interpretação:
- 100%: Compliance total ✅
- 80-99%: Compliance parcial ⚠️
- <80%: Compliance insuficiente ❌
```

---

## Integração com sync-tracking.py

O script `sync-tracking.py` pode ser atualizado para:
1. Ler tools_tracking do project_state.yaml
2. Calcular score de compliance
3. Incluir no ecosystem-status.md

---

## Exemplo Completo

```yaml
# project_state.yaml de uma oferta

offer_name: gabaritando-portugues
current_phase: briefing
confidence: 75

tools_tracking:
  research:
    started_at: 2026-01-28
    completed_at: 2026-01-30
    tools_used:
      - tool: firecrawl_agent
        used: true
        date: 2026-01-28
      - tool: voc_search
        used: true
        count: 12
        date: 2026-01-29
      - tool: fb_ad_library.get_meta_ads
        used: true
        date: 2026-01-29
      - tool: validate_gate
        used: true
        result: PASSED
        date: 2026-01-30

  briefing:
    started_at: 2026-01-31
    completed_at: null
    tools_used:
      - tool: get_phase_context
        used: true
        phases_loaded: [1, 2, 3, 4, 5]
        date: 2026-01-31
      - tool: consensus
        used: false
        mup_validated: false
        date: null
```

---

*Template v6.9 - Tool Enforcement System*
