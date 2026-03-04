# /merge — Semantic Merge of Parallel Outputs

Merge multiple files from parallel subagent outputs, deduplicating by Jaccard similarity.

## Usage
```
/merge <file1> <file2> [file3...]     # merge specific files
/merge --voc-squad <offer>            # auto-merge VOC Squad outputs for an offer
/merge --threshold 0.85               # custom Jaccard threshold (default 0.8)
```

## Steps

1. Parse arguments:
   - If `$ARGUMENTS` contains file paths → merge those files
   - If `$ARGUMENTS` contains `--voc-squad <offer>` → find VOC analyst outputs in {offer}/research/voc/processed/
   - Default threshold: 0.8

2. Run the Semantic Merge Engine:
   ```bash
   bun run ~/copywriting-ecosystem/scripts/semantic-merge.ts $ARGUMENTS
   ```

3. Display merge results:
   - Total chunks from all sources
   - Duplicates removed (count + %)
   - Conflicts flagged (if any)
   - Merged output file path

4. If conflicts detected, present each conflict:
   - Source A position
   - Source B position
   - Ask user to resolve or mark for later

Sprint: S27 — Semantic Merge Engine
