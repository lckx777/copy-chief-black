---
description: Structured debate between Copy Squad experts on a topic
argument-hint: "[expert1] vs [expert2] [vs expert3] [vs expert4] sobre [topico] [--framework adversarial|socratic|collaborative]"
---

# Copy Squad Debate (N-Expert + Scoring)

**Arguments:** $ARGUMENTS

## Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **experts**: names separated by "vs" (case-insensitive). Minimum 2, maximum 4.
- **topic**: everything after "sobre" (or "about", "on", ":")
- **framework**: if `--framework` flag present, extract value. Default: `adversarial`

**Defaults:**
- If only ONE expert name given (no "vs"), set expert2 = `copy-chief`
- If NO expert names given, set expert1 = `halbert`, expert2 = `schwartz`
- If no topic detected, ASK the user before proceeding
- If no `--framework`, default to `adversarial`

**Valid expert names** (match case-insensitive, use lowercase for file):
abraham, agora, bencivenga, brown, brunson, caples, carlton, chaperon, cialdini, collier, copy-chief, halbert, hopkins, hormozi, kennedy, kern, makepeace, ogilvy, powers, reeves, ry-schwartz, sabri, schwartz, sugarman, vaynerchuk

If an expert name is not in this list, report the error and list valid names. Do NOT proceed.

**Framework options:**
- `adversarial` (default) — experts challenge and attack each other's positions
- `socratic` — experts ask provocative questions to each other, drawing out deeper thinking
- `collaborative` — experts build on each other's ideas, seeking synthesis

## Step 2: Load Voice DNA Profiles

Read ALL expert profiles:
- `~/.claude/copy-squad/{expert}.md` for each expert

Extract from each file:
- **Core Philosophy** section (worldview and principles)
- **Voice Patterns** section (how they write and argue)
- **Core Identity** line from the header

These define HOW each expert speaks during the debate. Each expert MUST stay in character throughout all rounds.

## Step 3: Detect Active Offer (Optional)

Check if the current working directory contains an active offer:
```bash
find ~/copywriting-ecosystem -maxdepth 4 -name "CONTEXT.md" -newer ~/copywriting-ecosystem/.git/HEAD 2>/dev/null | head -3
```

If an active offer is detected, note its path for saving output later. If not, output will go to chat only.

## Step 4: Run the Debate

### Round Structure (varies by number of experts)

**For 2 experts:** 5 rounds (Open, Counter, Rebuttal x2, Synthesis)
**For 3 experts:** 7 rounds (Open x3, Counter-Cross x3, Synthesis)
**For 4 experts:** 9 rounds (Open x4, Counter-Cross x4, Synthesis)

**Format rules for ALL rounds:**
- Each expert speaks IN CHARACTER using their Voice DNA patterns
- 100-200 words per round (strict)
- Use the expert's actual rhetorical devices, sentence structures, and terminology
- Reference the expert's known frameworks and principles where relevant
- The topic must be addressed CONCRETELY, not abstractly

### Framework-Specific Behavior

**Adversarial (default):**
- Experts directly challenge opposing positions
- Each rebuttal must identify a WEAKNESS in the other's argument
- Steel-man before attacking (never strawman)

**Socratic:**
- Experts ask penetrating questions instead of making declarations
- Each round ends with a question that forces the next expert to think deeper
- Goal is to REVEAL insights through questioning, not win

**Collaborative:**
- Each expert builds on the previous expert's contribution
- "Yes, AND..." structure — acknowledge, then extend
- Goal is to create a synthesis GREATER than any individual perspective

---

### Opening Rounds — Each Expert Opens

For each expert (in order), write:

**Header:** `## Round {N}: {Expert} — Opening Position`

{Expert} presents their approach to the topic. Must include:
- Their core principle applied to this specific topic
- A concrete recommendation or technique
- Why their approach works (from their philosophical framework)

Write in {Expert}'s voice using their documented patterns.

---

### Counter-Cross Rounds — Each Expert Responds

For each expert (in order), write:

**Header:** `## Round {N}: {Expert} — {Framework-verb}`

Framework-verb:
- Adversarial: "Counter-Attack"
- Socratic: "Cross-Examination"
- Collaborative: "Building On"

Each expert responds to the PREVIOUS expert(s). Must include:
- Framework-appropriate engagement with other positions
- Refinement of their own position
- Concrete examples or techniques

---

### Scoring Round (NEW)

**Header:** `## Scoring Round: Cross-Expert Evaluation`

After all debate rounds, each expert scores EVERY OTHER expert's arguments on a 1-10 scale:

For each expert:
```
### {Expert}'s Scores:
- {Other Expert 1}: X/10 — "{brief justification}"
- {Other Expert 2}: X/10 — "{brief justification}"
[... for each other expert]
```

Then compile:

```
### Score Matrix
| Scorer → | Expert1 | Expert2 | Expert3 | Expert4 |
|----------|---------|---------|---------|---------|
| Expert1  | —       | X       | X       | X       |
| Expert2  | X       | —       | X       | X       |
| Expert3  | X       | X       | —       | X       |
| Expert4  | X       | X       | X       | —       |
| **AVG**  | X.X     | X.X     | X.X     | X.X     |

**Winner: {Expert with highest average}** (X.X/10)
```

---

### Synthesis Round

**Header:** `## Synthesis — The Best of All Minds`

This round is written by Copy Chief BLACK (not any expert). Must include:

1. **Core Agreement**: What ALL experts actually agree on
2. **Key Tensions**: The real philosophical differences that drive disagreements
3. **Points of Consensus**: What emerged as irreconcilable vs what converged
4. **Merged Recommendation**: A concrete, ACTIONABLE approach that takes the strongest elements from each side
5. **When to Use Each**: Specific scenarios where each expert's approach wins
6. **Applied to Topic**: 3-5 bullet points of what to DO based on this synthesis

The synthesis MUST be specific enough to act on immediately. No abstractions. No "it depends." Concrete steps.

---

## Step 5: Output

### Format the complete debate as:

```markdown
# Debate: {Expert1} vs {Expert2} [vs Expert3] [vs Expert4]
## Topic: {topic}
## Framework: {framework}
Date: {YYYY-MM-DD}

---

{Opening Rounds}

---

{Counter-Cross Rounds}

---

{Scoring Round}

---

{Synthesis Round}

---

## Next Step

Validate the synthesis using `consensus` (zen MCP) for multi-model agreement.
This confirms the merged recommendation holds across different reasoning approaches.
```

### Save location:

**If active offer detected:**
```bash
mkdir -p {offer-path}/production/debates/
# Write to: {offer-path}/production/debates/debate-{experts-joined-by-vs}-{YYYY-MM-DD}.md
```

Report the file path to the user.

**If no active offer:**
Output the full debate in chat. Do NOT create files in arbitrary locations.

## Constraints

- NEVER break character during debate rounds. Each expert speaks ONLY in their documented voice.
- NEVER let the synthesis be vague or abstract. It must produce actionable steps.
- NEVER strawman any position. Steel-man ALL sides.
- If the topic relates to an active offer, use offer-specific context (MUP, MUS, avatar) to ground the debate in reality.
- Each round: 100-200 words. Not 50. Not 300. This is strict.
- Scoring must include justification for EVERY score given.
- With 3+ experts, ensure EACH expert gets equal speaking time.

## Post-Debate Recommendation

After the debate output, suggest:

> To validate this synthesis with multi-model agreement, run `consensus` (zen MCP)
> with the merged recommendation as input. This stress-tests the conclusion across
> different reasoning models before applying it to production copy.
