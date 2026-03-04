# /next-action — Highest-Priority Next Action

Run the decision engine and recommend what to do next.

## Instructions

When this command is invoked:

### 1. Check for Decision Engine
If `~/.claude/scripts/decision-engine.ts` exists, run it:
```bash
bun run ~/.claude/scripts/decision-engine.ts 2>/dev/null
```

### 2. If Decision Engine Not Available, Manual Analysis
If the script does not exist or fails, perform manual analysis:

a) Find all offers:
```bash
find ~/copywriting-ecosystem -name "helix-state.yaml" -type f 2>/dev/null
```

b) For each offer, read helix-state.yaml and determine:
   - Current phase
   - What gate needs to pass next
   - What deliverables are missing
   - Mecanismo state

c) Read `~/.claude/manifest.yaml` for niche ROI weights

d) Score each offer using this formula:
```
Priority = (ROI_weight * 2) + (proximity_to_delivery * 3) + (blocked_human_gate * 5) - (effort_remaining * 1)
```

Where:
- ROI_weight: from manifest.yaml niches section (6-9)
- proximity_to_delivery: DELIVERED=0, PRODUCTION=3, BRIEFING=2, RESEARCH=1, IDLE=0
- blocked_human_gate: 1 if there is a pending human gate, 0 otherwise
- effort_remaining: estimated steps to DELIVERED (lower = higher priority)

### 3. Present Results

Display the TOP 3 recommendations in this format:

```
#1 [OFFER NAME] — [NICHE]
   Phase: [CURRENT] -> Next: [NEXT STEP]
   Action: [Specific action to take]
   Why: [Brief rationale]
   Command: [Suggested /command to run]

#2 ...

#3 ...
```

### 4. Ask for Confirmation

After presenting, ask:
> "Quer seguir com a recomendacao #1? Ou prefere outra?"

If the user confirms, invoke the appropriate skill or command for that action:

| Phase | Next Action | Invoke |
|-------|-------------|--------|
| IDLE (no research) | Start research | audience-research-agent |
| IDLE (research done) | Start briefing | helix-system-agent |
| RESEARCH | Continue/finish research | audience-research-agent |
| BRIEFING | Continue HELIX phases | helix-system-agent |
| PRODUCTION | Produce deliverables | /produce-offer [name] |
| PRODUCTION (needs review) | Run validation | /review-all [name] |
| Blocked human gate | Show gate details | Ask user to approve |
