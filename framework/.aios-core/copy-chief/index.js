'use strict';

/**
 * Copy Chief OS — Module Index
 *
 * Orchestration layer that transforms Copy Chief from
 * prompt-based routing to deterministic JS-controlled OS.
 *
 * @module copy-chief
 * @version 1.0.0
 */

// Orchestration
const { HelixOrchestrator, OfferPhase, AGENT_MAP, WORKFLOW_MAP, ROUTING_TABLE } = require('./orchestration/helix-orchestrator');
const { OfferScanner, KNOWN_NICHES } = require('./orchestration/offer-scanner');
const { DELIVERABLE_ASSIGNMENT_TABLE, getDeliverableType, assignPersonaFromPath, validateAssignment } = require('./orchestration/deliverable-assignment');

// Execution
const { CopyWorkflowExecutor, ExecutionState } = require('./execution/copy-workflow-executor');
const { CopyPromptBuilder, AGENT_MODELS } = require('./execution/copy-prompt-builder');
const { analyzeWaves, getCriticalPath, getOptimizationGain, detectCycles } = require('./execution/wave-analyzer');

// Workflow Intelligence
const { getSuggestions, getTopSuggestion, invalidateCache } = require('./workflow/suggestion-engine');
const { calculateConfidence, scoreGateStatus, scoreFileCompleteness } = require('./workflow/confidence-scorer');
const { capturePattern, getPatterns, getFrequentSequences, prunePatterns } = require('./workflow/pattern-capture');

// Activation
const { AgentActivationPipeline } = require('./activation/agent-activation-pipeline');
const { KnowledgeLoader } = require('./activation/knowledge-loader');

// IDS (Intrusion Detection / Circuit Breakers)
const { MCPCircuitBreakerRegistry, PROTECTED_TOOLS } = require('./ids/mcp-circuit-breaker');

// Handoff
const { HandoffProtocol, HandoffStatus, AGENT_HANDOFF_MAP } = require('./handoff/handoff-protocol');

// Lifecycle
const { CopyDataLifecycle } = require('./lifecycle/copy-data-lifecycle');

// Observability
const { CopyStatusWriter, COPY_PIPELINE_STAGES } = require('./observability/copy-status-writer');

// Dispatch (Gap 1, 2, 3)
const { DispatchQueueManager, DispatchStatus } = require('./dispatch/dispatch-queue-manager');

// Memory (Gap 4 + PreCompact)
const { AgentMemoryManager, MEMORY_CAPS, VALID_MEMORY_TYPES } = require('./memory/agent-memory-manager');
const { IndexUpdater } = require('./memory/index-updater');
const { SessionDigestExtractor } = require('./memory/session-digest-extractor');
const { compactAgent, compactAll } = require('./memory/memory-compactor');

// Learning (enhanced)
const { registerGotcha, queryRelevant, formatForAgent, pruneGotchas, getStats: getGotchaStats } = require('./learning/gotcha-registry');

// Plan (LLM-as-CPU)
const { ExecutionPlanGenerator, TASK_VERIFICATION_MAP } = require('./plan/execution-plan-generator');
const { PlanStateMachine } = require('./plan/plan-state-machine');
const { PlanVerification } = require('./plan/plan-verification');

module.exports = {
  // Orchestration
  HelixOrchestrator,
  OfferPhase,
  OfferScanner,
  AGENT_MAP,
  WORKFLOW_MAP,
  ROUTING_TABLE,
  KNOWN_NICHES,
  DELIVERABLE_ASSIGNMENT_TABLE,
  getDeliverableType,
  assignPersonaFromPath,
  validateAssignment,

  // Execution
  CopyWorkflowExecutor,
  CopyPromptBuilder,
  ExecutionState,
  AGENT_MODELS,
  analyzeWaves,
  getCriticalPath,
  getOptimizationGain,
  detectCycles,

  // Workflow Intelligence
  getSuggestions,
  getTopSuggestion,
  invalidateCache,
  calculateConfidence,
  scoreGateStatus,
  scoreFileCompleteness,
  capturePattern,
  getPatterns,
  getFrequentSequences,
  prunePatterns,

  // Activation
  AgentActivationPipeline,
  KnowledgeLoader,

  // IDS
  MCPCircuitBreakerRegistry,
  PROTECTED_TOOLS,

  // Handoff
  HandoffProtocol,
  HandoffStatus,
  AGENT_HANDOFF_MAP,

  // Lifecycle
  CopyDataLifecycle,

  // Observability
  CopyStatusWriter,
  COPY_PIPELINE_STAGES,

  // Dispatch (Gap 1, 2, 3)
  DispatchQueueManager,
  DispatchStatus,

  // Memory (Gap 4 + PreCompact)
  AgentMemoryManager,
  MEMORY_CAPS,
  VALID_MEMORY_TYPES,
  IndexUpdater,
  SessionDigestExtractor,
  compactAgent,
  compactAll,

  // Learning (enhanced)
  registerGotcha,
  queryRelevant,
  formatForAgent,
  pruneGotchas,
  getGotchaStats,

  // Plan (LLM-as-CPU)
  ExecutionPlanGenerator,
  TASK_VERIFICATION_MAP,
  PlanStateMachine,
  PlanVerification,
};
