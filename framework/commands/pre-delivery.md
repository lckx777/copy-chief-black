# /pre-delivery — Pre-Delivery Quality Gate

Comprehensive quality check before declaring a deliverable or offer complete. This is the copy equivalent of AIOS's `*pre-push` command.

1. Detect target:
   - $ARGUMENTS can be: offer path, deliverable type, or "all"
   - Default: current active story deliverable

2. Run the full production-quality-gate workflow:

   a. Read `~/.claude/tasks/production-quality-gate.md`

   b. Create TaskCreate checklist with all steps

   c. Execute each step:
      - Verify file exists and is complete
      - Run blind_critic (MCP copywriting)
      - Run emotional_stress_test (MCP copywriting)
      - Run layered_review (MCP copywriting)
      - Check Logo Test (manual verification)
      - Check Specificity Score (manual verification)
      - Check anti-homogeneization compliance
      - Run black_validation (MCP copywriting) — FINAL GATE

   d. If ALL pass (scores >= 8):
      - Mark deliverable as VALIDATED in helix-state.yaml
      - Update ClickUp task (if configured)
      - Present summary with all scores
      - Ask human for final approval

   e. If ANY fail:
      - List all failures with specific feedback
      - Suggest targeted fixes
      - DO NOT mark as validated

3. Display results in AIOS style:
```
[PRE-DELIVERY] Landing Page — concursos/decifra-lei-seca

 [x] Arquivo existe (14/14 blocos)
 [x] blind_critic: 8.7/10
 [x] emotional_stress_test: 8.3/10
 [x] layered_review: 3/3 camadas
 [x] Logo Test: PASSED
 [x] Specificity: 8.5/10
 [x] Anti-homogeneizacao: 0 violacoes
 [x] black_validation: 8.5/10

RESULTADO: APPROVED — Pronto para entrega
```

Arguments:
- $ARGUMENTS: offer path + deliverable (e.g., `/pre-delivery concursos/decifra-lei-seca lp`)
- Or just deliverable type: `/pre-delivery lp`
- Or "all" for all deliverables: `/pre-delivery all`
