/**
 * Suggestion Engine - Context-aware next-action suggestions
 * Port of: aios-core/.aios-core/workflow-intelligence/engine/suggestion-engine.js
 *
 * Adapted for Copy Chief: uses HELIX workflow patterns instead of dev workflows.
 *
 * Two mechanisms:
 * A. Runtime-First: Deterministic signal-based (WorkflowStateManager)
 * B. WIS: Pattern matching against workflow-patterns.yaml with learned boosts
 *
 * @module aios/suggestion-engine
 * @version 1.1.0
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { WorkflowStateManager, type ExecutionSignals, type NextActionRecommendation } from '../workflow/workflow-state-manager';

let yaml: any;
try { yaml = require('yaml'); } catch { yaml = require('js-yaml'); }

// ============ Types ============

const SUGGESTION_CACHE_TTL = 5 * 60 * 1000;
const LOW_CONFIDENCE_THRESHOLD = 0.5;

export interface SuggestionContext {
  agentId?: string;
  lastCommand?: string;
  lastCommands?: string[];
  offerPath?: string;
  branch?: string;
  projectState?: Record<string, any>;
  executionSignals?: ExecutionSignals;
}

export interface Suggestion {
  command: string;
  args: string;
  description: string;
  confidence: number;
  priority: number;
  source: 'workflow' | 'runtime_first' | 'learned_pattern' | 'fallback';
  agent?: string;
  executionState?: string;
  learnedBoost?: number;
}

export interface SuggestionResult {
  workflow: string | null;
  currentState: string | null;
  confidence: number;
  suggestions: Suggestion[];
  isUncertain: boolean;
  message: string | null;
  runtimeState?: string;
}

interface WorkflowPattern {
  description: string;
  agent_sequence: string[];
  key_commands: string[];
  trigger_threshold: number;
  transitions: Record<string, {
    trigger: string;
    confidence: number;
    greeting_message?: string;
    next_steps: Array<{
      command: string;
      args_template?: string;
      description: string;
      priority: number;
    }>;
  }>;
}

// ============ Class ============

export class SuggestionEngine {
  cacheTTL: number;
  useLearnedPatterns: boolean;
  learnedPatternBoost: number;
  private _suggestionCache: SuggestionResult | null;
  private _cacheTimestamp: number | null;
  private _cacheKey: string | null;
  private _patterns: Record<string, WorkflowPattern> | null;
  private _wsm: WorkflowStateManager;

  constructor(options: { cacheTTL?: number; useLearnedPatterns?: boolean; learnedPatternBoost?: number } = {}) {
    this.cacheTTL = options.cacheTTL || SUGGESTION_CACHE_TTL;
    this.useLearnedPatterns = options.useLearnedPatterns !== false;
    this.learnedPatternBoost = options.learnedPatternBoost || 0.15;
    this._suggestionCache = null;
    this._cacheTimestamp = null;
    this._cacheKey = null;
    this._patterns = null;
    this._wsm = new WorkflowStateManager();
  }

  private _loadPatterns(): Record<string, WorkflowPattern> {
    if (this._patterns) return this._patterns;
    const patternsPath = join(process.env.HOME || '', '.claude', 'data', 'workflow-patterns.yaml');
    try {
      if (existsSync(patternsPath)) {
        const content = readFileSync(patternsPath, 'utf-8');
        const data = (yaml.parse || yaml.load)(content);
        this._patterns = data?.workflows || {};
        return this._patterns!;
      }
    } catch (error: any) {
      console.warn(`[SuggestionEngine] Failed to load patterns: ${error.message}`);
    }
    this._patterns = {};
    return this._patterns;
  }

  buildContext(options: { agentId?: string; offerPath?: string; autoDetect?: boolean } = {}): SuggestionContext {
    const context: SuggestionContext = {
      agentId: options.agentId || this._detectCurrentAgent(),
      lastCommand: undefined,
      lastCommands: [],
      offerPath: options.offerPath || undefined,
      branch: this._detectGitBranch(),
      projectState: {},
    };

    if (options.offerPath) context.offerPath = options.offerPath;
    context.projectState = this._buildProjectState(context);
    return context;
  }

  suggestNext(context: SuggestionContext): SuggestionResult {
    const runtimeNext = this._getRuntimeNextRecommendation(context);

    // Check cache
    const cacheKey = this._generateCacheKey(context);
    if (this._isCacheValid(cacheKey)) {
      return this._withRuntimeRecommendation(this._suggestionCache!, runtimeNext);
    }

    const defaultResult: SuggestionResult = {
      workflow: null, currentState: null, confidence: 0,
      suggestions: [], isUncertain: true, message: 'Unable to determine workflow context',
    };

    try {
      const patterns = this._loadPatterns();
      const commands = context.lastCommands || (context.lastCommand ? [context.lastCommand] : []);
      const match = this._matchWorkflow(commands, patterns);

      if (!match) {
        return this._withRuntimeRecommendation({ ...defaultResult, message: 'No matching workflow found' }, runtimeNext);
      }

      // Get suggestions from matched workflow transitions
      const suggestions = this._getSuggestionsFromMatch(match, context);

      let formattedSuggestions: Suggestion[] = suggestions.map((s, index) => ({
        command: s.command.startsWith('/') ? s.command : `/${s.command}`,
        args: this._interpolateArgs(s.args_template || '', context),
        description: s.description || '',
        confidence: Math.round((s.confidence || 0) * 100) / 100,
        priority: s.priority || index + 1,
        source: 'workflow' as const,
      }));

      // Apply learned pattern boost
      if (this.useLearnedPatterns) {
        formattedSuggestions = this._applyLearnedPatternBoost(formattedSuggestions, context);
      }

      formattedSuggestions.sort((a, b) => b.confidence - a.confidence);

      const avgConfidence = formattedSuggestions.length > 0
        ? formattedSuggestions.reduce((sum, s) => sum + s.confidence, 0) / formattedSuggestions.length
        : 0;

      let result: SuggestionResult = {
        workflow: match.name,
        currentState: match.state || null,
        confidence: Math.round(avgConfidence * 100) / 100,
        suggestions: formattedSuggestions,
        isUncertain: avgConfidence < LOW_CONFIDENCE_THRESHOLD,
        message: null,
      };

      result = this._withRuntimeRecommendation(result, runtimeNext);
      this._cacheResult(cacheKey, result);
      return result;
    } catch (error: any) {
      return { ...defaultResult, message: `Error: ${error.message}` };
    }
  }

  getFallbackSuggestions(context: SuggestionContext): SuggestionResult {
    const agent = context.agentId || 'chief';
    const fallbacks: Record<string, Suggestion[]> = {
      chief: [
        { command: '/status', args: '', description: 'Show system status', confidence: 0.3, priority: 1, source: 'fallback' },
        { command: '/next-action', args: '', description: 'Get next recommended action', confidence: 0.25, priority: 2, source: 'fallback' },
      ],
      researcher: [
        { command: '/audience-research-agent', args: '', description: 'Start audience research', confidence: 0.3, priority: 1, source: 'fallback' },
        { command: '/voc-research-agent', args: '', description: 'Extract VOC data', confidence: 0.25, priority: 2, source: 'fallback' },
      ],
      briefer: [
        { command: '/helix-system-agent', args: '', description: 'Run HELIX briefing', confidence: 0.3, priority: 1, source: 'fallback' },
      ],
      producer: [
        { command: '/production-agent', args: '', description: 'Start production', confidence: 0.3, priority: 1, source: 'fallback' },
      ],
      default: [
        { command: '/status', args: '', description: 'Show status', confidence: 0.3, priority: 1, source: 'fallback' },
        { command: '/help', args: '', description: 'Show available commands', confidence: 0.2, priority: 2, source: 'fallback' },
      ],
    };

    return {
      workflow: null, currentState: null, confidence: 0.25,
      suggestions: fallbacks[agent] || fallbacks.default,
      isUncertain: true, message: 'Using fallback suggestions',
    };
  }

  invalidateCache(): void {
    this._suggestionCache = null;
    this._cacheTimestamp = null;
    this._cacheKey = null;
  }

  // ============ Private ============

  private _getRuntimeNextRecommendation(context: SuggestionContext): NextActionRecommendation | null {
    try {
      const signals = this._buildRuntimeSignals(context);
      const recommendation = this._wsm.getNextActionRecommendation(signals, { offer: context.offerPath || '' });
      if (!recommendation || recommendation.state === 'unknown') return null;
      return recommendation;
    } catch { return null; }
  }

  private _buildRuntimeSignals(context: SuggestionContext): ExecutionSignals {
    const ps = context.projectState || {};
    return {
      story_status: ps.story_status || ps.offer_phase || (ps.activeOffer ? 'in_progress' : 'unknown'),
      qa_status: ps.qa_status || ps.gate_status || 'unknown',
      ci_status: ps.ci_status || 'unknown',
      has_uncommitted_changes: Boolean(ps.hasUncommittedChanges),
      offer_phase: ps.offer_phase,
      gate_status: ps.gate_status,
      mecanismo_state: ps.mecanismo_state,
      ...(context.executionSignals || {}),
    };
  }

  private _withRuntimeRecommendation(result: SuggestionResult, runtimeNext: NextActionRecommendation | null): SuggestionResult {
    if (!result || !runtimeNext) return result;

    const runtimeSuggestion: Suggestion = {
      command: runtimeNext.command,
      args: '',
      description: runtimeNext.rationale,
      confidence: runtimeNext.confidence,
      priority: 0,
      source: 'runtime_first',
      agent: runtimeNext.agent,
      executionState: runtimeNext.state,
    };

    const existing = Array.isArray(result.suggestions) ? result.suggestions : [];
    const normalizedCmd = String(runtimeSuggestion.command || '').trim().toLowerCase();
    const deduped = existing.filter(s => String((s.command || '') + (s.args ? ` ${s.args}` : '')).trim().toLowerCase() !== normalizedCmd);

    return {
      ...result,
      suggestions: [runtimeSuggestion, ...deduped],
      confidence: Math.max(result.confidence || 0, runtimeNext.confidence || 0),
      isUncertain: false,
      runtimeState: runtimeNext.state,
    };
  }

  private _matchWorkflow(commands: string[], patterns: Record<string, WorkflowPattern>): { name: string; pattern: WorkflowPattern; state?: string } | null {
    if (commands.length === 0) return null;

    let bestMatch: { name: string; pattern: WorkflowPattern; state?: string; score: number } | null = null;

    for (const [name, pattern] of Object.entries(patterns)) {
      const keyCommands = pattern.key_commands || [];
      const threshold = pattern.trigger_threshold || 2;
      const matchCount = commands.filter(cmd => keyCommands.some(kc => cmd.toLowerCase().includes(kc.toLowerCase()))).length;

      if (matchCount >= threshold && (!bestMatch || matchCount > bestMatch.score)) {
        // Determine current state from transitions
        let currentState: string | undefined;
        const lastCmd = commands[commands.length - 1]?.toLowerCase() || '';
        for (const [state, transition] of Object.entries(pattern.transitions || {})) {
          if (lastCmd.includes(transition.trigger?.split(' ')[0]?.toLowerCase() || '')) {
            currentState = state;
            break;
          }
        }
        bestMatch = { name, pattern, state: currentState, score: matchCount };
      }
    }

    return bestMatch ? { name: bestMatch.name, pattern: bestMatch.pattern, state: bestMatch.state } : null;
  }

  private _getSuggestionsFromMatch(match: { name: string; pattern: WorkflowPattern; state?: string }, _context: SuggestionContext): Array<{ command: string; args_template?: string; description: string; confidence: number; priority: number }> {
    const suggestions: Array<{ command: string; args_template?: string; description: string; confidence: number; priority: number }> = [];

    if (match.state && match.pattern.transitions[match.state]) {
      const transition = match.pattern.transitions[match.state];
      for (const step of transition.next_steps) {
        suggestions.push({
          command: step.command,
          args_template: step.args_template,
          description: step.description,
          confidence: transition.confidence,
          priority: step.priority,
        });
      }
    } else {
      // No state match — return first transition's steps at lower confidence
      const firstTransition = Object.values(match.pattern.transitions || {})[0];
      if (firstTransition) {
        for (const step of firstTransition.next_steps) {
          suggestions.push({
            command: step.command,
            args_template: step.args_template,
            description: step.description,
            confidence: firstTransition.confidence * 0.7,
            priority: step.priority,
          });
        }
      }
    }

    return suggestions;
  }

  private _applyLearnedPatternBoost(suggestions: Suggestion[], context: SuggestionContext): Suggestion[] {
    // Read learned patterns from WIE data if available
    const wiePath = join(process.env.HOME || '', '.claude', 'learned-patterns', 'wie-data.json');
    if (!existsSync(wiePath)) return suggestions;

    try {
      const wieData = JSON.parse(readFileSync(wiePath, 'utf-8'));
      const recentTools = (wieData.tool_usage || []).slice(-20).map((t: any) => t.tool?.toLowerCase());

      return suggestions.map(suggestion => {
        const cmdNormalized = suggestion.command.replace(/^\//, '').toLowerCase();
        const matchCount = recentTools.filter((t: string) => t?.includes(cmdNormalized)).length;
        if (matchCount > 0) {
          const boost = Math.min(matchCount * 0.03, this.learnedPatternBoost);
          return { ...suggestion, confidence: Math.min(1.0, suggestion.confidence + boost), source: 'learned_pattern' as const, learnedBoost: Math.round(boost * 100) / 100 };
        }
        return suggestion;
      });
    } catch { return suggestions; }
  }

  private _interpolateArgs(argsTemplate: string, context: SuggestionContext): string {
    if (!argsTemplate) return '';
    return argsTemplate
      .replace(/\$\{offer_path\}/g, context.offerPath || '')
      .replace(/\$\{branch\}/g, context.branch || '')
      .trim();
  }

  private _detectCurrentAgent(): string {
    return process.env.AIOS_CURRENT_AGENT?.replace('@', '') || 'chief';
  }

  private _detectGitBranch(): string | undefined {
    try {
      const gitHeadPath = join(process.cwd(), '.git', 'HEAD');
      if (existsSync(gitHeadPath)) {
        const content = readFileSync(gitHeadPath, 'utf8').trim();
        if (content.startsWith('ref: refs/heads/')) return content.replace('ref: refs/heads/', '');
      }
    } catch { /* not a git repo */ }
    return undefined;
  }

  private _buildProjectState(context: SuggestionContext): Record<string, any> {
    return {
      activeOffer: !!context.offerPath,
      hasUncommittedChanges: false,
      workflowPhase: null,
    };
  }

  private _generateCacheKey(context: SuggestionContext): string {
    return [context.agentId || '', context.lastCommand || '', (context.lastCommands || []).slice(-3).join(','), context.offerPath || '', context.branch || ''].join('|');
  }

  private _isCacheValid(key: string): boolean {
    return !!(this._suggestionCache && this._cacheTimestamp && this._cacheKey === key && Date.now() - this._cacheTimestamp < this.cacheTTL);
  }

  private _cacheResult(key: string, result: SuggestionResult): void {
    this._suggestionCache = result;
    this._cacheTimestamp = Date.now();
    this._cacheKey = key;
  }
}

export { SUGGESTION_CACHE_TTL, LOW_CONFIDENCE_THRESHOLD };
