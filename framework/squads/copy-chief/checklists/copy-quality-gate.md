# Copy Quality Gate Checklist

```yaml
checklist:
  id: copy-quality-gate
  version: 1.0.0
  created: 2026-03-06
  purpose: "Score and validate any copy deliverable across 9 quality dimensions after production"
  mode: scored  # Average score determines verdict
  pipeline_phase: post-production
  triggered_by: "@critic (Hawk) after each deliverable is produced"
  thresholds:
    pass: 7.0
    needs_revision: 5.0
    fail: 0.0
```

---

## Instructions

[[LLM: INITIALIZATION INSTRUCTIONS - COPY QUALITY GATE

This checklist scores a finished copy deliverable (VSL chapter, LP block, creative, email)
across 9 quality dimensions. Each dimension is scored 1-10.

EXECUTION APPROACH:

1. Read the deliverable file completely
2. Read the offer's CONTEXT.md, mecanismo-unico.yaml, and research/synthesis.md for reference
3. Score each of the 9 dimensions independently (1-10)
4. Run the anti-homogenization check separately
5. Calculate the average score
6. Determine verdict based on thresholds

SCORING CALIBRATION:
- 1-3: Fundamentally broken. Missing the dimension entirely.
- 4-5: Present but weak. Needs significant rework.
- 6: Acceptable but generic. Could be any offer.
- 7-8: Good. Specific to this offer, emotionally engaging.
- 9-10: Exceptional. Would make a veteran copywriter pause.

CRITICAL: Score each dimension INDEPENDENTLY. A deliverable can score 9 on DRE
but 4 on Proof. Do not let one strong dimension inflate others.

Be the critic the copy NEEDS, not the critic it wants.]]

---

## 9-Dimension Quality Scoring

### 1. Clarity

[[LLM: Read the copy as if you are the avatar seeing it for the first time.
Is the message immediately clear? Any ambiguity? Any sentence that requires re-reading?
Jargon that the avatar would not understand? Scoring: clear = high, confusing = low.]]

- [ ] **Clarity** (1-10): Message is crystal clear, no ambiguity, no jargon the avatar would not understand
  - Score: ___/10
  - Notes: ___

### 2. DRE (Dominant Residual Emotion)

[[LLM: The DRE is the emotional engine of the copy. Check:
- Is the correct DRE activated (matching the offer's validated DRE)?
- Does it escalate through levels 1-5 (surface -> relational -> identity)?
- Does it feel real and specific (not generic fear/shame)?
- Does the reader FEEL it in their body, or just understand it intellectually?
Score 1-3 if DRE is absent. Score 4-6 if present but not escalated. Score 7-10 if visceral.]]

- [ ] **DRE** (1-10): Dominant emotion is activated, escalated properly through levels 1-5, and specific to the avatar
  - Score: ___/10
  - DRE identified: ___
  - Escalation level reached: ___/5
  - Notes: ___

### 3. Believability

[[LLM: The mechanism must be credible. Check:
- Are claims backed by named studies, specific numbers, named institutions?
- Does the MUP feel like a real discovery (not a marketing gimmick)?
- Would a skeptical reader's objections be addressed before they form?
- Is there a "too good to be true" feeling anywhere?
Score low if claims are vague or unsupported. Score high if a skeptic would nod along.]]

- [ ] **Believability** (1-10): Claims backed by proof, mechanism is credible, skeptic objections preempted
  - Score: ___/10
  - Notes: ___

### 4. Flow

[[LLM: Read the copy aloud (mentally). Check:
- Does each sentence pull the reader to the next?
- Are there any friction points where the reader might stop?
- Is the pacing varied (short punchy lines mixed with longer explanations)?
- Are transitions between sections smooth?
- Does it feel like a conversation or a textbook?
Score low if you hit a "wall" anywhere. Score high if you cannot stop reading.]]

- [ ] **Flow** (1-10): Reader momentum maintained throughout, no friction points, varied pacing
  - Score: ___/10
  - Notes: ___

### 5. Specificity

[[LLM: Vague copy is dead copy. Check:
- Concrete details: names, numbers, dates, places, percentages
- "Mrs. Johnson, 67, from Tampa" vs "a woman"
- "47.3% reduction in 8 weeks" vs "significant improvement"
- Sensory language: what does the problem FEEL/LOOK/SOUND like?
Score low if you could swap the product name and nothing changes. Score high if every
detail is anchored to THIS offer, THIS avatar, THIS mechanism.]]

- [ ] **Specificity** (1-10): Concrete details, numbers, names, sensory language; not vague or interchangeable
  - Score: ___/10
  - Notes: ___

### 6. Urgency

[[LLM: Check for compelling reason to act NOW (not "someday"). Types:
- Logical urgency: the problem gets worse over time (mechanism-driven)
- Scarcity urgency: limited supply, price increase, seasonal
- Emotional urgency: "every day you wait is another day of..."
- Identity urgency: "who will you be in 6 months if nothing changes?"
NOT: fake countdown timers or "buy now!!!" desperation.
Score low if the reader could bookmark and forget. Score high if delay feels costly.]]

- [ ] **Urgency** (1-10): Compelling, honest reason to act now; delay feels costly to the reader
  - Score: ___/10
  - Urgency type: ___
  - Notes: ___

### 7. Uniqueness

[[LLM: Does this copy feel like ONLY this offer could have produced it? Check:
- Is the MUP/MUS woven throughout (not just mentioned once)?
- Does the angle differentiate from competitors?
- Could a competitor copy-paste this with their product name? If yes, score low.
- Is the paradigm shift clear and original?
Score low if generic. Score high if unmistakably THIS offer.]]

- [ ] **Uniqueness** (1-10): Mechanism and angle differentiated from competitors; unmistakably this offer
  - Score: ___/10
  - Notes: ___

### 8. Proof

[[LLM: Proof is the skeleton that holds believability upright. Check for:
- Social proof: testimonials, case studies, user counts
- Scientific proof: named studies, institutions, researchers
- Authority proof: expert credentials, media mentions, certifications
- Demonstration proof: before/after, mechanism explanation
- Statistical proof: specific numbers, percentages, sample sizes
Score by quantity AND quality of proof elements present.]]

- [ ] **Proof** (1-10): Social proof, scientific studies, authority, testimonials, demonstrations present
  - Score: ___/10
  - Proof elements found: ___
  - Notes: ___

### 9. CTA (Call to Action)

[[LLM: If this deliverable type includes a CTA, score it. If not (e.g., mid-VSL chapter), mark N/A.
Check:
- Is it clear what the reader should do?
- Is it compelling (not just "click here")?
- Does it connect back to the DRE and promise?
- Is there a single, unmistakable next step?
Score N/A for chapters/blocks without CTA. Score low if CTA is weak or unclear.]]

- [ ] **CTA** (1-10 or N/A): Clear, compelling call to action connected to DRE and promise
  - Score: ___/10 (or N/A)
  - Notes: ___

---

## Anti-Homogenization Check

[[LLM: AI-generated copy has telltale patterns. Check for ALL of these:

RED FLAGS (each found = -0.5 from average score):
- Sentences all similar length (no variation)
- "Imagine..." or "Picture this..." used more than once
- Lists of 3 everywhere (tricolon overuse)
- Every paragraph starts with the same structure
- Adverb stacking: "incredibly", "absolutely", "truly", "remarkably"
- Hedge words: "may", "might", "could potentially"
- Filler transitions: "But here's the thing...", "And that's not all..."
- Perfect grammar with no personality (no fragments, no interruptions)
- Overly balanced pros/cons that feel manufactured
- Emotional words without emotional weight ("devastating", "life-changing" used generically)

PASS: 0-2 red flags found
NEEDS_REVISION: 3-5 red flags found
FAIL: 6+ red flags found]]

- [ ] **Anti-Homogenization** — Sentence length varies, no AI crutch phrases, personality present
  - Red flags found: ___/10 checked
  - Specific flags: ___
  - Sub-verdict: ___

---

## Score Summary and Verdict

[[LLM: VERDICT CALCULATION

1. Sum all scored dimensions (exclude N/A)
2. Divide by number of scored dimensions
3. Apply anti-homogenization penalty (-0.5 per red flag beyond 2)
4. Determine verdict:

| Average Score | Verdict | Action |
|--------------|---------|--------|
| >= 7.0 | PASS | Deliverable accepted. Proceed to next step. |
| 5.0 - 6.9 | NEEDS_REVISION | Return to production agent with specific fixes per dimension. |
| < 5.0 | FAIL | Deliverable rejected. Re-brief or re-research may be needed. |

Return this format:
```yaml
quality_gate_result:
  deliverable: "{file_name}"
  offer: "{offer_name}"
  scores:
    clarity: {n}
    dre: {n}
    believability: {n}
    flow: {n}
    specificity: {n}
    urgency: {n}
    uniqueness: {n}
    proof: {n}
    cta: {n or N/A}
  anti_homog_penalty: {-n or 0}
  average_raw: {n.n}
  average_adjusted: {n.n}
  verdict: "{PASS|NEEDS_REVISION|FAIL}"
  weakest_dimensions:
    - "{dimension}: {score} — {reason}"
  required_fixes:
    - "{specific fix instruction}"
```]]

---

## Integration Notes

| Trigger | Agent | Context |
|---------|-------|---------|
| After each deliverable is written | @critic (Hawk) | Invoked by handoff-validator or manual |
| After revision cycle | @critic (Hawk) | Re-score to verify fixes |
| Final validation | @gatekeeper (Sentinel) | Uses these scores in `black_validation` |

**Related tools:**
- `blind_critic` — Automated scoring (subset of these dimensions)
- `emotional_stress_test` — DRE-specific deep validation
- `black_validation` — Final gate using aggregated quality scores

**Related files:**
- `squads/copy-chief/data/critic/metodologia-stand.md` — Scoring methodology details
- `squads/copy-chief/data/critic/exemplos-aprovados.md` — Calibration: what 8+ looks like
- `squads/copy-chief/data/critic/exemplos-reprovados.md` — Calibration: what 4- looks like

---

**Version:** 1.0.0
**Created:** 2026-03-06
**Standard:** Copy Chief BLACK Quality Gate System
