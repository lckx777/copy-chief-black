---
description: Sync local outputs to Claude.ai Project
argument-hint: "<offer-name>"
---

# Sync to Claude.ai Project

Sync offer $ARGUMENTS to Claude.ai

## Files to Sync

From local to Claude.ai Knowledge Base:

1. `research/$ARGUMENTS/synthesis.md` → Project KB
2. `briefings/$ARGUMENTS/helix-complete.md` → Project KB
3. `production/$ARGUMENTS/reviews/final-review.md` → Project KB

## Sync Checklist

- [ ] Export synthesis.md
- [ ] Export helix-complete.md  
- [ ] Export final deliverables
- [ ] Update Project Instructions with current phase

## Sync Process

### Step 1: Prepare Files
```bash
# Create export directory
mkdir -p ~/copywriting-ecosystem/export/$ARGUMENTS

# Copy key files
cp research/$ARGUMENTS/synthesis.md ~/copywriting-ecosystem/export/$ARGUMENTS/
cp briefings/$ARGUMENTS/helix-complete.md ~/copywriting-ecosystem/export/$ARGUMENTS/
cp production/$ARGUMENTS/reviews/final-review.md ~/copywriting-ecosystem/export/$ARGUMENTS/ 2>/dev/null || true
```

### Step 2: Open Claude.ai
1. Navigate to claude.ai
2. Open or create Project for this offer
3. Upload files from export directory to Knowledge Base

### Step 3: Update Project Instructions
Add to Project Custom Instructions:
```
## Estado Atual
- Fase: [current phase]
- Última sync: [date]
- Key decisions synced: [list]

## Arquivos Disponíveis
- synthesis.md: Pesquisa consolidada
- helix-complete.md: Briefing estratégico
- final-review.md: Validações (se existir)
```

## Alternative: /teleport

For interactive refinement with full context:
```
/teleport
```
Transfers conversation context to Claude.ai web interface.

## Post-Sync

1. ✅ Confirm files uploaded to Project KB
2. ✅ Update Project Instructions
3. ✅ Start polish session in Claude.ai
