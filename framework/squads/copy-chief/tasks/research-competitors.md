# Competitor Research Task

## Purpose

Mine competitor ads, VSLs, and landing pages to extract winning patterns, hooks, mechanisms, claims, and angles. Calculate Scale Scores for top competitors. Identify market gaps and opportunities for differentiation. Runs in parallel with research-voc.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Auto-generates search keywords from CONTEXT.md
- Runs all 4 search levels without confirmation
- Calculates Scale Scores autonomously
- **Best for:** Well-defined niches with known competitors

### 2. Interactive Mode - Balanced, Educational (3-5 prompts) **[DEFAULT]**
- Confirms keyword selection with user
- Shows initial ad results before deep analysis
- Reviews Scale Score methodology with user
- **Best for:** New niches, unclear competitive landscape

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Maps full competitive landscape before mining
- Defines known competitors and page IDs upfront
- Sets analysis criteria before extraction
- **Best for:** Saturated markets, high-ticket offers

**Parameter:** `mode` (optional, default: `interactive`)

**Usage:**
```
*research-competitors {offer-path}                # Interactive mode (default)
*research-competitors {offer-path} yolo           # YOLO mode
*research-competitors {offer-path} preflight      # Pre-flight planning mode
```

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: researchCompetitors()
responsavel: Cipher (@miner)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: offer_context
  tipo: file
  origem: "{offer}/CONTEXT.md"
  obrigatorio: true
  validacao: File must exist with Produto and Business Context sections

- campo: niche_keywords
  tipo: array
  origem: CONTEXT.md -> Nicho + Sub-nicho + known keywords
  obrigatorio: true
  validacao: Minimum 3 keywords

- campo: known_competitors
  tipo: array
  origem: User Input or CONTEXT.md
  obrigatorio: false
  validacao: Facebook page IDs or page names

- campo: mode
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: yolo|interactive|preflight

**Saida:**
- campo: competitors_report
  tipo: file
  destino: "{offer}/research/competitors.md"
  persistido: true

- campo: ad_swipes
  tipo: directory
  destino: "{offer}/research/ad-swipes/"
  persistido: true

- campo: scale_scores
  tipo: embedded
  destino: competitors.md -> Scale Scores section
  persistido: true

- campo: winning_patterns
  tipo: embedded
  destino: competitors.md -> Winning Patterns section
  persistido: true

- campo: market_gaps
  tipo: embedded
  destino: competitors.md -> Market Gaps section
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
      File must exist with Produto, Business Context sections populated
    error_message: "CONTEXT.md not found. Run offer setup first."

  - [ ] fb_ad_library MCP available
    tipo: mcp-availability
    blocker: false
    validacao: |
      Facebook Ad Library MCP accessible for ad mining
    error_message: "fb_ad_library MCP unavailable. Limited to Apify-only mining."

  - [ ] Apify MCP available
    tipo: mcp-availability
    blocker: false
    validacao: |
      Apify actors accessible for keyword discovery and video analysis
    error_message: "Apify MCP unavailable. Manual competitor research required."

  - [ ] Minimum 3 niche keywords defined
    tipo: data-availability
    blocker: true
    validacao: |
      At least 3 search keywords extractable from CONTEXT.md
    error_message: "Insufficient keywords. CONTEXT.md must have Nicho + Sub-nicho defined."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] competitors.md created with all required sections
    tipo: file-content
    blocker: true
    validacao: |
      File contains: Scale Scores, Winning Patterns, Market Gaps, Ad Analysis
    error_message: "competitors.md missing required sections."

  - [ ] ad-swipes/ directory populated
    tipo: directory-content
    blocker: true
    validacao: |
      At least 5 ad swipes saved with metadata
    error_message: "Insufficient ad swipes collected."

  - [ ] Scale Scores calculated for TOP 10 pages
    tipo: data-completeness
    blocker: true
    validacao: |
      Scale Score (impressions, longevity, variations) for at least 10 competitor pages
    error_message: "Scale Scores not calculated for enough competitors."

  - [ ] Winning patterns extracted with examples
    tipo: data-quality
    blocker: true
    validacao: |
      Patterns include: hooks, mechanisms, claims, angles with specific examples
    error_message: "Winning patterns missing specific examples."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] 4-level search completed
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Level 1: Niche keywords, Level 2: Sub-niche keywords,
      Level 3: Mechanism keywords, Level 4: Known competitor pages
    error_message: "All 4 search levels must be completed."

  - [ ] Scale Score calculated for TOP 10 pages
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Score based on: ad impressions, longevity (days running), variation count
    error_message: "Scale Scores incomplete for top competitors."

  - [ ] TOP 5 competitor videos analyzed
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Hook, mechanism, claim structure, emotional angle documented per video
    error_message: "Video analysis incomplete. Need at least 5 competitor videos."

  - [ ] Winning patterns extracted (hooks, mechanisms, claims, angles)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Minimum: 10 hooks, 5 mechanisms, 10 claims, 5 angles documented
    error_message: "Pattern extraction incomplete."

  - [ ] Market gaps identified with differentiation opportunities
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      At least 3 market gaps or differentiation angles documented
    error_message: "Market gaps not identified. Critical for positioning."

  - [ ] Ad swipes saved with metadata (platform, date, engagement)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Each swipe includes: creative text, platform, date range, estimated impressions
    error_message: "Ad swipes missing metadata."
```

---

## Steps

### Step 1: Load Offer Context and Build Keyword Matrix
- Read `{offer}/CONTEXT.md`
- Extract niche, sub-niche, mechanism keywords, known competitor names
- Build 4-level keyword matrix:
  - Level 1: Broad niche terms (e.g., "tinnitus", "zumbido no ouvido")
  - Level 2: Sub-niche terms (e.g., "tinnitus supplement", "tinnitus treatment")
  - Level 3: Mechanism-specific terms (e.g., "otolith crystals", "cochlear damage")
  - Level 4: Known competitor page names/IDs

### Step 2: Mine Facebook Ad Library (Levels 1-4)
- Use `fb_ad_library` MCP (`get_meta_ads`) for each keyword level
- For Level 4, use `get_meta_platform_id` to resolve page names to IDs
- Collect: ad text, creative type, start date, impressions estimate, page name
- Filter for active ads (running > 7 days = likely profitable)

### Step 3: Calculate Scale Scores
- For TOP 10 pages by ad volume:
  - **Impressions Score:** Estimated reach (EU/BR impression ranges)
  - **Longevity Score:** Days running (>30 days = strong signal)
  - **Variation Score:** Number of creative variations (more = active testing)
  - **Composite Scale Score:** Weighted average of all three

### Step 4: Analyze TOP 5 Competitor Videos
- Select 5 highest Scale Score competitors with video ads
- For each video, extract:
  - Hook (first 3-5 seconds): text, visual, emotional trigger
  - Mechanism: what they claim causes the problem
  - Solution claim: what they promise and how
  - Emotional angle: primary emotion targeted
  - CTA structure: urgency, scarcity, offer framing

### Step 5: Extract Winning Patterns
- Cross-reference all ads to identify:
  - Most common hook formats (question, story, statistic, shock)
  - Mechanism naming patterns (medical vs. colloquial)
  - Claim structures (specific vs. vague, timeframe promises)
  - Angle categories (fear, aspiration, social proof, authority)

### Step 6: Identify Market Gaps
- Map competitor mechanisms on uniqueness vs. credibility matrix
- Find underserved emotional angles
- Identify claim gaps (what nobody is saying)
- Document differentiation opportunities for this offer

### Step 7: Save Ad Swipes and Write Report
- Save top ad creatives to `{offer}/research/ad-swipes/`
- Write comprehensive `{offer}/research/competitors.md`
- Sections: Scale Scores, Ad Analysis, Video Breakdowns, Winning Patterns, Market Gaps

---

## Validation

```yaml
validation:
  automated:
    - competitors.md exists with all required sections
    - ad-swipes/ directory has >= 5 files
    - Scale Scores calculated for >= 10 pages

  manual:
    - Patterns feel representative of the market
    - Market gaps are actionable for this offer
    - Scale Scores align with intuition about big players

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

1. **Error:** fb_ad_library Rate Limit
   - **Cause:** Too many API calls in short period
   - **Resolution:** Implement exponential backoff between calls
   - **Recovery:** Queue remaining searches, resume after cooldown

2. **Error:** No Ads Found for Keywords
   - **Cause:** Keywords too specific or niche too new
   - **Resolution:** Broaden to Level 1 keywords, try adjacent niches
   - **Recovery:** Document as "emerging market" in gaps section

3. **Error:** Video Analysis Unavailable
   - **Cause:** Videos behind paywall or geo-restricted
   - **Resolution:** Try Apify video downloader or Firecrawl
   - **Recovery:** Analyze ad text and thumbnail only, note limitation

4. **Error:** Competitor Page ID Not Found
   - **Cause:** Page name changed or deactivated
   - **Resolution:** Search by alternative names or URLs
   - **Recovery:** Skip page, document as inactive competitor

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 20-40 min
cost_estimated: $0.02-0.10 (fb_ad_library + Apify costs)
token_usage: ~15,000-30,000 tokens
```

**Optimization Notes:**
- Run Level 1-3 keyword searches in parallel
- Cache fb_ad_library results to avoid re-fetching on retry
- Analyze videos concurrently with ad text mining

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - fb_ad_library MCP (ad mining)
  - Apify MCP (keyword discovery, video analysis)
  - Firecrawl MCP (fallback scraping)
tags:
  - research
  - competitors
  - ads
  - scale-score
updated_at: 2026-03-06
```

---

## Handoff

```yaml
next_agent: "@chief"
next_command: "*validate research"
condition: competitors.md created with Scale Scores and Market Gaps
parallel_with: research-voc
gate_after: research (requires both research-voc + research-competitors)
alternatives:
  - agent: "@miner"
    command: "*research-competitors {offer} --deep"
    condition: "Market too saturated, need deeper Level 4 analysis"
```
