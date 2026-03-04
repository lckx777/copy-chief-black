# Knowledge Infrastructure (Level 4)

Directory: `~/.claude/knowledge/`
Created: 2026-02-26
Purpose: Enable the system to LEARN from past validations and TRANSFER patterns across offers.

## Problem Solved

Before this infrastructure, each production cycle started from scratch. An offer in saude could fail emotional_stress_test for the same reason a concursos offer failed 3 weeks prior. There was no mechanism to transfer learnings.

## Files

### feedback-loops.yaml

Records every validation result (blind_critic, emotional_stress_test, consensus, black_validation) from every offer. Each entry includes:

- **offer**: which offer was validated
- **niche**: which niche it belongs to
- **tool**: which MCP tool scored it
- **score/threshold/passed**: the numerical result
- **success_patterns** (if passed): what worked and WHY -- replicable in future offers
- **failure_reasons + constraints_derived** (if failed): what went wrong and WHAT TO DO differently

Data sources:
- Historical: extracted from `helix-state.yaml` and `mecanismo-unico.yaml` across all offers
- Live: appended by the `post-validation-feedback` hook after each MCP validation call

Meta-patterns section identifies recurring cross-offer issues (e.g., "blind_critic high + EST low" pattern affecting 37.5% of offers).

Stats section provides aggregate metrics by tool and by niche.

### patterns-by-niche.yaml

Distills feedback-loops.yaml into actionable production constraints organized by niche:

- **patterns_validated**: what WORKED (score >= 8) with specific injection text for production prompts
- **anti_patterns**: what FAILED (score < 7) with specific avoidance constraints
- **cross_niche**: universal patterns that apply to ALL production regardless of niche

Each pattern includes:
- Source offer and tool
- Score achieved
- Whether it is replicable
- Exact injection text to include in production prompts

## How the Post-Validation-Feedback Hook Populates Them

After every call to blind_critic, emotional_stress_test, or black_validation:

1. Hook extracts score from tool response
2. Compares against threshold (8.0 for blind_critic/EST, 8.0 for black_validation)
3. If PASSED: records success_patterns
4. If FAILED: records failure_reasons + derives constraints
5. Appends entry to feedback-loops.yaml
6. Updates stats counters

## How Production Agents Should Load Them

Before producing any copy:

1. Read `patterns-by-niche.yaml`
2. Load the section matching the target niche (e.g., `niches.concursos`)
3. Inject `patterns_validated[].injection` as POSITIVE constraints
4. Inject `anti_patterns[].injection` as NEGATIVE constraints
5. Always load `cross_niche` section regardless of niche
6. After production validation, check if new constraints should be derived

Example loading sequence:
```
1. Read patterns-by-niche.yaml
2. Extract niches.{current_niche}.patterns_validated
3. Extract niches.{current_niche}.anti_patterns
4. Extract cross_niche.universal_success_patterns
5. Extract cross_niche.universal_anti_patterns
6. Inject all as constraints in production prompt
```

## Key Insights from Initial Seed Data

1. **emotional_stress_test is the bottleneck**: 57.1% pass rate vs 100% for blind_critic. The system consistently builds strong mechanisms but struggles with narrative articulation.

2. **blind_critic high + EST low = narrative gap**: Affects 37.5% of offers. Fix is adding sensory scenes and emotional escalation, NOT changing the mechanism.

3. **Dual naming (scientific + popular) correlates with higher scores**: Every offer with a scientific/popular name pair scored >= 8.0 on blind_critic MUP.

4. **Gimmick = product name** is the strongest branding pattern: 3 of the highest-scoring offers use this approach.

5. **relacionamento niche has highest scores** (avg BC 9.05, EST 9.1) while **concursos has most offers but lowest EST** (avg 7.32).
