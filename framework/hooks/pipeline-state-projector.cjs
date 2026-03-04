'use strict';

/**
 * Pipeline State Projector Hook
 * Event: SubagentStop (after handoff-validator-hook)
 * Budget: <3s
 *
 * Projects helix-state.yaml → pipeline-state.json for dashboard consumption.
 * Creates or updates pipeline-state.json at the offer root.
 * Fail-open: never blocks Claude.
 */

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const CANONICAL_STEPS = [
  { id: 'research.voc', phase: 'research', description: 'VOC Extraction' },
  { id: 'research.competitors', phase: 'research', description: 'Competitor Analysis' },
  { id: 'research.mechanism', phase: 'research', description: 'Mechanism Discovery' },
  { id: 'research.avatar', phase: 'research', description: 'Avatar Synthesis' },
  { id: 'research.synthesis', phase: 'research', description: 'Research Synthesis' },
  { id: 'research.gate', phase: 'research', description: 'Research Gate Validation' },
  { id: 'briefing.fase_01', phase: 'briefing', description: 'HELIX Fase 1: Analise de Inputs' },
  { id: 'briefing.fase_02', phase: 'briefing', description: 'HELIX Fase 2: Definicao de Avatar' },
  { id: 'briefing.fase_03', phase: 'briefing', description: 'HELIX Fase 3: Definicao de DRE' },
  { id: 'briefing.fase_04', phase: 'briefing', description: 'HELIX Fase 4: Nivel de Consciencia' },
  { id: 'briefing.fase_05', phase: 'briefing', description: 'HELIX Fase 5: Problema/Vilao/MUP' },
  { id: 'briefing.fase_06', phase: 'briefing', description: 'HELIX Fase 6: Solucao/MUS' },
  { id: 'briefing.fase_07', phase: 'briefing', description: 'HELIX Fase 7: Estrutura da Oferta' },
  { id: 'briefing.fase_08', phase: 'briefing', description: 'HELIX Fase 8: Stack de Valor' },
  { id: 'briefing.fase_09', phase: 'briefing', description: 'HELIX Fase 9: Garantia e Urgencia' },
  { id: 'briefing.fase_10', phase: 'briefing', description: 'HELIX Fase 10: Consolidacao' },
  { id: 'briefing.gate', phase: 'briefing', description: 'Briefing Gate Validation' },
  { id: 'production.lp', phase: 'production', description: 'Landing Page' },
  { id: 'production.creatives', phase: 'production', description: 'Criativos' },
  { id: 'production.vsl', phase: 'production', description: 'VSL Script' },
  { id: 'production.emails', phase: 'production', description: 'Email Sequence' },
  { id: 'production.final_validation', phase: 'production', description: 'BLACK Validation Final' },
];

// Map research deliverables to filesystem markers
const RESEARCH_FILE_MAP = {
  'research.voc': 'research/voc/summary.md',
  'research.competitors': 'research/competitors/summary.md',
  'research.mechanism': 'research/mechanism/summary.md',
  'research.avatar': 'research/avatar/summary.md',
  'research.synthesis': 'research/synthesis.md',
};

// Map production deliverables to filesystem markers
const PRODUCTION_FILE_MAP = {
  'production.lp': 'production/landing-page/',
  'production.creatives': 'production/creatives/',
  'production.vsl': 'production/vsl/',
  'production.emails': 'production/emails/',
};

async function main() {
  let input = '';
  try { input = fs.readFileSync(0, 'utf8'); } catch { return out(); }

  let context = {};
  try { context = JSON.parse(input); } catch { return out(); }

  const prompt = context.prompt || context.description || '';
  const offerPath = detectOfferPath(prompt);
  if (!offerPath) return out();

  const ecosystemRoot = process.env.ECOSYSTEM_ROOT || path.join(process.env.HOME, 'copywriting-ecosystem');
  const offerDir = path.join(ecosystemRoot, offerPath);

  // === Priority: Project from execution-plan.yaml if present ===
  const planPath = path.join(offerDir, '.aios', 'execution-plan.yaml');
  if (fs.existsSync(planPath)) {
    try {
      const plan = yaml.load(fs.readFileSync(planPath, 'utf8'));
      if (plan && plan.tasks) {
        projectFromPlan(plan, offerPath, offerDir);
        return out();
      }
    } catch { /* fall through to helix-state heuristic */ }
  }

  // === Fallback: Project from helix-state.yaml ===
  // Read helix-state.yaml
  const helixPath = path.join(offerDir, 'helix-state.yaml');
  if (!fs.existsSync(helixPath)) return out();

  let helix;
  try { helix = yaml.load(fs.readFileSync(helixPath, 'utf8')); } catch { return out(); }
  if (!helix) return out();

  const now = new Date().toISOString();

  // Read existing pipeline-state.json (preserve started_at, mode)
  const pipelinePath = path.join(offerDir, 'pipeline-state.json');
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(pipelinePath, 'utf8')); } catch { /* new file */ }

  // Project steps
  const completed = [];
  const remaining = [];

  for (const step of CANONICAL_STEPS) {
    if (isStepCompleted(step, helix, offerDir)) {
      completed.push({
        id: step.id,
        phase: step.phase,
        description: step.description,
        result: 'SUCCESS',
        details: 'Synced from helix-state.yaml',
        completed_at: now,
      });
    } else {
      remaining.push(step.id);
    }
  }

  // Determine current phase and step
  const currentStep = remaining[0] || null;
  const currentPhase = currentStep ? currentStep.split('.')[0] : 'delivered';

  // Determine pipeline status
  let status = 'IN_PROGRESS';
  if (remaining.length === 0) status = 'COMPLETED';
  if (completed.length === 0 && !helix.phase) status = 'IDLE';

  // Build state
  const state = {
    offer_path: offerPath,
    status,
    current_phase: currentPhase,
    current_step: currentStep,
    started_at: existing.started_at || helix.created_at || now,
    updated_at: now,
    steps_completed: completed,
    steps_remaining: remaining,
    mode: existing.mode || (existing.overnight_mode ? 'overnight' : 'interactive'),
    _source: 'aios-projection',
    _generated_by: 'pipeline-state-projector',
    _generated_at: now,
  };

  // Write pipeline-state.json
  try {
    fs.writeFileSync(pipelinePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
  } catch { /* non-critical */ }

  return out();
}

/**
 * Project pipeline-state.json from execution-plan.yaml (more precise than heuristic).
 */
function projectFromPlan(plan, offerPath, offerDir) {
  const now = new Date().toISOString();
  const pipelinePath = path.join(offerDir, 'pipeline-state.json');

  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(pipelinePath, 'utf8')); } catch { /* new file */ }

  const completed = [];
  const remaining = [];

  for (const task of plan.tasks) {
    if (task.status === 'completed' || task.status === 'skipped') {
      completed.push({
        id: `plan.task-${task.id}`,
        phase: plan.workflow || 'unknown',
        description: task.title || `Task ${task.id}`,
        result: task.status === 'skipped' ? 'SKIPPED' : 'SUCCESS',
        details: task.result || task.skipped_reason || 'From execution plan',
        completed_at: task.completed_at || now,
      });
    } else {
      remaining.push(`plan.task-${task.id}`);
    }
  }

  // Determine status
  let status = 'IN_PROGRESS';
  if (plan.status === 'completed') status = 'COMPLETED';
  if (plan.status === 'pending') status = 'IDLE';

  const currentTask = plan.current_task
    ? plan.tasks.find(t => t.id === plan.current_task)
    : null;

  const state = {
    offer_path: offerPath,
    status,
    current_phase: plan.workflow || 'unknown',
    current_step: currentTask ? `plan.task-${currentTask.id}` : null,
    current_task_title: currentTask?.title || null,
    current_task_agent: currentTask?.agent || null,
    started_at: existing.started_at || plan.created_at || now,
    updated_at: now,
    steps_completed: completed,
    steps_remaining: remaining,
    mode: existing.mode || 'plan-driven',
    plan_id: plan.plan_id,
    _source: 'execution-plan',
    _generated_by: 'pipeline-state-projector',
    _generated_at: now,
  };

  try {
    fs.writeFileSync(pipelinePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
  } catch { /* non-critical */ }
}

/**
 * Check if a step is completed based on helix state + filesystem.
 */
function isStepCompleted(step, helix, offerDir) {
  const gates = helix.gates || {};
  const phases = helix.helix_phases || {};

  // Research steps
  if (step.phase === 'research') {
    // If research gate passed, ALL research steps are done
    if (gates.research?.passed) return true;
    // Otherwise check individual deliverable files
    if (step.id === 'research.gate') return false;
    const filePath = RESEARCH_FILE_MAP[step.id];
    if (filePath) {
      return fs.existsSync(path.join(offerDir, filePath));
    }
    return false;
  }

  // Briefing steps
  if (step.phase === 'briefing') {
    // If briefing gate passed, ALL briefing steps are done
    if (gates.briefing?.passed) return true;
    if (step.id === 'briefing.gate') return false;
    // Check individual HELIX phase status
    const phaseNum = step.id.replace('briefing.fase_', '');
    const phaseKey = `phase_${parseInt(phaseNum, 10)}`;
    const phaseState = phases[phaseKey];
    return phaseState?.status === 'completed' || phaseState?.status === 'approved';
  }

  // Production steps — check for actual files (not empty scaffold dirs)
  if (step.phase === 'production') {
    if (gates.production?.passed) return true;
    if (step.id === 'production.final_validation') return false;
    const dirPath = PRODUCTION_FILE_MAP[step.id];
    if (dirPath) {
      return hasFiles(path.join(offerDir, dirPath));
    }
    return false;
  }

  return false;
}

/**
 * Recursively check if a directory contains at least one real file (not just empty subdirs).
 */
function hasFiles(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return false;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) return true;
      if (entry.isDirectory()) {
        if (hasFiles(path.join(dirPath, entry.name))) return true;
      }
    }
    return false;
  } catch { return false; }
}

function detectOfferPath(prompt) {
  const offerMatch = prompt.match(/(?:OFFER|offer|oferta)[:\s]+(?:~\/copywriting-ecosystem\/)?([a-z-]+\/[a-z-]+)/i);
  if (offerMatch) return offerMatch[1];
  const pathMatch = prompt.match(/\b(saude|relacionamento|concursos|financeiro|educacao|marketing-digital)\/([a-z][a-z0-9-]+)\b/);
  if (pathMatch) return `${pathMatch[1]}/${pathMatch[2]}`;
  return null;
}

function out() {
  process.stdout.write(JSON.stringify({}));
}

main().catch(() => { process.exit(0); });
