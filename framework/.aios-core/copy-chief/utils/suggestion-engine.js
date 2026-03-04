var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var suggestion_engine_exports = {};
__export(suggestion_engine_exports, {
  LOW_CONFIDENCE_THRESHOLD: () => LOW_CONFIDENCE_THRESHOLD,
  SUGGESTION_CACHE_TTL: () => SUGGESTION_CACHE_TTL,
  SuggestionEngine: () => SuggestionEngine
});
module.exports = __toCommonJS(suggestion_engine_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_workflow_state_manager = require("../workflow/workflow-state-manager");
let yaml;
try {
  yaml = require("yaml");
} catch {
  yaml = require("js-yaml");
}
const SUGGESTION_CACHE_TTL = 5 * 60 * 1e3;
const LOW_CONFIDENCE_THRESHOLD = 0.5;
class SuggestionEngine {
  cacheTTL;
  useLearnedPatterns;
  learnedPatternBoost;
  _suggestionCache;
  _cacheTimestamp;
  _cacheKey;
  _patterns;
  _wsm;
  constructor(options = {}) {
    this.cacheTTL = options.cacheTTL || SUGGESTION_CACHE_TTL;
    this.useLearnedPatterns = options.useLearnedPatterns !== false;
    this.learnedPatternBoost = options.learnedPatternBoost || 0.15;
    this._suggestionCache = null;
    this._cacheTimestamp = null;
    this._cacheKey = null;
    this._patterns = null;
    this._wsm = new import_workflow_state_manager.WorkflowStateManager();
  }
  _loadPatterns() {
    if (this._patterns) return this._patterns;
    const patternsPath = (0, import_path.join)(process.env.HOME || "", ".claude", "data", "workflow-patterns.yaml");
    try {
      if ((0, import_fs.existsSync)(patternsPath)) {
        const content = (0, import_fs.readFileSync)(patternsPath, "utf-8");
        const data = (yaml.parse || yaml.load)(content);
        this._patterns = data?.workflows || {};
        return this._patterns;
      }
    } catch (error) {
      console.warn(`[SuggestionEngine] Failed to load patterns: ${error.message}`);
    }
    this._patterns = {};
    return this._patterns;
  }
  buildContext(options = {}) {
    const context = {
      agentId: options.agentId || this._detectCurrentAgent(),
      lastCommand: void 0,
      lastCommands: [],
      offerPath: options.offerPath || void 0,
      branch: this._detectGitBranch(),
      projectState: {}
    };
    if (options.offerPath) context.offerPath = options.offerPath;
    context.projectState = this._buildProjectState(context);
    return context;
  }
  suggestNext(context) {
    const runtimeNext = this._getRuntimeNextRecommendation(context);
    const cacheKey = this._generateCacheKey(context);
    if (this._isCacheValid(cacheKey)) {
      return this._withRuntimeRecommendation(this._suggestionCache, runtimeNext);
    }
    const defaultResult = {
      workflow: null,
      currentState: null,
      confidence: 0,
      suggestions: [],
      isUncertain: true,
      message: "Unable to determine workflow context"
    };
    try {
      const patterns = this._loadPatterns();
      const commands = context.lastCommands || (context.lastCommand ? [context.lastCommand] : []);
      const match = this._matchWorkflow(commands, patterns);
      if (!match) {
        return this._withRuntimeRecommendation({ ...defaultResult, message: "No matching workflow found" }, runtimeNext);
      }
      const suggestions = this._getSuggestionsFromMatch(match, context);
      let formattedSuggestions = suggestions.map((s, index) => ({
        command: s.command.startsWith("/") ? s.command : `/${s.command}`,
        args: this._interpolateArgs(s.args_template || "", context),
        description: s.description || "",
        confidence: Math.round((s.confidence || 0) * 100) / 100,
        priority: s.priority || index + 1,
        source: "workflow"
      }));
      if (this.useLearnedPatterns) {
        formattedSuggestions = this._applyLearnedPatternBoost(formattedSuggestions, context);
      }
      formattedSuggestions.sort((a, b) => b.confidence - a.confidence);
      const avgConfidence = formattedSuggestions.length > 0 ? formattedSuggestions.reduce((sum, s) => sum + s.confidence, 0) / formattedSuggestions.length : 0;
      let result = {
        workflow: match.name,
        currentState: match.state || null,
        confidence: Math.round(avgConfidence * 100) / 100,
        suggestions: formattedSuggestions,
        isUncertain: avgConfidence < LOW_CONFIDENCE_THRESHOLD,
        message: null
      };
      result = this._withRuntimeRecommendation(result, runtimeNext);
      this._cacheResult(cacheKey, result);
      return result;
    } catch (error) {
      return { ...defaultResult, message: `Error: ${error.message}` };
    }
  }
  getFallbackSuggestions(context) {
    const agent = context.agentId || "chief";
    const fallbacks = {
      chief: [
        { command: "/status", args: "", description: "Show system status", confidence: 0.3, priority: 1, source: "fallback" },
        { command: "/next-action", args: "", description: "Get next recommended action", confidence: 0.25, priority: 2, source: "fallback" }
      ],
      researcher: [
        { command: "/audience-research-agent", args: "", description: "Start audience research", confidence: 0.3, priority: 1, source: "fallback" },
        { command: "/voc-research-agent", args: "", description: "Extract VOC data", confidence: 0.25, priority: 2, source: "fallback" }
      ],
      briefer: [
        { command: "/helix-system-agent", args: "", description: "Run HELIX briefing", confidence: 0.3, priority: 1, source: "fallback" }
      ],
      producer: [
        { command: "/production-agent", args: "", description: "Start production", confidence: 0.3, priority: 1, source: "fallback" }
      ],
      default: [
        { command: "/status", args: "", description: "Show status", confidence: 0.3, priority: 1, source: "fallback" },
        { command: "/help", args: "", description: "Show available commands", confidence: 0.2, priority: 2, source: "fallback" }
      ]
    };
    return {
      workflow: null,
      currentState: null,
      confidence: 0.25,
      suggestions: fallbacks[agent] || fallbacks.default,
      isUncertain: true,
      message: "Using fallback suggestions"
    };
  }
  invalidateCache() {
    this._suggestionCache = null;
    this._cacheTimestamp = null;
    this._cacheKey = null;
  }
  // ============ Private ============
  _getRuntimeNextRecommendation(context) {
    try {
      const signals = this._buildRuntimeSignals(context);
      const recommendation = this._wsm.getNextActionRecommendation(signals, { offer: context.offerPath || "" });
      if (!recommendation || recommendation.state === "unknown") return null;
      return recommendation;
    } catch {
      return null;
    }
  }
  _buildRuntimeSignals(context) {
    const ps = context.projectState || {};
    return {
      story_status: ps.story_status || ps.offer_phase || (ps.activeOffer ? "in_progress" : "unknown"),
      qa_status: ps.qa_status || ps.gate_status || "unknown",
      ci_status: ps.ci_status || "unknown",
      has_uncommitted_changes: Boolean(ps.hasUncommittedChanges),
      offer_phase: ps.offer_phase,
      gate_status: ps.gate_status,
      mecanismo_state: ps.mecanismo_state,
      ...context.executionSignals || {}
    };
  }
  _withRuntimeRecommendation(result, runtimeNext) {
    if (!result || !runtimeNext) return result;
    const runtimeSuggestion = {
      command: runtimeNext.command,
      args: "",
      description: runtimeNext.rationale,
      confidence: runtimeNext.confidence,
      priority: 0,
      source: "runtime_first",
      agent: runtimeNext.agent,
      executionState: runtimeNext.state
    };
    const existing = Array.isArray(result.suggestions) ? result.suggestions : [];
    const normalizedCmd = String(runtimeSuggestion.command || "").trim().toLowerCase();
    const deduped = existing.filter((s) => String((s.command || "") + (s.args ? ` ${s.args}` : "")).trim().toLowerCase() !== normalizedCmd);
    return {
      ...result,
      suggestions: [runtimeSuggestion, ...deduped],
      confidence: Math.max(result.confidence || 0, runtimeNext.confidence || 0),
      isUncertain: false,
      runtimeState: runtimeNext.state
    };
  }
  _matchWorkflow(commands, patterns) {
    if (commands.length === 0) return null;
    let bestMatch = null;
    for (const [name, pattern] of Object.entries(patterns)) {
      const keyCommands = pattern.key_commands || [];
      const threshold = pattern.trigger_threshold || 2;
      const matchCount = commands.filter((cmd) => keyCommands.some((kc) => cmd.toLowerCase().includes(kc.toLowerCase()))).length;
      if (matchCount >= threshold && (!bestMatch || matchCount > bestMatch.score)) {
        let currentState;
        const lastCmd = commands[commands.length - 1]?.toLowerCase() || "";
        for (const [state, transition] of Object.entries(pattern.transitions || {})) {
          if (lastCmd.includes(transition.trigger?.split(" ")[0]?.toLowerCase() || "")) {
            currentState = state;
            break;
          }
        }
        bestMatch = { name, pattern, state: currentState, score: matchCount };
      }
    }
    return bestMatch ? { name: bestMatch.name, pattern: bestMatch.pattern, state: bestMatch.state } : null;
  }
  _getSuggestionsFromMatch(match, _context) {
    const suggestions = [];
    if (match.state && match.pattern.transitions[match.state]) {
      const transition = match.pattern.transitions[match.state];
      for (const step of transition.next_steps) {
        suggestions.push({
          command: step.command,
          args_template: step.args_template,
          description: step.description,
          confidence: transition.confidence,
          priority: step.priority
        });
      }
    } else {
      const firstTransition = Object.values(match.pattern.transitions || {})[0];
      if (firstTransition) {
        for (const step of firstTransition.next_steps) {
          suggestions.push({
            command: step.command,
            args_template: step.args_template,
            description: step.description,
            confidence: firstTransition.confidence * 0.7,
            priority: step.priority
          });
        }
      }
    }
    return suggestions;
  }
  _applyLearnedPatternBoost(suggestions, context) {
    const wiePath = (0, import_path.join)(process.env.HOME || "", ".claude", "learned-patterns", "wie-data.json");
    if (!(0, import_fs.existsSync)(wiePath)) return suggestions;
    try {
      const wieData = JSON.parse((0, import_fs.readFileSync)(wiePath, "utf-8"));
      const recentTools = (wieData.tool_usage || []).slice(-20).map((t) => t.tool?.toLowerCase());
      return suggestions.map((suggestion) => {
        const cmdNormalized = suggestion.command.replace(/^\//, "").toLowerCase();
        const matchCount = recentTools.filter((t) => t?.includes(cmdNormalized)).length;
        if (matchCount > 0) {
          const boost = Math.min(matchCount * 0.03, this.learnedPatternBoost);
          return { ...suggestion, confidence: Math.min(1, suggestion.confidence + boost), source: "learned_pattern", learnedBoost: Math.round(boost * 100) / 100 };
        }
        return suggestion;
      });
    } catch {
      return suggestions;
    }
  }
  _interpolateArgs(argsTemplate, context) {
    if (!argsTemplate) return "";
    return argsTemplate.replace(/\$\{offer_path\}/g, context.offerPath || "").replace(/\$\{branch\}/g, context.branch || "").trim();
  }
  _detectCurrentAgent() {
    return process.env.AIOS_CURRENT_AGENT?.replace("@", "") || "chief";
  }
  _detectGitBranch() {
    try {
      const gitHeadPath = (0, import_path.join)(process.cwd(), ".git", "HEAD");
      if ((0, import_fs.existsSync)(gitHeadPath)) {
        const content = (0, import_fs.readFileSync)(gitHeadPath, "utf8").trim();
        if (content.startsWith("ref: refs/heads/")) return content.replace("ref: refs/heads/", "");
      }
    } catch {
    }
    return void 0;
  }
  _buildProjectState(context) {
    return {
      activeOffer: !!context.offerPath,
      hasUncommittedChanges: false,
      workflowPhase: null
    };
  }
  _generateCacheKey(context) {
    return [context.agentId || "", context.lastCommand || "", (context.lastCommands || []).slice(-3).join(","), context.offerPath || "", context.branch || ""].join("|");
  }
  _isCacheValid(key) {
    return !!(this._suggestionCache && this._cacheTimestamp && this._cacheKey === key && Date.now() - this._cacheTimestamp < this.cacheTTL);
  }
  _cacheResult(key, result) {
    this._suggestionCache = result;
    this._cacheTimestamp = Date.now();
    this._cacheKey = key;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LOW_CONFIDENCE_THRESHOLD,
  SUGGESTION_CACHE_TTL,
  SuggestionEngine
});
