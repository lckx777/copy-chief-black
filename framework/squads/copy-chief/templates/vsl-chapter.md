# VSL Chapter Output Template

```yaml
template:
  id: vsl-chapter
  version: 1.0.0
  created: 2026-03-06
  purpose: "Structured output format for a single VSL chapter produced by @vsl (Echo)"
  used_by: ["@vsl"]
  output_path: "{offer}/production/vsl/chapter-{CHAPTER_NUMBER}.md"
```

---

## Template Body

```markdown
---
chapter: {{CHAPTER_NUMBER}}
title: "{{CHAPTER_TITLE}}"
type: {{CHAPTER_TYPE}}
offer: {{OFFER_NAME}}
dre_level: {{DRE_LEVEL}}
word_count_target: {{WORD_COUNT_TARGET}}
word_count_actual: ___
produced_by: "@vsl"
date: {{DATE}}
status: draft
quality_score: ___
---

# Chapter {{CHAPTER_NUMBER}}: {{CHAPTER_TITLE}}

> Type: {{CHAPTER_TYPE}} | DRE Level: {{DRE_LEVEL}}/5 | Target: {{WORD_COUNT_TARGET}} words

---

## Copy

{{CHAPTER_CONTENT}}

---

## Transition Hook

> The last 2-3 lines that pull the reader/viewer into the next chapter.

{{TRANSITION_HOOK}}

---

## Production Notes

{{NOTES}}

---

## Self-Check (Author)

Before submitting to @critic, verify:

- [ ] Word count within 10% of target ({{WORD_COUNT_TARGET}})
- [ ] DRE escalation reaches level {{DRE_LEVEL}} in this chapter
- [ ] MUP/MUS referenced where appropriate for this chapter type
- [ ] Transition hook creates genuine curiosity (not a cliche cliffhanger)
- [ ] Read aloud: no sentences that trip the tongue
- [ ] No AI crutch phrases ("Imagine...", "But here's the thing...", "And that's not all...")
- [ ] Specificity: at least 3 concrete details (names, numbers, sensory language)
```

---

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{CHAPTER_NUMBER}}` | Sequential chapter number (zero-padded) | `01`, `02`, `06` |
| `{{CHAPTER_TITLE}}` | Descriptive chapter title | `"The Silent Killer in Your Kitchen"` |
| `{{CHAPTER_TYPE}}` | Chapter role in VSL structure | `lead`, `problem`, `mechanism`, `solution`, `proof`, `close` |
| `{{OFFER_NAME}}` | Offer identifier | `florayla`, `neuvelys`, `cognixor` |
| `{{DRE_LEVEL}}` | Target DRE escalation level for this chapter (1-5) | `3` (relational), `5` (identity) |
| `{{WORD_COUNT_TARGET}}` | Target word count for this chapter | `800`, `1200`, `1500` |
| `{{CHAPTER_CONTENT}}` | The actual VSL copy for this chapter | Full copy text |
| `{{TRANSITION_HOOK}}` | Lines bridging to the next chapter | `"But what Dr. Richter discovered next changed everything..."` |
| `{{NOTES}}` | Production notes, references, compliance flags | `"Compliance: avoid Alzheimer claim. Use 'cognitive decline' instead."` |
| `{{DATE}}` | Production date | `2026-03-06` |

---

## Usage Notes

[[LLM: USAGE GUIDANCE FOR @VSL (ECHO)

1. Fill ALL frontmatter fields before writing the copy
2. The chapter type determines the emotional trajectory:
   - lead: Hook + pattern interrupt. DRE level 1-2.
   - problem: Agitation + escalation. DRE level 2-3.
   - mechanism: MUP reveal + paradigm shift. DRE level 3-4.
   - solution: MUS reveal + hope. DRE level 3 (relief).
   - proof: Social + scientific proof stacking. DRE level 2-3.
   - close: Urgency + CTA + guarantee. DRE level 4-5.
3. Each chapter must end with a transition hook that makes skipping impossible
4. word_count_actual should be filled AFTER writing
5. Run the self-check before passing to @critic
6. quality_score is filled by @critic after review (leave blank)
7. status transitions: draft -> in_review -> approved | revision_needed]]

**Chapter type mapping to standard VSL structure:**

| Chapter | Type | Typical Length | DRE Arc |
|---------|------|---------------|---------|
| 01 | `lead` | 600-1000 words | 1 -> 2 |
| 02 | `problem` | 1000-1500 words | 2 -> 3 |
| 03 | `mechanism` | 1200-1800 words | 3 -> 4 |
| 04 | `solution` | 800-1200 words | 4 -> 3 (relief) |
| 05 | `proof` | 1000-1500 words | 3 -> 3 |
| 06 | `close` | 800-1200 words | 3 -> 5 |

---

**Version:** 1.0.0
**Created:** 2026-03-06
**Standard:** Copy Chief BLACK VSL Production
