---
template_name: epistemic-header
template_version: "1.0.0"
template_type: production
description: "Epistemic confidence declaration partial for briefings and production deliverables"
phase: production
---

---
epistemic:
  confidence_level: "{ALTA|MÉDIA|BAIXA|NÃO SEI}"
  sources:
    - file: "{path/to/source.md}"
      line: {N}
      quote: "{exact text from source}"
  methodology: "{framework reference — ex: HELIX Fase 5, VOC Quality Protocol, RMBC-II}"
  unverified_claims: []
---
