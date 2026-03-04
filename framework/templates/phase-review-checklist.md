---
template_name: "phase-review-checklist"
template_version: "1.0.0"
template_type: "checklist"
description: "Checklist generico de review por fase do pipeline HELIX"
phase: "any"
output_format: "markdown"
---

# Phase Review Checklist — {phase} → {next_phase}

> **Template:** phase-review-checklist.md
> **Version:** v1.0 (2026-02-24)
> **Offer:** {offer}
> **Generated:** {timestamp}

---

## Layer 1: Pre-Advance (Automated)

> Auto-generated checks based on current phase. These are verified programmatically.

{layer1_checks}

## Layer 2: Deliverable Review (Semi-Automated)

> Phase-specific deliverable checks. Some can be verified by file existence,
> others require content review.

{layer2_checks}

## Layer 3: Human Review

> Items requiring human judgment and explicit approval before advancing.

{layer3_checks}

---

## Gate Decision

| Item | Value |
|------|-------|
| **Phase** | {phase} |
| **Target** | {next_phase} |
| **Layer 1** | {layer1_status} |
| **Layer 2** | {layer2_status} |
| **Layer 3** | {layer3_status} |
| **Decision** | {decision} |
| **Reviewed by** | {reviewer} |
| **Date** | {review_date} |
