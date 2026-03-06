# Creative Batch Output Template

```yaml
template:
  id: creative-batch
  version: 1.0.0
  created: 2026-03-06
  purpose: "Structured output format for a batch of ad creatives produced by @creative (Scout)"
  used_by: ["@creative"]
  output_path: "{offer}/production/creatives/batch-{BATCH_ID}.md"
```

---

## Template Body

```markdown
---
batch_id: {{BATCH_ID}}
offer: {{OFFER_NAME}}
platform: {{PLATFORM}}
angle: "{{ANGLE}}"
hook_type: "{{HOOK_TYPE}}"
creative_count: ___
produced_by: "@creative"
date: {{DATE}}
status: draft
quality_score: ___
---

# Creative Batch {{BATCH_ID}} — {{OFFER_NAME}}

> Platform: {{PLATFORM}} | Angle: {{ANGLE}} | Hook Type: {{HOOK_TYPE}}

---

## Batch Context

- **Target Avatar:** [from offer's research/synthesis.md]
- **DRE:** [from offer's validated DRE]
- **MUP Reference:** [one-liner from mecanismo-unico.yaml]
- **Angle Rationale:** {{ANGLE}} — [why this angle for this batch]

---

## Creatives

{{CREATIVES}}

### Creative {{CREATIVE_NUMBER}}: {{CREATIVE_TYPE}}

**Format:** {{CREATIVE_TYPE}}
**Estimated Duration:** ___ seconds (video) / N/A (image)
**CTA:** {{CTA}}

---

{{CREATIVE_CONTENT}}

---

**Notes:** {{NOTES}}

---

[Repeat for each creative in the batch]

---

## Batch Performance Notes

- **Testing priority:** [which creative to test first and why]
- **A/B split suggestion:** [which creatives form a meaningful A/B test]
- **Scale potential:** [which creative has broadest appeal if it wins]
- **Compliance flags:** [any claims that need legal review]

---

## Self-Check (Author)

Before submitting to @critic, verify for EACH creative:

- [ ] Hook grabs attention in first 3 seconds (video) or first line (image copy)
- [ ] DRE is activated within the first 5 seconds / 2 lines
- [ ] MUP/MUS is referenced (even if subtly)
- [ ] CTA is clear and specific
- [ ] Platform-appropriate: length, format, tone match {{PLATFORM}} norms
- [ ] No AI crutch phrases or generic marketing language
- [ ] Each creative in the batch is DISTINCT (not just word-swapped variations)
- [ ] At least one creative uses a non-obvious angle or pattern interrupt
```

---

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{BATCH_ID}}` | Sequential batch identifier (zero-padded) | `01`, `02`, `03` |
| `{{OFFER_NAME}}` | Offer identifier | `florayla`, `cognixor` |
| `{{PLATFORM}}` | Target ad platform | `meta`, `youtube`, `tiktok`, `native` |
| `{{ANGLE}}` | Creative angle/theme for this batch | `"curiosity-mechanism"`, `"fear-escalation"`, `"testimonial-story"` |
| `{{HOOK_TYPE}}` | Hook strategy used | `"pattern-interrupt"`, `"question"`, `"shocking-stat"`, `"story-open"`, `"enemy"` |
| `{{CREATIVES}}` | Container for individual creative entries | See creative sub-template below |
| `{{CREATIVE_NUMBER}}` | Number within the batch | `1`, `2`, `3` |
| `{{CREATIVE_TYPE}}` | Format of the creative | `video-script`, `image-copy`, `ugc-brief`, `carousel`, `story-ad` |
| `{{CREATIVE_CONTENT}}` | The actual creative copy/script | Full creative text with stage directions |
| `{{CTA}}` | Call to action for this creative | `"Tap 'Learn More' to see the 7-second trick"` |
| `{{NOTES}}` | Per-creative production notes | `"Film in kitchen setting. Natural lighting. No lab coats."` |
| `{{DATE}}` | Production date | `2026-03-06` |

---

## Creative Type Formatting Guide

[[LLM: FORMAT GUIDANCE PER CREATIVE TYPE

### video-script
Use this format:
```
[VISUAL: description of what viewer sees]
[SPEAKER/VO]: "Dialogue or voiceover text"
[TEXT ON SCREEN: overlay text]
[SFX: sound effect or music cue]
```

### image-copy
Use this format:
```
HEADLINE: [primary text on image]
BODY: [supporting text below image]
PRIMARY TEXT: [ad copy above image in feed]
DESCRIPTION: [link description text]
```

### ugc-brief
Use this format:
```
CREATOR PROFILE: [who should film this — age, gender, vibe]
SETTING: [where to film]
SCRIPT: [what to say, with natural pauses and expressions noted]
PRODUCT MOMENT: [when and how to show/mention the product]
```

### carousel
Use this format:
```
CARD 1: [image description] + [text overlay]
CARD 2: [image description] + [text overlay]
...
FINAL CARD: [CTA card]
PRIMARY TEXT: [caption text]
```]]

---

## Usage Notes

[[LLM: USAGE GUIDANCE FOR @CREATIVE (SCOUT)

1. Each batch should contain 3-5 creatives sharing the SAME angle but varying in format/execution
2. Creatives within a batch should be testable against each other (same angle, different hooks)
3. Different batches should explore DIFFERENT angles (not just variations)
4. Fill the Batch Context section BEFORE writing creatives (grounds the work)
5. Performance Notes section helps the media buyer prioritize testing
6. quality_score is filled by @critic after review (leave blank)
7. status transitions: draft -> in_review -> approved | revision_needed
8. For multi-platform batches, create separate batch files per platform]]

---

**Version:** 1.0.0
**Created:** 2026-03-06
**Standard:** Copy Chief BLACK Creative Production
