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
var context_tiering_exports = {};
__export(context_tiering_exports, {
  getContextHealth: () => getContextHealth,
  getInjectionStrategy: () => getInjectionStrategy,
  loadState: () => loadState,
  recordToolCall: () => recordToolCall,
  resetCounter: () => resetCounter,
  shouldEmitWarning: () => shouldEmitWarning
});
module.exports = __toCommonJS(context_tiering_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const STATE_DIR = (0, import_path.join)(HOME, ".claude", "session-state");
const COUNTER_FILE = (0, import_path.join)(STATE_DIR, "context-counter.json");
const MAX_CONTEXT_TOKENS = 2e5;
const AVG_TOKENS_PER_TOOL_CALL = 800;
const BRACKETS = {
  FRESH: { min_pct: 0, max_pct: 30 },
  MODERATE: { min_pct: 30, max_pct: 50 },
  DEPLETED: { min_pct: 50, max_pct: 70 },
  CRITICAL: { min_pct: 70, max_pct: 100 }
};
function ensureDir() {
  if (!(0, import_fs.existsSync)(STATE_DIR)) {
    (0, import_fs.mkdirSync)(STATE_DIR, { recursive: true });
  }
}
function loadState() {
  ensureDir();
  if ((0, import_fs.existsSync)(COUNTER_FILE)) {
    try {
      const raw = (0, import_fs.readFileSync)(COUNTER_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
    }
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    tool_calls: 0,
    estimated_tokens: 0,
    estimated_pct: 0,
    bracket: "FRESH",
    session_start: now,
    last_updated: now,
    warnings_emitted: 0
  };
}
function saveState(state) {
  ensureDir();
  state.last_updated = (/* @__PURE__ */ new Date()).toISOString();
  (0, import_fs.writeFileSync)(COUNTER_FILE, JSON.stringify(state, null, 2));
}
function detectBracket(pct) {
  if (pct < BRACKETS.FRESH.max_pct) return "FRESH";
  if (pct < BRACKETS.MODERATE.max_pct) return "MODERATE";
  if (pct < BRACKETS.DEPLETED.max_pct) return "DEPLETED";
  return "CRITICAL";
}
function recordToolCall(additionalTokens) {
  const state = loadState();
  state.tool_calls++;
  state.estimated_tokens += additionalTokens || AVG_TOKENS_PER_TOOL_CALL;
  state.estimated_pct = Math.min(100, Math.round(state.estimated_tokens / MAX_CONTEXT_TOKENS * 100));
  state.bracket = detectBracket(state.estimated_pct);
  saveState(state);
  return state;
}
function getInjectionStrategy() {
  const state = loadState();
  switch (state.bracket) {
    case "FRESH":
      return {
        bracket: "FRESH",
        load_hot: true,
        load_warm: true,
        load_cold: false,
        max_injection_tokens: 3e4,
        should_compact: false,
        force_compact: false
      };
    case "MODERATE":
      return {
        bracket: "MODERATE",
        load_hot: true,
        load_warm: true,
        load_cold: false,
        max_injection_tokens: 2e4,
        should_compact: false,
        force_compact: false
      };
    case "DEPLETED":
      return {
        bracket: "DEPLETED",
        load_hot: true,
        load_warm: false,
        load_cold: false,
        max_injection_tokens: 1e4,
        should_compact: true,
        force_compact: false,
        warning: `Context ${state.estimated_pct}% \u2014 DEPLETED. /compact recomendado. Warm files nao serao injetados.`
      };
    case "CRITICAL":
      return {
        bracket: "CRITICAL",
        load_hot: true,
        load_warm: false,
        load_cold: false,
        max_injection_tokens: 5e3,
        should_compact: true,
        force_compact: true,
        warning: `Context ${state.estimated_pct}% \u2014 CRITICAL! /compact URGENTE. Qualidade degradando significativamente.`
      };
  }
}
function resetCounter(reason) {
  const state = loadState();
  if (reason === "compact") {
    state.estimated_tokens = Math.round(state.estimated_tokens * 0.4);
    state.last_compact_at = (/* @__PURE__ */ new Date()).toISOString();
  } else {
    state.tool_calls = 0;
    state.estimated_tokens = 0;
    state.warnings_emitted = 0;
    state.session_start = (/* @__PURE__ */ new Date()).toISOString();
  }
  state.estimated_pct = Math.min(100, Math.round(state.estimated_tokens / MAX_CONTEXT_TOKENS * 100));
  state.bracket = detectBracket(state.estimated_pct);
  saveState(state);
  return state;
}
function shouldEmitWarning() {
  const state = loadState();
  const strategy = getInjectionStrategy();
  if (!strategy.warning) {
    return { emit: false };
  }
  if (state.warnings_emitted >= 3) {
    return { emit: false };
  }
  state.warnings_emitted++;
  saveState(state);
  return { emit: true, message: strategy.warning };
}
function getContextHealth() {
  const state = loadState();
  let recommendation;
  switch (state.bracket) {
    case "FRESH":
      recommendation = "Trabalhar normalmente. Carregar Hot + Warm.";
      break;
    case "MODERATE":
      recommendation = "Seletivo com carregamento. Evitar arquivos grandes.";
      break;
    case "DEPLETED":
      recommendation = "/compact recomendado. Apenas Hot files.";
      break;
    case "CRITICAL":
      recommendation = "/compact URGENTE. Qualidade em risco.";
      break;
  }
  return {
    bracket: state.bracket,
    pct: state.estimated_pct,
    tool_calls: state.tool_calls,
    tokens: state.estimated_tokens,
    recommendation
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getContextHealth,
  getInjectionStrategy,
  loadState,
  recordToolCall,
  resetCounter,
  shouldEmitWarning
});
