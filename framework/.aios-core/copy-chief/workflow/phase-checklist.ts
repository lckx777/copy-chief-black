// ~/.claude/.aios-core/copy-chief/workflow/phase-checklist.ts
// Business logic extracted from phase-advance-gate.ts hook
// v8.0 - 3-Layer Phase Review Checklist generation
// Extracted: 2026-03-02

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  HELIX_REQUIRED_TOOLS,
  TOOL_DISPLAY_NAMES,
} from '../state/offer-state';
import { getPhaseInfo } from '../workflow/helix-phases';

const ECOSYSTEM_ROOT = join(process.env.HOME!, 'copywriting-ecosystem');

// ─── Phase Config Types ───────────────────────────────────────────────────────

export interface PhaseConfig {
  name: string;
  displayName: string;
  nextPhase: string;
  layer1: string[];   // Automated checks
  layer2: string[];   // Semi-automated (deliverable review)
  layer3: string[];   // Human review items
}

// ─── Phase Configs Table (~110L of checklist data) ────────────────────────────

export const PHASE_CONFIGS: Record<number, PhaseConfig> = {
  1: {
    name: 'RESEARCH',
    displayName: 'Research',
    nextPhase: 'BRIEFING (Phase 1: One Belief)',
    layer1: [
      '- [x] validate_gate("research") passed',
      '- [x] synthesis.md exists with confidence >= 70%',
      '- [x] VOC summary.md exists',
      '- [x] VOC trends-analysis.md exists',
      '- [x] competitors/summary.md exists',
      '- [x] ads-library-spy.md exists',
      '- [x] mechanism/summary.md exists',
      '- [x] avatar/summary.md exists',
    ],
    layer2: [
      '- [ ] synthesis.md covers all research modules (VOC, competitors, mechanism, avatar)',
      '- [ ] Minimum 50 quotes per platform in VOC extraction',
      '- [ ] Emotions categorized: MEDO, VERGONHA, CULPA, RAIVA, FRUSTRACAO',
      '- [ ] Ads Library Spy has Scale Scores for top 10 pages',
      '- [ ] TOP 5 videos analyzed (format + angle + hook + funnel)',
      '- [ ] DRE (Dominant Resident Emotion) identified from VOC',
      '- [ ] Emotional escalation levels 4-5 quotes collected',
    ],
    layer3: [
      '- [ ] Research findings align with business hypothesis',
      '- [ ] Avatar description matches real market observations',
      '- [ ] DRE selection approved by human',
      '- [ ] Competitor landscape is comprehensive (no major players missed)',
      '- [ ] Ready to proceed to briefing',
    ],
  },
  5: {
    name: 'HELIX_PHASE_05',
    displayName: 'MUP (Problema/Vilao)',
    nextPhase: 'Phase 6: MUS (Mecanismo/Solucao)',
    layer1: [
      '- [x] get_phase_context called for Phase 5',
      '- [x] voc_search used to validate MUP language',
      '- [x] consensus run with TOP 3 MUP candidates',
      '- [x] blind_critic validated MUP Statement (score >= 8)',
    ],
    layer2: [
      '- [ ] MUP has Nova Causa (different from market narrative)',
      '- [ ] Sexy Cause name is memorable and shareable',
      '- [ ] Problema Fundamental is tangible and specific',
      '- [ ] MUP removes blame from avatar',
      '- [ ] MUP explains why other solutions failed',
      '- [ ] RMBC scores all >= 7 (Digerivel, Unico, Provavel, Conectado)',
    ],
    layer3: [
      '- [ ] Sexy Cause passes transmissibility test ("Would they TELL someone?")',
      '- [ ] MUP Statement approved by human',
      '- [ ] MUP aligns with VOC emotional patterns',
      '- [ ] Ready to define MUS based on this MUP',
    ],
  },
  6: {
    name: 'HELIX_PHASE_06',
    displayName: 'MUS (Mecanismo/Solucao)',
    nextPhase: 'Phase 7: Big Offer',
    layer1: [
      '- [x] get_phase_context called for Phase 6',
      '- [x] blind_critic validated MUS Statement (score >= 8)',
      '- [x] emotional_stress_test validated MUP+MUS (genericidade >= 8)',
    ],
    layer2: [
      '- [ ] MUS has Ingrediente Hero clearly defined',
      '- [ ] Gimmick Name is catchy AND linked to ingredient hero',
      '- [ ] Origin Story is credible and creates curiosity',
      '- [ ] Authority Hook references recognized super structure',
      '- [ ] mecanismo-unico.yaml state = VALIDATED or APPROVED',
      '- [ ] RMBC scores all >= 7',
      '- [ ] Formula do Gancho works with all components',
    ],
    layer3: [
      '- [ ] Gimmick Name passes "sticky + ingredient" test',
      '- [ ] Authority Hook is verifiable',
      '- [ ] MUS Statement approved by human',
      '- [ ] mecanismo-unico.yaml → APPROVED',
      '- [ ] Ready for production phase',
    ],
  },
  10: {
    name: 'HELIX_PHASE_10',
    displayName: 'Progressao Emocional',
    nextPhase: 'PRODUCTION',
    layer1: [
      '- [x] get_phase_context called for Phase 10',
      '- [x] validate_gate("briefing") passed',
      '- [x] All 10 HELIX phases have files',
      '- [x] mecanismo-unico.yaml state = VALIDATED or APPROVED',
    ],
    layer2: [
      '- [ ] Emotional progression maps from DRE to hope/action',
      '- [ ] All 5 escalation levels covered in progression',
      '- [ ] Transitions between phases are coherent',
      '- [ ] One Belief thread runs through all phases',
      '- [ ] Complete HELIX briefing reviewed for internal consistency',
    ],
    layer3: [
      '- [ ] Briefing is production-ready',
      '- [ ] Human approves complete HELIX briefing',
      '- [ ] Production deliverables identified (VSL, LP, Criativos)',
      '- [ ] Ready to enter production',
    ],
  },
};

// ─── Default and Enriched Config Builders ────────────────────────────────────

/**
 * Builds a generic PhaseConfig for phases without specific entries in PHASE_CONFIGS.
 */
export function getDefaultPhaseConfig(phase: number): PhaseConfig {
  const requiredTools = HELIX_REQUIRED_TOOLS[phase] || ['get_phase_context'];
  return {
    name: `HELIX_PHASE_${String(phase).padStart(2, '0')}`,
    displayName: `Phase ${phase}`,
    nextPhase: phase < 10 ? `Phase ${phase + 1}` : 'PRODUCTION',
    layer1: requiredTools.map(t => `- [x] ${TOOL_DISPLAY_NAMES[t] || t} used`),
    layer2: [
      `- [ ] Phase ${phase} deliverable is complete and coherent`,
      `- [ ] Content aligns with previous phases`,
      `- [ ] VOC language used (not generic)`,
    ],
    layer3: [
      `- [ ] Human reviewed Phase ${phase} output`,
      `- [ ] Ready to proceed to next phase`,
    ],
  };
}

/**
 * Returns a PhaseConfig for the given phase number, enriched with helix-phases
 * canonical data when no hardcoded config exists.
 */
export function getPhaseConfigWithHelixData(phase: number): PhaseConfig {
  // Use hardcoded config if available (phases 1, 5, 6, 10 have detailed configs)
  if (PHASE_CONFIGS[phase]) return PHASE_CONFIGS[phase];

  // Enrich default config with helix-phases canonical data
  const helixInfo = getPhaseInfo(phase);
  const defaultConfig = getDefaultPhaseConfig(phase);

  if (helixInfo) {
    defaultConfig.displayName = helixInfo.displayName;
    defaultConfig.name = `HELIX_PHASE_${String(phase).padStart(2, '0')}_${helixInfo.name.toUpperCase()}`;
  }

  return defaultConfig;
}

// ─── Checklist Generation ─────────────────────────────────────────────────────

/**
 * Generates a 3-layer phase review checklist and saves it to
 * {offer}/reviews/phase-{XX}-review.md
 * Non-blocking: a failure to generate does not prevent the write.
 */
export function generatePhaseReviewChecklist(offerPath: string, phase: number): void {
  try {
    const config = getPhaseConfigWithHelixData(phase);
    const now = new Date().toISOString();
    const reviewDir = join(ECOSYSTEM_ROOT, offerPath, 'reviews');

    if (!existsSync(reviewDir)) {
      mkdirSync(reviewDir, { recursive: true });
    }

    const phaseLabel = String(phase).padStart(2, '0');
    const reviewPath = join(reviewDir, `phase-${phaseLabel}-review.md`);

    const layer1Checks = config.layer1.join('\n');
    const layer2Checks = config.layer2.join('\n');
    const layer3Checks = config.layer3.join('\n');

    // Count automated passes
    const layer1Total = config.layer1.length;
    const layer1Passed = config.layer1.filter(l => l.includes('[x]')).length;
    const layer1Status = layer1Passed === layer1Total ? 'PASSED' : `${layer1Passed}/${layer1Total}`;

    const content = `# Phase Review Checklist — Phase ${phase} (${config.displayName}) → ${config.nextPhase}

> **Template:** phase-review-checklist.md
> **Version:** v1.0 (2026-02-24)
> **Offer:** ${offerPath}
> **Generated:** ${now}

---

## Layer 1: Pre-Advance (Automated)

> Auto-generated checks based on Phase ${phase}. These were verified programmatically
> by the phase-advance-gate hook at write time.

${layer1Checks}

**Layer 1 Status:** ${layer1Status}

## Layer 2: Deliverable Review (Semi-Automated)

> Phase-specific deliverable checks for ${config.displayName}.
> Some can be verified by file existence, others require content review.

${layer2Checks}

**Layer 2 Status:** PENDING REVIEW

## Layer 3: Human Review

> Items requiring human judgment and explicit approval before advancing
> from ${config.displayName} to ${config.nextPhase}.

${layer3Checks}

**Layer 3 Status:** PENDING HUMAN APPROVAL

---

## Gate Decision

| Item | Value |
|------|-------|
| **Phase** | ${phase} — ${config.displayName} |
| **Target** | ${config.nextPhase} |
| **Layer 1** | ${layer1Status} |
| **Layer 2** | PENDING |
| **Layer 3** | PENDING |
| **Decision** | PENDING |
| **Reviewed by** | — |
| **Date** | ${now.split('T')[0]} |
`;

    writeFileSync(reviewPath, content);
    console.error(`[PHASE-CHECKLIST] Checklist generated: ${reviewPath}`);
  } catch (error) {
    // Non-blocking: checklist generation failure should not prevent the write
    console.error(`[PHASE-CHECKLIST] Warning: Could not generate checklist: ${error}`);
  }
}
