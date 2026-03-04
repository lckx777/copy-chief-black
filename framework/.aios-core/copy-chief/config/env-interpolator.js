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
var env_interpolator_exports = {};
__export(env_interpolator_exports, {
  ENV_VAR_PATTERN: () => ENV_VAR_PATTERN,
  interpolateEnvVars: () => interpolateEnvVars,
  interpolateString: () => interpolateString,
  lintEnvPatterns: () => lintEnvPatterns
});
module.exports = __toCommonJS(env_interpolator_exports);
var import_merge_utils = require("./merge-utils");
const ENV_VAR_PATTERN = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-(.*?))?\}/g;
function interpolateString(value, options) {
  const warnings = options?.warnings ?? [];
  ENV_VAR_PATTERN.lastIndex = 0;
  return value.replace(ENV_VAR_PATTERN, (_match, varName, defaultValue) => {
    const envValue = process.env[varName];
    if (envValue !== void 0) {
      return envValue;
    }
    if (defaultValue !== void 0) {
      return defaultValue;
    }
    warnings.push(`Missing environment variable: ${varName} (no default set)`);
    return "";
  });
}
function interpolateEnvVars(config, options) {
  const warnings = options?.warnings ?? [];
  if (typeof config === "string") {
    return interpolateString(config, { warnings });
  }
  if (Array.isArray(config)) {
    return config.map((item) => interpolateEnvVars(item, { warnings }));
  }
  if ((0, import_merge_utils.isPlainObject)(config)) {
    const result = {};
    for (const [key, value] of Object.entries(config)) {
      result[key] = interpolateEnvVars(value, { warnings });
    }
    return result;
  }
  return config;
}
function lintEnvPatterns(config, sourceFile) {
  const findings = [];
  function walk(obj, path) {
    if (typeof obj === "string") {
      ENV_VAR_PATTERN.lastIndex = 0;
      if (ENV_VAR_PATTERN.test(obj)) {
        ENV_VAR_PATTERN.lastIndex = 0;
        findings.push(`${sourceFile}: ${path} contains env variable pattern: ${obj}`);
      }
    } else if ((0, import_merge_utils.isPlainObject)(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        walk(value, path ? `${path}.${key}` : key);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        walk(item, `${path}[${i}]`);
      });
    }
  }
  walk(config, "");
  return findings;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ENV_VAR_PATTERN,
  interpolateEnvVars,
  interpolateString,
  lintEnvPatterns
});
