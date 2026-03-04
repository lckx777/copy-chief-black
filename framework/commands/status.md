# /status — System-Wide Status Dashboard

Show the complete Copy Chief BLACK system status.

## Instructions

When this command is invoked, execute these steps IN ORDER:

### 1. System Info
Read `~/.claude/manifest.yaml` and display:
- System name and version
- Current level (1-4)
- Date of last manifest update

### 2. Decision Engine (if available)
Check if `~/.claude/scripts/decision-engine.ts` exists. If so, run:
```bash
bun run ~/.claude/scripts/decision-engine.ts 2>/dev/null
```
Display the prioritized offer recommendations.

### 3. Self-Healing Queue (if available)
Check if `~/.claude/scripts/retry-processor.ts` exists. If so, run:
```bash
bun run ~/.claude/scripts/retry-processor.ts --status 2>/dev/null
```
Display any queued retries. If the script does not exist, check if `~/.claude/knowledge/retry-queue.yaml` exists and display its contents.

### 4. All Offers Status
Find all helix-state.yaml files in ~/copywriting-ecosystem and for EACH offer display:
- Offer name and niche
- Current phase (IDLE / RESEARCH / BRIEFING / PRODUCTION / DELIVERED)
- Gates passed (research, briefing, production)
- Mecanismo state (UNDEFINED / DRAFT / VALIDATED / APPROVED)
- Last activity date

Use this command to discover offers:
```bash
find ~/copywriting-ecosystem -name "helix-state.yaml" -type f 2>/dev/null
```

### 5. Pipeline Status
Check for any active pipeline states:
```bash
find ~/copywriting-ecosystem -name "pipeline-state.json" -type f 2>/dev/null
```
If found, display current step, last checkpoint, and any blocked human gates.

### 6. Summary Table
Present a consolidated summary:

```
| Metric              | Value |
|---------------------|-------|
| Total Offers        | X     |
| IDLE                | X     |
| RESEARCH            | X     |
| BRIEFING            | X     |
| PRODUCTION          | X     |
| DELIVERED           | X     |
| Avg Quality Score   | X.X   |
| Retry Queue         | X     |
| System Level        | 4     |
```

### 7. Recommended Next Action
Based on the analysis above, recommend the single highest-priority next action the user should take. Consider:
- Offers closest to delivery (high ROI to finish)
- Blocked human gates that need approval
- Failed validations that need attention
- New offers that should start research
