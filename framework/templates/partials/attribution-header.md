---
template_name: attribution-header
template_version: "1.0.0"
template_type: production
description: "YAML frontmatter partial for copy attribution metadata in production deliverables"
phase: production
---

---
attribution:
  produced_by: "{PERSONA_HANDLE}"
  expert_archetype: "{EXPERT_NAME}"
  validated_by: "{VALIDATOR_HANDLE}"
  offer: "{OFFER_NAME}"
  created_at: "{DATE}"
  updated_at: "{DATE}"
  context_tokens: {TOKENS}
  confidence: {CONFIDENCE}
  voc_sources:
    - "{VOC_SOURCE_1}"
  briefing_phases:
    - "{PHASE_1}"
  scores:
    blind_critic: {BC_SCORE}
    emotional_stress_test: {EST_SCORE}
    black_validation: {BV_SCORE}
    layered_review: "{LR_STATUS}"
  iteration: {ITERATION}
  status: "{STATUS}"
---
