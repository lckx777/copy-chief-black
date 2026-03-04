---
template_name: "etl-checklist"
template_version: "1.0.0"
template_type: "checklist"
description: "Checklist para processos ETL de extracao e processamento de dados VOC"
phase: "research"
output_format: "markdown"
---

# ETL Quality Checklist — {offer}

> **Template:** etl-checklist.md
> **Version:** v1.0 (2026-02-24)
> **Generated:** {timestamp}

---

## Tier 1: Completeness
- [ ] VOC directory exists with subdirectories (voc/, voc/raw/, voc/processed/)
- [ ] Minimum 50 quotes per platform
- [ ] All required platforms covered (YouTube, Instagram, TikTok, Reddit)
- [ ] Raw data stored in raw/ (not in context)
- [ ] Processed summaries in processed/

## Tier 2: Security
- [ ] No PII (full names, emails, phones) in processed data
- [ ] URLs validated and accessible
- [ ] No spam/bot content
- [ ] Content is authentic VOC (not brand/influencer)

## Tier 3: Quality
- [ ] Intensity scores assigned (1-5 scale)
- [ ] Duplicates removed
- [ ] Minimum engagement thresholds met
- [ ] Emotions categorized (MEDO, VERGONHA, CULPA, RAIVA, FRUSTRACAO)
- [ ] Triangulation: quotes appearing in 2+ platforms flagged

---

## Summary

| Tier | Status | Issues |
|------|--------|--------|
| Completeness | {status_completeness} | {issues_completeness} |
| Security | {status_security} | {issues_security} |
| Quality | {status_quality} | {issues_quality} |

## Collection Progress

| Platform | Total | Valid | Rejected |
|----------|-------|-------|----------|
| YouTube | {yt_total} | {yt_valid} | {yt_rejected} |
| Instagram | {ig_total} | {ig_valid} | {ig_rejected} |
| TikTok | {tt_total} | {tt_valid} | {tt_rejected} |
| Reddit | {rd_total} | {rd_valid} | {rd_rejected} |

## Resume State

- **Status:** {resume_status}
- **Started:** {resume_started}
- **Last Updated:** {resume_updated}
- **Platforms Completed:** {platforms_completed}
- **Total Quotes:** {total_quotes}
- **Last Error:** {last_error}
