# VOC Research Task

## Purpose

Extract Voice of Customer (VOC) data from multiple platforms, synthesize into avatar profile with DRE mapping and language patterns. This is the foundation for all downstream copy production -- without authentic VOC, copy becomes invention.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Auto-selects platforms based on niche
- Dispatches all Apify actors in parallel
- Synthesizes without human review
- **Best for:** Niches with abundant online data (saude, relacionamento)

### 2. Interactive Mode - Balanced, Educational (3-5 prompts) **[DEFAULT]**
- Confirms platform selection with user
- Shows sample quotes before full extraction
- Reviews DRE mapping before finalizing
- **Best for:** New niches, unfamiliar audiences

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Maps all data sources before extraction
- Defines search queries per platform
- Sets engagement thresholds upfront
- **Best for:** High-ticket offers, competitive niches

**Parameter:** `mode` (optional, default: `interactive`)

**Usage:**
```
*research-voc {offer-path}                # Interactive mode (default)
*research-voc {offer-path} yolo           # YOLO mode
*research-voc {offer-path} preflight      # Pre-flight planning mode
```

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: researchVoc()
responsavel: Vox (@researcher)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: offer_context
  tipo: file
  origem: "{offer}/CONTEXT.md"
  obrigatorio: true
  validacao: File must exist and contain Produto, Avatar, and Mecanismo sections

- campo: niche
  tipo: string
  origem: CONTEXT.md -> Produto -> Nicho
  obrigatorio: true
  validacao: Must match known niche (saude, relacionamento, concursos, marketing-digital)

- campo: sub_niche
  tipo: string
  origem: CONTEXT.md -> Produto -> Sub-nicho
  obrigatorio: true
  validacao: Non-empty string

- campo: mode
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: yolo|interactive|preflight

**Saida:**
- campo: voc_raw
  tipo: file
  destino: "{offer}/research/voc-raw.md"
  persistido: true

- campo: synthesis
  tipo: file
  destino: "{offer}/research/synthesis.md"
  persistido: true

- campo: avatar_profile
  tipo: embedded
  destino: synthesis.md -> Avatar Profile section
  persistido: true

- campo: dre_map
  tipo: embedded
  destino: synthesis.md -> DRE Map section
  persistido: true

- campo: language_patterns
  tipo: embedded
  destino: synthesis.md -> Language Patterns section
  persistido: true
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] CONTEXT.md exists at {offer}/CONTEXT.md
    tipo: file-existence
    blocker: true
    validacao: |
      File must exist with Produto, Avatar Primario sections populated
    error_message: "CONTEXT.md not found or incomplete. Run offer setup first."

  - [ ] Offer directory structure exists
    tipo: directory-structure
    blocker: true
    validacao: |
      {offer}/ directory must exist with CONTEXT.md
    error_message: "Offer directory not found at {offer}/"

  - [ ] Apify MCP available
    tipo: mcp-availability
    blocker: false
    validacao: |
      Apify actors accessible for scraping. Degrades gracefully if unavailable.
    error_message: "Apify MCP unavailable. Manual VOC collection required."

  - [ ] No active research lock
    tipo: state-check
    blocker: true
    validacao: |
      helix-state.yaml research_phase != LOCKED
    error_message: "Research phase is locked. Another research task may be running."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] voc-raw.md created with minimum 50 quotes
    tipo: file-content
    blocker: true
    validacao: |
      File exists at {offer}/research/voc-raw.md with >= 50 categorized quotes
    error_message: "Insufficient VOC data. Need minimum 50 quotes across platforms."

  - [ ] synthesis.md created with all required sections
    tipo: file-content
    blocker: true
    validacao: |
      File contains: Avatar Profile, DRE Map, Language Patterns, Confidence Score
    error_message: "synthesis.md missing required sections."

  - [ ] DRE identified from data (not invented)
    tipo: data-integrity
    blocker: true
    validacao: |
      DRE in synthesis.md traces to specific quotes in voc-raw.md
    error_message: "DRE must trace to actual VOC quotes. No invention allowed."

  - [ ] Confidence score >= 70%
    tipo: quality-threshold
    blocker: true
    validacao: |
      synthesis.md confidence_score >= 0.70
    error_message: "Synthesis confidence below 70%. Collect more data or refine analysis."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] VOC collected from minimum 3 platforms
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Quotes sourced from >= 3 of: YouTube, Reddit, Amazon, forums, Facebook groups
    error_message: "Must collect from at least 3 platforms for triangulation."

  - [ ] Each quote has source attribution (username + engagement metrics)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Every quote in voc-raw.md has platform, username, and engagement data
    error_message: "Quotes missing attribution. Each must have source + engagement."

  - [ ] Emotions categorized with intensity 1-5
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Categories: MEDO, VERGONHA, CULPA, RAIVA, FRUSTRACAO with intensity scores
    error_message: "Emotion categorization incomplete or missing intensity scores."

  - [ ] Dominant Residual Emotion (DRE) identified
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      DRE clearly stated in synthesis.md with supporting evidence from VOC
    error_message: "DRE not identified. This is the foundation of all copy."

  - [ ] Language patterns extracted for copy production
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Exact phrases, metaphors, and vocabulary patterns documented
    error_message: "Language patterns missing. Copy production needs authentic voice."

  - [ ] Triangulation across 2+ platforms for key insights
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Major insights confirmed by quotes from at least 2 different platforms
    error_message: "Key insights not triangulated. Single-source insights are unreliable."
```

---

## Steps

### Step 1: Load Offer Context
- Read `{offer}/CONTEXT.md`
- Extract niche, sub-niche, avatar hypothesis, known pain points
- Identify target platforms based on niche demographics

### Step 2: Configure Search Queries
- Build search query matrix: niche keywords x pain points x platforms
- Set engagement thresholds (minimum likes/comments for inclusion)
- Configure Apify actors per platform

### Step 3: Dispatch Platform Scrapers (Parallel)
- **YouTube:** Comments on top videos about the problem (Apify YouTube scraper)
- **Reddit:** Posts and comments in relevant subreddits (Apify Reddit scraper)
- **Amazon:** Product reviews for competing solutions (Apify Amazon scraper)
- **Forums:** Niche-specific forums and communities
- **Facebook Groups:** Public group discussions (if accessible)

### Step 4: Filter and Categorize
- Apply engagement threshold filter (remove low-engagement noise)
- Categorize each quote by emotion: MEDO, VERGONHA, CULPA, RAIVA, FRUSTRACAO
- Score emotion intensity (1-5 scale)
- Tag with platform, username, date, engagement metrics

### Step 5: Build VOC Raw Document
- Write `{offer}/research/voc-raw.md`
- Organize by emotion category
- Include full attribution per quote
- Mark high-value quotes (intensity >= 4, engagement >= threshold)

### Step 6: Synthesize into Avatar Profile
- Identify demographic patterns
- Map emotional journey (before/during/after problem awareness)
- Extract exact language patterns (words, metaphors, phrases they use)
- Determine DRE from frequency + intensity analysis
- Calculate confidence score based on data volume and triangulation

### Step 7: Write Synthesis Document
- Write `{offer}/research/synthesis.md`
- Sections: Avatar Profile, DRE Map, Language Patterns, Key Insights, Confidence Score
- Every claim traces to specific quotes in voc-raw.md

---

## Validation

```yaml
validation:
  automated:
    - voc-raw.md file exists and has >= 50 quotes
    - synthesis.md file exists with all required sections
    - confidence_score >= 0.70

  manual:
    - DRE makes emotional sense for the niche
    - Language patterns feel authentic (not academic)
    - Avatar profile matches business intuition

  gate:
    name: research
    requires: [research-voc, research-competitors]
    validator: validate_gate
    threshold: PASSED
```

---

## Error Handling

**Strategy:** retry-with-fallback

**Common Errors:**

1. **Error:** Apify Actor Timeout
   - **Cause:** Platform rate limiting or actor misconfiguration
   - **Resolution:** Retry with exponential backoff, reduce batch size
   - **Recovery:** Fall back to manual platform browsing via Firecrawl

2. **Error:** Insufficient Data (< 50 quotes)
   - **Cause:** Niche too narrow or wrong search queries
   - **Resolution:** Broaden search queries, add adjacent keywords
   - **Recovery:** Lower threshold to 30 quotes with reduced confidence score

3. **Error:** Platform Access Denied
   - **Cause:** Geo-blocking, authentication required, or platform changes
   - **Resolution:** Try alternative Apify actors or proxy configuration
   - **Recovery:** Skip platform, document gap in synthesis.md

4. **Error:** DRE Unclear (multiple emotions tied)
   - **Cause:** Audience has mixed emotional drivers
   - **Resolution:** Segment by sub-avatar, identify primary vs secondary DRE
   - **Recovery:** Document as "DRE: [PRIMARY] + [SECONDARY]" with evidence for both

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 15-30 min
cost_estimated: $0.05-0.15 (Apify actor costs)
token_usage: ~10,000-25,000 tokens
```

**Optimization Notes:**
- Dispatch all platform scrapers in parallel (5 concurrent)
- Cache Apify results to avoid re-scraping on retry
- Use engagement filters early to reduce processing volume

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - Apify MCP (scraping)
  - Firecrawl MCP (fallback)
tags:
  - research
  - voc
  - avatar
  - dre
updated_at: 2026-03-06
```

---

## Handoff

```yaml
next_agent: "@chief"
next_command: "*validate research"
condition: synthesis.md created with confidence >= 70%
parallel_with: research-competitors
gate_after: research (requires both research-voc + research-competitors)
alternatives:
  - agent: "@researcher"
    command: "*research-voc {offer} --expand"
    condition: "Confidence < 70%, need more data"
```
