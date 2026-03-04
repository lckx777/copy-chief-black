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
var config_loader_exports = {};
__export(config_loader_exports, {
  TOOL_NAME_MAP: () => TOOL_NAME_MAP,
  clearCaches: () => clearCaches,
  formatToolName: () => formatToolName,
  getAgentConfig: () => getAgentConfig,
  getGateThreshold: () => getGateThreshold,
  getOfferPhase: () => getOfferPhase,
  getQualityGates: () => getQualityGates,
  getRecommendedTools: () => getRecommendedTools,
  getRequiredToolGroups: () => getRequiredToolGroups,
  getRequiredTools: () => getRequiredTools,
  getStoriesLocation: () => getStoriesLocation,
  hasGatePassed: () => hasGatePassed,
  loadCoreConfig: () => loadCoreConfig,
  loadOfferState: () => loadOfferState,
  resolveToolName: () => resolveToolName
});
module.exports = __toCommonJS(config_loader_exports);
var import_fs = require("fs");
var import_path = require("path");
let yaml;
try {
  yaml = require("yaml");
} catch {
  yaml = require("js-yaml");
}
const CORE_CONFIG_PATH = (0, import_path.join)(process.env.HOME, ".claude", "core-config.yaml");
const ECOSYSTEM_ROOT = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
let _coreConfig = null;
let _coreConfigMtime = 0;
const _offerStateCache = /* @__PURE__ */ new Map();
function loadCoreConfig() {
  try {
    const stat = require("fs").statSync(CORE_CONFIG_PATH);
    const mtime = stat.mtimeMs;
    if (_coreConfig && _coreConfigMtime === mtime) {
      return _coreConfig;
    }
    const content = (0, import_fs.readFileSync)(CORE_CONFIG_PATH, "utf-8");
    const parsed = yaml.parse ? yaml.parse(content) : yaml.load(content);
    _coreConfig = parsed;
    _coreConfigMtime = mtime;
    return _coreConfig;
  } catch (err) {
    throw new Error(`[config-loader] Failed to load core-config.yaml: ${err}`);
  }
}
function getRequiredTools(gate) {
  const config = loadCoreConfig();
  const gateConfig = config.quality?.gates?.[gate];
  return gateConfig?.required_tools || [];
}
function getQualityGates() {
  const config = loadCoreConfig();
  return config.quality?.gates || {};
}
function getGateThreshold(gate) {
  const config = loadCoreConfig();
  return config.quality?.gates?.[gate]?.threshold;
}
function loadOfferState(offerPath) {
  const statePath = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "helix-state.yaml");
  if (!(0, import_fs.existsSync)(statePath)) return null;
  try {
    const stat = require("fs").statSync(statePath);
    const mtime = stat.mtimeMs;
    const cached = _offerStateCache.get(offerPath);
    if (cached && cached.mtime === mtime) {
      return cached.data;
    }
    const content = (0, import_fs.readFileSync)(statePath, "utf-8");
    const parsed = yaml.parse ? yaml.parse(content) : yaml.load(content);
    _offerStateCache.set(offerPath, { data: parsed, mtime });
    return parsed;
  } catch {
    return null;
  }
}
function getOfferPhase(offerPath) {
  const state = loadOfferState(offerPath);
  return state?.workflow_phase || "idle";
}
function hasGatePassed(offerPath, gate) {
  const state = loadOfferState(offerPath);
  return state?.gates?.[gate]?.passed === true;
}
function getStoriesLocation() {
  const config = loadCoreConfig();
  const loc = config.stories?.location || "~/.claude/stories";
  return loc.replace("~", process.env.HOME);
}
function getAgentConfig(agentId) {
  const config = loadCoreConfig();
  return config.agents?.registry?.find((a) => a.id === agentId);
}
const TOOL_NAME_MAP = {
  "voc_search": "mcp__copywriting__voc_search",
  "firecrawl_agent": "mcp__firecrawl__firecrawl_agent",
  "firecrawl_scrape": "mcp__firecrawl__firecrawl_scrape",
  "firecrawl_search": "mcp__firecrawl__firecrawl_search",
  "browser_navigate": "mcp__playwright__browser_navigate",
  "get_phase_context": "mcp__copywriting__get_phase_context",
  "blind_critic": "mcp__copywriting__blind_critic",
  "emotional_stress_test": "mcp__copywriting__emotional_stress_test",
  "get_meta_ads": "mcp__fb_ad_library__get_meta_ads",
  "get_meta_platform_id": "mcp__fb_ad_library__get_meta_platform_id",
  "analyze_ad_video": "mcp__fb_ad_library__analyze_ad_video",
  "consensus": "mcp__zen__consensus",
  "thinkdeep": "mcp__zen__thinkdeep",
  "layered_review": "mcp__copywriting__layered_review",
  "write_chapter": "mcp__copywriting__write_chapter",
  "black_validation": "mcp__copywriting__black_validation",
  "validate_gate": "mcp__copywriting__validate_gate",
  "sequential_thinking": "mcp__sequential-thinking__sequentialthinking"
};
function resolveToolName(name) {
  if (name.startsWith("mcp__")) return name;
  return TOOL_NAME_MAP[name] || name;
}
function formatToolName(tool) {
  return tool.replace(/^mcp__/, "").replace(/__/g, ".").replace(/_/g, " ");
}
function getRequiredToolGroups(gate) {
  const shortNames = getRequiredTools(gate);
  if (gate === "research") {
    return [
      // Group 1: Data collection (any scraping tool)
      [
        resolveToolName("firecrawl_agent"),
        resolveToolName("firecrawl_scrape"),
        resolveToolName("firecrawl_search"),
        resolveToolName("browser_navigate")
      ],
      // Group 2: VOC Search
      [resolveToolName("voc_search")]
    ];
  }
  return shortNames.map((name) => [resolveToolName(name)]);
}
function getRecommendedTools(gate) {
  const recommended = {
    research: ["get_meta_ads", "get_meta_platform_id", "analyze_ad_video"],
    briefing: ["consensus", "thinkdeep"],
    production: ["layered_review", "write_chapter"]
  };
  return (recommended[gate] || []).map(resolveToolName);
}
function clearCaches() {
  _coreConfig = null;
  _coreConfigMtime = 0;
  _offerStateCache.clear();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TOOL_NAME_MAP,
  clearCaches,
  formatToolName,
  getAgentConfig,
  getGateThreshold,
  getOfferPhase,
  getQualityGates,
  getRecommendedTools,
  getRequiredToolGroups,
  getRequiredTools,
  getStoriesLocation,
  hasGatePassed,
  loadCoreConfig,
  loadOfferState,
  resolveToolName
});
