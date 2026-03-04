---
description: Create planning files for new project
argument-hint: "<project-description>"
---

# Planning Setup

Initialize planning structure for: $ARGUMENTS

## Pre-Flight

1. Verify working directory is a project folder
2. Check if planning files already exist

## Create Files

### task_plan.md
Primary planning document with phases, gates, and status.

### findings.md  
Consolidated discoveries, VOC, and strategic decisions.

### progress.md
Session log with actions, decisions, and next steps.

## Workflow

### Step 1: Check Existing
```bash
if [ -f task_plan.md ]; then
    echo "⚠️ Planning files exist. Use /plan-reset to recreate."
    exit 0
fi
```

### Step 2: Create task_plan.md
```markdown
# Task Plan: $ARGUMENTS

## Objetivo
[Descrição da oferta]

## Fases (HELIX System + Parallel Execution)

### PHASE 1: Parallel Research
**Command:** `/helix-parallel [offer]`
- [ ] VOC Research
- [ ] Competitor Analysis
- [ ] Mechanism Research
- [ ] Avatar Profiling
- [ ] Synthesis
**Gate:** synthesis.md exists

### PHASE 2: Strategic Briefing
**Tool:** helix-system-agent
- [ ] 10 HELIX phases
- [ ] copy-critic STAND on MUP/MUS
**Gate:** helix-complete.md exists

### PHASE 3: Parallel Production
**Command:** `/produce-offer [offer]`
- [ ] VSL Script
- [ ] Landing Page
- [ ] Ad Creatives
- [ ] Email Sequence
**Gate:** All deliverables complete

### PHASE 4: Review
**Command:** `/review-all [offer]`
- [ ] Internal review
- [ ] copy-critic validation
**Gate:** APPROVED verdict

### PHASE 5: Polish & Delivery
**Tool:** Claude.ai Project
- [ ] Sync
- [ ] Polish
- [ ] Deliver
```

### Step 3: Create findings.md
```markdown
# Findings: $ARGUMENTS

## VOC Research
[Populated by research phase]

## Strategic Decisions
### MUP
- Definition: [pending]
- Verdict: [pending]

### MUS
- Definition: [pending]
- Verdict: [pending]
```

### Step 4: Create progress.md
```markdown
# Progress: $ARGUMENTS

## Session 1: [DATE]
**Phase:** Setup
**Actions:**
- Created planning structure
**Next:**
- Run /helix-parallel
```

## Output

After creation:
```
✅ Planning files created:
- task_plan.md (phases and gates)
- findings.md (discoveries)
- progress.md (session log)

Next: Edit task_plan.md with offer details, then /helix-parallel [offer]
```

## Integration with planning-with-files

If planning-with-files plugin is installed, this command enhances its behavior:
- Creates files compatible with plugin expectations
- Follows same naming conventions
- Supports /plan-status and /plan-update commands
