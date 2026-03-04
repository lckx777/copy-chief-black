#!/bin/bash
# ~/.claude/hooks/pre-compact-save.sh
# v8.0 - AIOS-native memory (claude-mem + RLM removed)

echo "" >&2
echo "╔═══════════════════════════════════════════════════════════╗" >&2
echo "║  ⚠️  CONTEXTO COMPACTANDO                                  ║" >&2
echo "╠═══════════════════════════════════════════════════════════╣" >&2
echo "║                                                           ║" >&2
echo "║  Planning files persistem em disco:                       ║" >&2
echo "║    • task_plan.md — plano e specs                         ║" >&2
echo "║    • progress.md — estado exato                           ║" >&2
echo "║    • findings.md — discovery data                         ║" >&2
echo "║                                                           ║" >&2
echo "║  Nova sessao: 'continue o plano' ou                       ║" >&2
echo "║  /planning-with-files:status                              ║" >&2
echo "║                                                           ║" >&2
echo "╚═══════════════════════════════════════════════════════════╝" >&2
echo "" >&2

exit 0
