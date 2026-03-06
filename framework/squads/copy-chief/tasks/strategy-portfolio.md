---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Pull all available data, generate analysis, output recommendations
- No intermediate checkpoints
- **Best for:** Routine portfolio review, quick status overview

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Present findings per analysis dimension
- Checkpoint before recommendations
- **Best for:** First portfolio analysis, strategic decision points

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Define analysis framework and data sources before executing
- Map competitive landscape scope
- **Best for:** Major portfolio decisions, new market entry analysis

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: strategyPortfolio()
responsavel: Strategist (@strategist)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: scope
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: One of [full-portfolio, niche:{niche}, offer:{niche}/{offer}]

- campo: analysis_type
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: One of [overview, pricing, funnel, competitive, all]. Default: all.

- campo: market_data
  tipo: object
  origem: User Input or MCP tools
  obrigatorio: false
  validacao: Optional supplementary market data (ad spend, CPMs, conversion rates)

**Saida:**
- campo: portfolio_analysis
  tipo: file
  destino: "strategy/portfolio-analysis.md"
  persistido: true

- campo: recommendations
  tipo: array
  destino: Return value (YAML summary)
  persistido: false

- campo: competitive_intel
  tipo: file
  destino: "strategy/competitive-intel-{timestamp}.md"
  persistido: true (if competitive analysis run)
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] At least 1 offer exists in the ecosystem
    tipo: pre-condition
    blocker: true
    validacao: |
      Scan ecosystem for {niche}/{offer}/ directories with CONTEXT.md
    error_message: "No offers found in ecosystem."

  - [ ] Each offer has CONTEXT.md with business context
    tipo: pre-condition
    blocker: false
    validacao: |
      Offers in scope have CONTEXT.md with ticket, funnel type, market info
    error_message: "Warning: Some offers missing business context. Analysis may be incomplete."

  - [ ] firecrawl or fb_ad_library accessible for competitive analysis
    tipo: pre-condition
    blocker: false
    validacao: |
      MCP tools available for market intel (not blocking — analysis proceeds without)
    error_message: "Warning: Market intel tools unavailable. Using internal data only."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Portfolio analysis written to strategy/portfolio-analysis.md
    tipo: post-condition
    blocker: true
    validacao: |
      File exists with all analysis sections for scope
    error_message: "Portfolio analysis file not written."

  - [ ] Recommendations are specific and actionable
    tipo: post-condition
    blocker: true
    validacao: |
      Each recommendation has: what, why, expected impact, priority
    error_message: "Recommendations lack specificity or actionability."

  - [ ] If competitive analysis: intel file written
    tipo: post-condition
    blocker: false
    validacao: |
      strategy/competitive-intel-{timestamp}.md exists
    error_message: "Competitive intel file not written."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Portfolio overview covers all offers in scope with current status
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Every offer in scope has: current phase, gate status, business context summary
    error_message: "Portfolio overview incomplete."

  - [ ] Pricing analysis includes ticket comparison and margin estimates
    tipo: acceptance-criterion
    blocker: false
    validacao: |
      Ticket prices compared, margin ranges estimated, upsell paths mapped
    error_message: "Pricing analysis missing."

  - [ ] Funnel analysis identifies bottlenecks and optimization opportunities
    tipo: acceptance-criterion
    blocker: false
    validacao: |
      Each funnel type assessed, bottlenecks identified, optimizations suggested
    error_message: "Funnel analysis missing."

  - [ ] Recommendations prioritized by impact and effort
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Recommendations sorted by impact/effort matrix
    error_message: "Recommendations not prioritized."
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** firecrawl (MCP)
  - **Purpose:** Scrape competitor landing pages, pricing, funnels
  - **Source:** MCP firecrawl tools (firecrawl_scrape, firecrawl_search)

- **Tool:** fb_ad_library (MCP)
  - **Purpose:** Analyze competitor ad creatives, spend, positioning
  - **Source:** MCP fb_ad_library tools (get_meta_ads, analyze_ad_image, analyze_ad_video)

---

## Scripts

**Agent-specific code for this task:**

- **Script:** N/A (agent-driven analysis using MCP tools and file reads)

---

## Purpose

Analyze the copywriting ecosystem portfolio at a strategic level: offer performance, pricing optimization, funnel architecture, competitive positioning, and resource allocation. The Strategist agent operates at the business layer, informing which offers to prioritize, how to price, and where market opportunities exist.

## Prerequisites

- Read all `{niche}/{offer}/CONTEXT.md` files in scope for business context
- Read all `{niche}/{offer}/helix-state.yaml` for pipeline status
- Read all `{niche}/{offer}/mecanismo-unico.yaml` for mechanism positioning
- Access to firecrawl and fb_ad_library MCP tools (optional, for competitive intel)

## Steps

### Step 1: Portfolio Inventory

1. Scan ecosystem for all offers in scope
2. For each offer, extract from CONTEXT.md:
   - Product type, niche, sub-niche
   - Ticket price range
   - Funnel type (VSL, Quiz, TSL, etc.)
   - Market (country, language)
   - Expert/authority figure
   - Current status
3. From helix-state.yaml:
   - Current pipeline phase
   - Gate statuses
   - Timestamps (time-in-phase)
4. Compile portfolio matrix

### Step 2: Pipeline Status Analysis

1. Map all offers on a pipeline heatmap:
   - Research: how many offers waiting
   - Briefing: how many in progress
   - Production: how many producing
   - Review: how many in review
   - Delivery: how many delivered
2. Identify bottlenecks:
   - Phase with most offers stuck
   - Offers with longest time-in-phase
   - Blocked gates and their reasons
3. Resource allocation: which agents are overloaded

### Step 3: Pricing Strategy Analysis

1. Compare ticket prices across offers:
   - Price per unit by niche
   - Kit pricing (1, 3, 6 bundles)
   - Currency differences (EUR, USD, BRL)
2. Estimate margins based on:
   - Production cost (agent time, token usage)
   - Ad spend benchmarks for niche
   - Expected conversion rates by funnel type
3. Identify pricing optimization opportunities:
   - Underpriced offers (room to increase)
   - Overpriced for market (competitive pressure)
   - Missing upsell/cross-sell paths

### Step 4: Funnel Architecture Review

1. Map funnel types across portfolio:
   - VSL -> Checkout (most common)
   - Quiz -> VSL -> Checkout
   - TSL -> Checkout
2. Identify funnel optimization opportunities:
   - Missing sequences (no abandoned cart, no nurture)
   - Cross-offer funnels (related offers upselling each other)
   - Re-engagement paths for existing customers
3. Assess funnel completeness per offer

### Step 5: Competitive Analysis (if MCP tools available)

1. Use `firecrawl_search` to find competitors for each niche:
   - Health supplements: competitor landing pages, pricing
   - Relationship: competing quiz funnels
2. Use `fb_ad_library` to analyze competitor ads:
   - `get_meta_ads` for competitor creative strategies
   - `analyze_ad_image` / `analyze_ad_video` for creative patterns
3. Identify competitive gaps:
   - Mechanisms not used by competitors
   - Pricing positions available
   - Creative angles underexploited
4. Write findings to `strategy/competitive-intel-{timestamp}.md`

### Step 6: Cross-Offer Synergies

1. Identify sibling offers (same niche, related mechanisms):
   - Florayla + Neuvelys + Cognixor + Nerve Action (health siblings)
2. Map cross-sell opportunities:
   - Customer who buys A might buy B
   - Shared audience segments
3. Identify shared assets:
   - Same expert across offers
   - Shared research/VOC data
   - Reusable creative angles

### Step 7: Recommendations

Generate prioritized recommendations:

```yaml
recommendations:
  - id: REC-001
    type: pricing
    offer: "saude/florayla"
    action: "Test EUR 59 base price (currently EUR 49)"
    rationale: "Competitors price at EUR 69+, room to increase"
    expected_impact: "+20% revenue per sale"
    effort: low
    priority: 1

  - id: REC-002
    type: funnel
    offer: "all"
    action: "Add abandoned cart email sequence to all offers"
    rationale: "Missing 15-25% recovery revenue"
    expected_impact: "+15% recovered sales"
    effort: medium
    priority: 2
```

### Step 8: Write Analysis Report

Write to `strategy/portfolio-analysis.md`:

```markdown
# Portfolio Analysis — {date}

## Portfolio Overview
| Offer | Niche | Phase | Ticket | Funnel | Market | Health |
| ... |

## Pipeline Heatmap
[Phase distribution and bottlenecks]

## Pricing Analysis
[Comparison, margins, optimization opportunities]

## Funnel Architecture
[Types, completeness, gaps]

## Competitive Intelligence
[Summary of competitive findings — full report in competitive-intel-{timestamp}.md]

## Cross-Offer Synergies
[Sibling offers, cross-sell, shared assets]

## Recommendations (Prioritized)
[Numbered recommendations with impact/effort]

## Next Actions
[Immediate actions, who does what]
```

## Validation

| Check | Tool | Threshold | Blocking |
|-------|------|-----------|----------|
| All offers inventoried | File scan | 100% in scope | Yes |
| Recommendations actionable | Manual | Specific what/why/impact | Yes |
| Report written | File existence | strategy/portfolio-analysis.md | Yes |
| Competitive intel | firecrawl + fb_ad_library | Optional | No |

---

## Error Handling

**Strategy:** continue (gather what data is available, analyze with what exists)

**Common Errors:**

1. **Error:** MCP tools unavailable (firecrawl, fb_ad_library)
   - **Cause:** Docker not running, MCP not configured, API limits
   - **Resolution:** Proceed with internal data only, skip competitive analysis
   - **Recovery:** Flag competitive intel section as "DATA UNAVAILABLE — rerun when tools accessible"

2. **Error:** Offer CONTEXT.md missing business data
   - **Cause:** Offer not fully set up
   - **Resolution:** Flag offer as "INCOMPLETE DATA" in portfolio matrix
   - **Recovery:** Recommend offer setup completion before including in analysis

3. **Error:** No historical performance data available
   - **Cause:** New ecosystem, no offers delivered yet
   - **Resolution:** Analysis based on market benchmarks and competitor data
   - **Recovery:** Note "BENCHMARK-BASED" on any estimates without real data

4. **Error:** Competitive analysis returns no results
   - **Cause:** Niche too specific, search terms too narrow
   - **Resolution:** Broaden search terms, try alternative competitor identification
   - **Recovery:** Note gaps in competitive intel report

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 20-45 min (depends on scope and MCP availability)
cost_estimated: $0.05-0.20 (opus model, MCP calls extra)
token_usage: ~30,000-80,000 tokens
```

**Optimization Notes:**
- Run portfolio inventory before MCP calls (internal data fast)
- Batch MCP calls by niche (similar competitors)
- Cache competitive intel for 7 days (market changes slowly)
- Skip competitive analysis in YOLO mode for speed

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies: []
tags:
  - strategy
  - portfolio
  - pricing
  - competitive
  - strategist
updated_at: 2026-03-06
```

---

## Handoff
next_agent: chief
next_command: "Route based on top recommendation"
condition: Analysis complete, recommendations generated
alternatives:
  - agent: blade, command: "*produce emails abandoned-cart {offer}", condition: Recommendation is missing email sequences
  - agent: vox, command: "*research {offer}", condition: Recommendation is research gap
  - agent: ops, command: "*sync ecosystem", condition: State updates needed after strategy review
