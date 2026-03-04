---
task:
  id: voc-extraction
  title: "VOC Extraction & Avatar Profiling"
  agent: vox
  input:
    - type: file
      path: "{offer}/CONTEXT.md"
  output:
    - type: directory
      path: "{offer}/research/voc/"
    - type: file
      path: "{offer}/research/synthesis.md"
  checklist:
    - item: "5 platform analysts dispatched in parallel"
    - item: "Viral-first: only high-engagement content extracted"
    - item: "Username + engagement per quote"
    - item: "Emotion categorization with intensity 1-5"
    - item: "Triangulation across 2+ platforms"
    - item: "DRE identified from data"
    - item: "synthesis.md confidence >= 70%"
---

## Instructions

Extract Voice of Customer from YouTube, Instagram, TikTok, Reddit, and Amazon/review platforms. Use Apify actors as primary tool. Dispatch 5 analysts in parallel via general-purpose subagents. Record engagement metrics with every quote. Categorize emotions (MEDO, VERGONHA, CULPA, RAIVA, FRUSTRACAO). Build avatar profile. Create synthesis.md with confidence score.
