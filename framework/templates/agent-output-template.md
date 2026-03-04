---
template_name: "agent-output-template"
template_version: "1.0.0"
template_type: "agent-prompt"
description: "Template padrao de output para subagents com estrutura de resultado e metadata"
phase: "any"
output_format: "markdown"
---

# Agent Output: {AGENT_NAME}

> **Offer:** {OFFER_NAME} ({OFFER_PATH})
> **Phase:** {PHASE}
> **Timestamp:** {TIMESTAMP}

---

## Summary

{SUMMARY — Max ~2000 tokens. Consolidate the key findings, decisions, and outcomes of this agent run.}

## Key Decisions

### {DECISION_ID}: {Decision Title}
- **Rationale:** {Why this decision was made}
- **Confidence:** {0-100}%

## Artifacts

| Path | Type | Description |
|------|------|-------------|
| `{file_path}` | created/modified | {What was done} |

## Validation Scores

| Tool | Score | Threshold | Status |
|------|-------|-----------|--------|
| blind_critic | {X.X} | 8 | PASSED/FAILED |
| emotional_stress_test | {X.X} | 8 | PASSED/FAILED |
| black_validation | {X.X} | 8 | PASSED/FAILED |

## Context for Next Agent

{NEXT_AGENT_CONTEXT — Information specifically useful for the next agent in the pipeline.
Include: key decisions that affect downstream work, validated MUP/MUS if applicable,
quality scores, specific instructions or constraints for the next phase.}

---

## Usage Instructions

This template is auto-filled by `agent-output-capture.ts` hook when a skill (Task) completes.
It can also be manually filled by agents using `createOutputFromRun()` from `agent-context.ts`.

### Required Fields
- agent, offer, offer_path, phase, timestamp, summary

### Optional Fields
- key_decisions, artifacts, scores, next_agent_context, metadata

### Pipeline Chain (who receives whose output)
- `audience-research-agent` → receives: nothing (first in chain)
- `helix-system-agent` → receives: audience-research-agent output
- `production-agent` → receives: audience-research-agent + helix-system-agent
- `landing-page-agent` → receives: audience-research-agent + helix-system-agent
- `criativos-agent` → receives: audience-research-agent + helix-system-agent
- `copy-critic` → receives: production-agent + landing-page-agent + criativos-agent
