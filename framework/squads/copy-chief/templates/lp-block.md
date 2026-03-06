# Landing Page Block Output Template

```yaml
template:
  id: lp-block
  version: 1.0.0
  created: 2026-03-06
  purpose: "Structured output format for a single Landing Page block produced by @lp (Forge)"
  used_by: ["@lp"]
  output_path: "{offer}/production/landing-page/block-{BLOCK_NUMBER}-{BLOCK_NAME}.md"
```

---

## Template Body

```markdown
---
block_number: {{BLOCK_NUMBER}}
block_name: "{{BLOCK_NAME}}"
block_type: {{BLOCK_TYPE}}
offer: {{OFFER_NAME}}
produced_by: "@lp"
date: {{DATE}}
status: draft
quality_score: ___
---

# Block {{BLOCK_NUMBER}}: {{BLOCK_NAME}}

> Type: {{BLOCK_TYPE}} | Offer: {{OFFER_NAME}}

---

## Copy Content

{{BLOCK_CONTENT}}

---

## Design Notes

> Visual guidance for implementation. These notes inform the designer/Canva builder
> about layout, imagery, colors, and visual hierarchy for this block.

{{DESIGN_NOTES}}

---

## Canva Implementation Instructions

> Step-by-step instructions for building this block in Canva or equivalent tool.
> Specific enough that a non-copywriter can assemble it.

{{CANVA_INSTRUCTIONS}}

---

## Self-Check (Author)

Before submitting to @critic, verify:

- [ ] Block serves its structural purpose (see block type guide below)
- [ ] Copy can stand alone AND connects to adjacent blocks
- [ ] Visual hierarchy is clear: headline > subhead > body > CTA
- [ ] Mobile-first: copy works on a phone screen (short paragraphs, scannable)
- [ ] Design notes are specific enough for a designer to execute without guessing
- [ ] No AI crutch phrases or filler transitions
- [ ] Block-specific requirements met (see block type guide)
```

---

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{BLOCK_NUMBER}}` | Sequential block number (zero-padded) | `01`, `02`, `08` |
| `{{BLOCK_NAME}}` | Descriptive block name (kebab-case) | `hero`, `problem-agitation`, `mechanism-reveal` |
| `{{BLOCK_TYPE}}` | Structural role of the block | `hero`, `problem`, `mechanism`, `proof`, `offer`, `cta`, `guarantee`, `faq`, `urgency`, `testimonials`, `ingredients`, `comparison` |
| `{{OFFER_NAME}}` | Offer identifier | `florayla`, `neuvelys` |
| `{{BLOCK_CONTENT}}` | The actual LP copy for this block | Full block copy (headlines, body, bullets, etc.) |
| `{{DESIGN_NOTES}}` | Visual layout and design guidance | `"Split layout: copy left, product image right. Background: soft gradient #f5f0eb to white."` |
| `{{CANVA_INSTRUCTIONS}}` | Implementation steps for Canva/builder | `"1. Use 'Presentation' format 1920x1080. 2. Place headline in top 30%..."` |
| `{{DATE}}` | Production date | `2026-03-06` |

---

## Block Type Guide

[[LLM: BLOCK TYPE REFERENCE FOR @LP (FORGE)

Each block type has a specific structural purpose in the LP. Use this guide to ensure
each block fulfills its role. Reference: squads/copy-chief/data/lp/ref_blocos_estrutura_14.md

| # | Type | Purpose | Key Elements |
|---|------|---------|-------------|
| 01 | `hero` | First impression. Hook + promise + CTA. | Headline, subhead, hero image, primary CTA button |
| 02 | `problem` | Agitate the pain. Make the reader feel it. | Problem statements, DRE activation, "Do you recognize this?" |
| 03 | `mechanism` | MUP reveal. Paradigm shift. | "The REAL cause is...", diagram/visual of mechanism |
| 04 | `solution` | MUS reveal. The answer. | Product introduction, how it works, ingredient highlight |
| 05 | `proof` | Stack evidence. | Studies, statistics, expert quotes, before/after |
| 06 | `testimonials` | Social proof. Real people. | 3-5 testimonials with names, photos, specific results |
| 07 | `ingredients` | What's inside and why. | Ingredient list with individual benefits, dosages |
| 08 | `comparison` | Why this vs alternatives. | Comparison table, "Unlike X which does Y..." |
| 09 | `offer` | What you get. Price anchoring. | Kit options, bonuses, price breakdown, savings |
| 10 | `guarantee` | Risk reversal. | Guarantee badge, money-back terms, "nothing to lose" |
| 11 | `urgency` | Why now, not later. | Limited stock, price increase, mechanism urgency |
| 12 | `faq` | Objection handling disguised as FAQ. | 5-8 questions addressing top objections |
| 13 | `cta` | Final push. | Summary of promise, final CTA button, trust badges |
| 14 | `footer` | Legal, disclaimer, contact. | Compliance text, privacy link, contact info |

Not all blocks are required for every LP. The standard set is blocks 01-10 + 12-13.
Blocks 11 and 14 are situational.]]

---

## Usage Notes

[[LLM: USAGE GUIDANCE FOR @LP (FORGE)

1. Each block is ONE file. The complete LP is the sequence of all block files.
2. Fill frontmatter BEFORE writing the copy
3. BLOCK_CONTENT should include:
   - Headlines (## or ### level)
   - Body copy (paragraphs)
   - Bullet lists where appropriate
   - CTA buttons marked as: **[CTA: "Button Text"]**
   - Image placeholders marked as: **[IMAGE: description]**
4. DESIGN_NOTES should cover:
   - Layout direction (text-left/image-right, centered, full-width)
   - Color scheme for this block
   - Typography emphasis (what's bold, what's large)
   - Image style guidance
5. CANVA_INSTRUCTIONS should be executable:
   - Canvas size
   - Element placement (top %, left %)
   - Font suggestions
   - Color hex codes
6. quality_score is filled by @critic after review (leave blank)
7. status transitions: draft -> in_review -> approved | revision_needed
8. Reference squads/copy-chief/data/lp/ for patterns and formulas]]

---

**Version:** 1.0.0
**Created:** 2026-03-06
**Standard:** Copy Chief BLACK Landing Page Production
