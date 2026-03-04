---
task:
  id: competitor-analysis
  title: "Competitor Analysis & Ads Library Spy"
  agent: cipher
  input:
    - type: file
      path: "{offer}/CONTEXT.md"
  output:
    - type: file
      path: "{offer}/research/competitors/processed/ads-library-spy.md"
    - type: file
      path: "{offer}/research/competitors/summary.md"
  checklist:
    - item: "4-level search completed (niche, sub-niche, mechanism, known)"
    - item: "Scale Score calculated for TOP 10 pages"
    - item: "TOP 5 videos analyzed"
    - item: "Winning patterns extracted"
    - item: "Market gaps identified"
---

## Instructions

Run Ads Library Spy at 4 levels using Apify for keyword discovery (levels 1-3) and fb_ad_library MCP for known pages (level 4). Calculate Scale Score for each competitor. Analyze TOP 5 competitor videos. Extract winning formats, angles, and patterns. Identify market gaps and opportunities.
