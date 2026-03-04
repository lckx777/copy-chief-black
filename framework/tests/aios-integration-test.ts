#!/usr/bin/env bun
/**
 * AIOS Planning Integration Test
 * Verifies all ported modules compile and work correctly.
 *
 * Run: bun run ~/.claude/tests/aios-integration-test.ts
 */

import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

// Import all modules
import {
  WorkflowStateManager,
  SuggestionEngine,
  AiosSessionState,
  ContextManager,
  TaskManager,
  ProgressTracker,
  ParallelExecutor,
  GateEvaluator,
  GateVerdict,
  ActionType,
  HelixPhase,
  ResumeOption,
} from '../hooks/lib/aios/index';

const TEST_DIR = join(process.env.HOME || '', '.claude', 'tests', '_aios_test_tmp');
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${message}`);
    failed++;
  }
}

function setup(): void {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
}

function cleanup(): void {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
}

// ============ Test 1: WorkflowStateManager ============
function testWorkflowStateManager(): void {
  console.log('\n--- Test 1: WorkflowStateManager ---');

  const wsm = new WorkflowStateManager({ basePath: TEST_DIR, verbose: false });

  // Create state from workflow definition
  const workflowDef = {
    workflow: {
      id: 'helix-test',
      name: 'HELIX Test Pipeline',
      sequence: [
        { phase: 1, agent: 'researcher', action: 'collect-voc', creates: 'research/voc.md' },
        { phase: 2, agent: 'briefer', action: 'run-helix', creates: 'briefings/helix.md' },
        { phase: 3, agent: 'producer', action: 'produce-vsl', creates: 'production/vsl.md', condition: 'briefing_complete' },
      ],
    },
  };

  const state = wsm.createState(workflowDef);
  assert(state.workflow_id === 'helix-test', 'Workflow ID set correctly');
  assert(state.steps.length === 3, '3 steps created');
  assert(state.steps[0].agent === 'researcher', 'Step 0 agent is researcher');
  assert(state.steps[2].optional === true, 'Conditional step marked optional');
  assert(state.artifacts.length === 3, '3 artifacts registered');

  // Test progress
  const progress = wsm.getProgress(state);
  assert(progress.total === 3, 'Total is 3');
  assert(progress.completed === 0, 'None completed');
  assert(progress.percentage === 0, '0% progress');

  // Mark step completed and advance
  wsm.markStepCompleted(state, 0, ['research/voc.md']);
  assert(state.steps[0].status === 'completed', 'Step 0 marked completed');
  assert(state.artifacts[0].status === 'created', 'Artifact 0 marked created');

  wsm.advanceStep(state);
  assert(state.current_step_index === 1, 'Advanced to step 1');

  // Skip optional step
  wsm.markStepSkipped(state, 2);
  assert(state.steps[2].status === 'skipped', 'Optional step skipped');

  const progress2 = wsm.getProgress(state);
  assert(progress2.completed === 2, '2 completed (1 done + 1 skipped)');

  // Save and reload
  wsm.saveState(state);
  const loaded = wsm.loadState(state.instance_id);
  assert(loaded !== null, 'State loaded from disk');
  assert(loaded!.workflow_id === 'helix-test', 'Loaded state matches');

  // Test next-action recommendation
  const recommendation = wsm.getNextActionRecommendation({ story_status: 'in_progress', has_uncommitted_changes: true });
  assert(recommendation.state === 'in_development', 'Evaluates to in_development');
  assert(recommendation.confidence >= 0.8, 'High confidence');

  const blocked = wsm.getNextActionRecommendation({ story_status: 'blocked' });
  assert(blocked.state === 'blocked', 'Blocked state detected');
  assert(blocked.confidence === 0.95, 'Highest confidence for blocked');

  // Test handoff context
  const handoff = wsm.generateHandoffContext(state);
  assert(handoff.includes('Workflow Handoff Context'), 'Handoff context generated');
  assert(handoff.includes('helix-test'), 'Contains workflow name');

  // Test status report
  const report = wsm.generateStatusReport(state);
  assert(report.includes('[x]'), 'Report has completed step');
  assert(report.includes('[-]'), 'Report has skipped step');

  // Test list active
  const active = wsm.listActiveWorkflows();
  assert(active.length >= 1, 'Active workflows listed');
}

// ============ Test 2: SuggestionEngine ============
function testSuggestionEngine(): void {
  console.log('\n--- Test 2: SuggestionEngine ---');

  const engine = new SuggestionEngine();

  // Build context
  const context = engine.buildContext({ agentId: 'chief', offerPath: 'saude/florayla' });
  assert(context.agentId === 'chief', 'Agent ID set');
  assert(context.offerPath === 'saude/florayla', 'Offer path set');

  // Get suggestions (may return fallback if no patterns match)
  const result = engine.suggestNext(context);
  assert(result !== null, 'Suggestion result returned');
  assert(Array.isArray(result.suggestions), 'Suggestions is array');
  assert(typeof result.confidence === 'number', 'Confidence is number');
  assert(typeof result.isUncertain === 'boolean', 'isUncertain is boolean');

  // Get fallback suggestions
  const fallback = engine.getFallbackSuggestions({ agentId: 'researcher' });
  assert(fallback.suggestions.length > 0, 'Fallback has suggestions');
  assert(fallback.isUncertain === true, 'Fallback is uncertain');

  // Cache test
  engine.suggestNext(context); // Should cache
  engine.invalidateCache();
  assert(true, 'Cache invalidated without error');
}

// ============ Test 3: AiosSessionState ============
function testSessionState(): void {
  console.log('\n--- Test 3: AiosSessionState ---');

  const ss = new AiosSessionState(TEST_DIR, { debug: false });

  // Create session
  const state = ss.createSessionState({
    id: 'florayla',
    title: 'Florayla - Saude Intestinal',
    totalDeliverables: 4,
    deliverableIds: ['VSL', 'LP', 'Creatives', 'Emails'],
  }, 'main');

  assert(state.session_state.offer.id === 'florayla', 'Offer ID set');
  assert(state.session_state.progress.deliverables_pending.length === 4, '4 pending deliverables');
  assert(state.session_state.last_action.type === ActionType.OFFER_STARTED, 'OFFER_STARTED action');

  // Record phase change
  ss.recordPhaseChange('production', 'VSL', '@echo');
  assert(ss.state!.session_state.workflow.current_phase === 'production', 'Phase updated');
  assert(ss.state!.session_state.context_snapshot.last_persona === '@echo', 'Persona recorded');
  assert(ss.state!.session_state.context_snapshot.persona_distribution['@echo'] === 1, 'Distribution tracked');

  // Record deliverable completion
  ss.recordDeliverableCompleted('VSL', 'LP');
  assert(ss.state!.session_state.progress.deliverables_done.length === 1, '1 done');
  assert(ss.state!.session_state.progress.deliverables_done[0] === 'VSL', 'VSL done');
  assert(ss.state!.session_state.progress.current_deliverable === 'LP', 'Current is LP');

  // Crash detection (should not detect crash since we just updated)
  const crash = ss.detectCrash();
  assert(crash.isCrash === false, 'No crash detected (recent update)');

  // Load from disk
  const ss2 = new AiosSessionState(TEST_DIR);
  const loaded = ss2.loadSessionState();
  assert(loaded !== null, 'State loaded from disk');
  assert(loaded!.session_state.offer.id === 'florayla', 'Loaded offer matches');

  // Resume summary
  const summary = ss2.getResumeSummary();
  assert(summary.includes('Florayla'), 'Summary contains offer name');

  // Resume options
  const options = ss2.getResumeOptions();
  assert(Object.keys(options).length === 4, '4 resume options');

  // Handle resume: continue
  const resumeResult = ss2.handleResumeOption(ResumeOption.CONTINUE);
  assert(resumeResult.action === 'continue', 'Continue action');
  assert(resumeResult.deliverable === 'LP', 'Continue from LP');

  // Pause and discard
  ss2.recordPause('LP', 'production');
  assert(ss2.state!.session_state.last_action.type === ActionType.PAUSE, 'Pause recorded');

  // Validate schema
  const validation = AiosSessionState.validateSchema(ss2.state!);
  assert(validation.isValid, 'Schema is valid');
}

// ============ Test 4: ContextManager ============
function testContextManager(): void {
  console.log('\n--- Test 4: ContextManager ---');

  const cm = new ContextManager('florayla-production', TEST_DIR);
  const initialState = cm.initialize();
  assert(initialState.status === 'initialized', 'Initialized');
  assert(initialState.workflowId === 'florayla-production', 'Workflow ID set');

  // Save phase output
  cm.savePhaseOutput(1, {
    agent: 'researcher',
    action: 'collect-voc',
    result: { voc_data: true, acceptance_criteria: [{ done: true }, { done: true }, { done: false }] },
    validation: { checks: [{ type: 'file_exists', passed: true }, { type: 'min_size', passed: true }] },
  }, { handoffTarget: { phase: 2, agent: 'briefer' } });

  assert(cm.isPhaseCompleted(1), 'Phase 1 completed');
  assert(!cm.isPhaseCompleted(2), 'Phase 2 not completed');
  assert(cm.getLastCompletedPhase() === 1, 'Last completed is 1');

  // Get context for next phase
  const ctx = cm.getContextForPhase(2);
  assert(ctx.currentPhase === 2, 'Context for phase 2');
  assert(ctx.previousPhases[1] !== undefined, 'Has phase 1 output');
  assert(ctx.previousHandoffs['1'] !== undefined, 'Has phase 1 handoff');

  // Delivery confidence
  const confidence = cm.getDeliveryConfidence();
  assert(confidence !== null, 'Confidence calculated');
  assert(typeof confidence!.score === 'number', 'Score is number');
  assert(confidence!.score >= 0 && confidence!.score <= 100, 'Score in range');

  // Summary
  const summary = cm.getSummary();
  assert(summary.status === 'in_progress', 'Status is in_progress');
  assert(summary.completedPhases.includes(1), 'Phase 1 in completed list');

  // Mark completed
  cm.markCompleted();
  assert(cm.getSummary().status === 'completed', 'Workflow marked completed');
}

// ============ Test 5: TaskManager with DAG ============
function testTaskManager(): void {
  console.log('\n--- Test 5: TaskManager with DAG ---');

  const statePath = join(TEST_DIR, 'task-state.json');
  const tm = new TaskManager({ maxConcurrent: 2, maxRetries: 2, statePath, total: 3 });

  const completionOrder: string[] = [];

  // Add tasks with dependencies
  // Task B depends on Task A. Task C is independent.
  tm.addTask({
    id: 'task-a',
    type: 'research',
    execute: async () => {
      await new Promise(r => setTimeout(r, 50));
      completionOrder.push('A');
      return { result: 'voc collected' };
    },
  });

  tm.addTask({
    id: 'task-b',
    type: 'briefing',
    dependencies: ['task-a'],
    execute: async () => {
      await new Promise(r => setTimeout(r, 50));
      completionOrder.push('B');
      return { result: 'helix done' };
    },
  });

  tm.addTask({
    id: 'task-c',
    type: 'research',
    execute: async () => {
      await new Promise(r => setTimeout(r, 30));
      completionOrder.push('C');
      return { result: 'competitors analyzed' };
    },
  });

  // Wait for all tasks to complete
  return new Promise<void>(resolve => {
    const checkInterval = setInterval(() => {
      const stats = tm.getStats();
      if (stats.totals.pending === 0 && stats.totals.running === 0) {
        clearInterval(checkInterval);

        assert(stats.totals.completed === 3, '3 tasks completed');
        assert(stats.totals.failed === 0, '0 tasks failed');
        assert(completionOrder.indexOf('A') < completionOrder.indexOf('B'), 'A before B (dependency)');

        // Progress tracker
        const progress = tm.progress.getProgress();
        assert(progress.completed >= 2, 'Progress tracked completions');

        // State persistence
        assert(existsSync(statePath), 'State file created');

        tm.shutdown();
        resolve();
      }
    }, 100);
  });
}

// ============ Test 6: ParallelExecutor ============
async function testParallelExecutor(): Promise<void> {
  console.log('\n--- Test 6: ParallelExecutor ---');

  const pe = new ParallelExecutor(2);

  const phases = [
    { phase: 1, name: 'VOC' },
    { phase: 2, name: 'Competitors' },
    { phase: 3, name: 'Avatar' },
  ];

  const result = await pe.executeParallel(phases, async (phase) => {
    await new Promise(r => setTimeout(r, 30));
    return { done: true, name: phase.name };
  }, { maxConcurrency: 2 });

  assert(result.summary.total === 3, '3 phases total');
  assert(result.summary.success >= 2, 'Most phases succeeded');
  assert(result.errors.length === 0, 'No errors');

  const summary = pe.getSummary();
  assert(summary.completed >= 2, 'Completed tracked');
  assert(summary.averageDuration > 0, 'Duration tracked');
}

// ============ Test 7: GateEvaluator ============
function testGateEvaluator(): void {
  console.log('\n--- Test 7: GateEvaluator ---');

  const ge = new GateEvaluator({ projectRoot: TEST_DIR });

  // Test research → briefing gate (should pass)
  const result1 = ge.evaluate('research', 'briefing', {
    voc_data: true,
    competitor_data: true,
    synthesis_path: 'research/synthesis.md',
    tools_used: ['voc_search', 'get_meta_ads'],
  });
  assert(result1.verdict === GateVerdict.APPROVED, 'Research gate approved');
  assert(result1.issues.length === 0, 'No issues');

  // Test briefing → production gate (should fail - no mecanismo)
  const result2 = ge.evaluate('briefing', 'production', {
    helix_complete: true,
    phases_completed: 10,
    mecanismo_state: 'DRAFT', // Not validated!
    mup_statement: 'Test MUP',
    mus_statement: 'Test MUS',
  });
  assert(result2.verdict === GateVerdict.BLOCKED, 'Briefing gate blocked (mecanismo not validated)');
  assert(result2.issues.some(i => i.check === 'mecanismo_validated'), 'Mecanismo issue flagged');

  // Test production → review gate (should pass)
  const result3 = ge.evaluate('production', 'review', {
    blind_critic_score: 9,
    emotional_stress_score: 8,
    errors: [],
  });
  assert(result3.verdict === GateVerdict.APPROVED, 'Production gate approved');

  // Summary
  const summary = ge.getSummary();
  assert(summary.total === 3, '3 gates evaluated');
  assert(summary.approved === 2, '2 approved');
  assert(summary.blocked === 1, '1 blocked');

  // Strict mode
  const geStrict = new GateEvaluator({ projectRoot: TEST_DIR, strictMode: true });
  const result4 = geStrict.evaluate('production', 'review', {
    blind_critic_score: 7, // Below 8
    emotional_stress_score: 9,
  });
  assert(result4.verdict === GateVerdict.BLOCKED, 'Strict mode blocks on any issue');
}

// ============ Main ============

async function main(): Promise<void> {
  console.log('=== AIOS Planning Integration Test ===\n');
  console.log(`Test directory: ${TEST_DIR}`);

  setup();

  try {
    testWorkflowStateManager();
    testSuggestionEngine();
    testSessionState();
    testContextManager();
    await testTaskManager();
    await testParallelExecutor();
    testGateEvaluator();
  } catch (error: any) {
    console.log(`\n[ERROR] Unexpected error: ${error.message}`);
    console.log(error.stack);
    failed++;
  }

  cleanup();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
}

main();
