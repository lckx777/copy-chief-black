var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var config_resolver_exports = {};
__export(config_resolver_exports, {
  CONFIG_PATHS: () => CONFIG_PATHS,
  LEVELS: () => LEVELS,
  deepMerge: () => import_merge_utils.deepMerge,
  getAgentRegistry: () => getAgentRegistry,
  getConfigAtLevel: () => getConfigAtLevel,
  getContextRules: () => getContextRules,
  getCoreConfig: () => getCoreConfig,
  getHandoffRules: () => getHandoffRules,
  getQualityGates: () => getQualityGates,
  getRequiredTools: () => getRequiredTools,
  getThreshold: () => getThreshold,
  mergeAll: () => import_merge_utils.mergeAll,
  resolveConfig: () => resolveConfig
});
module.exports = __toCommonJS(config_resolver_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_js_yaml = __toESM(require("js-yaml"));
var import_config_cache = require("./config-cache");
var import_merge_utils = require("./merge-utils");
var import_env_interpolator = require("./env-interpolator");
const HOME = process.env.HOME || "/tmp";
const CLAUDE_DIR = (0, import_path.join)(HOME, ".claude");
const ECOSYSTEM_ROOT = (0, import_path.join)(HOME, "copywriting-ecosystem");
const CONFIG_FILES = {
  framework: (0, import_path.join)(CLAUDE_DIR, "framework-config.yaml"),
  // L1
  project: (0, import_path.join)(CLAUDE_DIR, "core-config.yaml")
  // L2
  // L3 is dynamic: {offer}/helix-state.yaml
};
const LEVELS = {
  framework: "L1",
  project: "L2",
  offer: "L3"
};
function loadYamlFile(filePath) {
  try {
    if (!(0, import_fs.existsSync)(filePath)) return null;
    const content = (0, import_fs.readFileSync)(filePath, "utf-8");
    const data = import_js_yaml.default.load(content);
    return data || {};
  } catch (error) {
    console.error(`[CONFIG-RESOLVER] Failed to parse ${filePath}: ${error}`);
    return null;
  }
}
function trackSources(sources, data, level, file, prefix = "") {
  if (!sources || !data) return;
  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    sources[fullKey] = { level, file };
    if ((0, import_merge_utils.isPlainObject)(value)) {
      trackSources(sources, value, level, file, fullKey);
    }
  }
}
function resolveConfig(offerPath, options = {}) {
  const cacheKey = `resolved:${offerPath || "global"}:${options.debug ? "debug" : "std"}`;
  if (!options.skipCache) {
    const cached = import_config_cache.globalConfigCache.get(cacheKey);
    if (cached) return cached;
  }
  const sources = {};
  const l1 = loadYamlFile(CONFIG_FILES.framework);
  let config = l1 || {};
  if (options.debug && l1) {
    trackSources(sources, l1, LEVELS.framework, CONFIG_FILES.framework);
  }
  const l2 = loadYamlFile(CONFIG_FILES.project);
  if (l2) {
    config = (0, import_merge_utils.deepMerge)(config, l2);
    if (options.debug) {
      trackSources(sources, l2, LEVELS.project, CONFIG_FILES.project);
    }
  }
  if (offerPath) {
    const helixStatePath = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "helix-state.yaml");
    const l3 = loadYamlFile(helixStatePath);
    if (l3) {
      const offerOverrides = {};
      if (l3.config) offerOverrides.quality = l3.config;
      if (l3.gates_override) offerOverrides.quality = { ...offerOverrides.quality, gates_override: l3.gates_override };
      config = (0, import_merge_utils.deepMerge)(config, offerOverrides);
      config._offer_overrides = l3;
      if (options.debug) {
        trackSources(sources, offerOverrides, LEVELS.offer, helixStatePath);
      }
    }
  }
  if (options.debug) {
    config._sources = sources;
  }
  const interpolated = (0, import_env_interpolator.interpolateEnvVars)(config);
  if (options.debug && config._sources) {
    interpolated._sources = config._sources;
  }
  const result = interpolated;
  import_config_cache.globalConfigCache.set(cacheKey, result);
  return result;
}
function getConfigAtLevel(level, offerPath) {
  switch (level) {
    case "framework":
      return loadYamlFile(CONFIG_FILES.framework);
    case "project":
      return loadYamlFile(CONFIG_FILES.project);
    case "offer":
      if (!offerPath) return null;
      return loadYamlFile((0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "helix-state.yaml"));
    default:
      return null;
  }
}
function getCoreConfig() {
  const cacheKey = "core-config";
  const cached = import_config_cache.globalConfigCache.get(cacheKey);
  if (cached) return cached;
  const config = loadYamlFile(CONFIG_FILES.project);
  if (config) import_config_cache.globalConfigCache.set(cacheKey, config);
  return config;
}
function getQualityGates(offerPath) {
  const config = resolveConfig(offerPath);
  return config.quality?.gates || {};
}
function getRequiredTools(phase, offerPath) {
  const gates = getQualityGates(offerPath);
  return gates[phase]?.required_tools || [];
}
function getThreshold(name, offerPath) {
  const config = resolveConfig(offerPath);
  const thresholds = config.quality?.thresholds || {};
  return thresholds[name] || 0;
}
function getAgentRegistry() {
  const config = getCoreConfig();
  return config?.agents?.registry || [];
}
function getHandoffRules() {
  const config = getCoreConfig();
  return config?.handoffs?.rules || [];
}
function getContextRules() {
  const config = getCoreConfig();
  return {
    always_load: config?.context?.always_load || [],
    per_agent: config?.context?.per_agent || {}
  };
}
const CONFIG_PATHS = CONFIG_FILES;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CONFIG_PATHS,
  LEVELS,
  deepMerge,
  getAgentRegistry,
  getConfigAtLevel,
  getContextRules,
  getCoreConfig,
  getHandoffRules,
  getQualityGates,
  getRequiredTools,
  getThreshold,
  mergeAll,
  resolveConfig
});
