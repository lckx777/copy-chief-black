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
var merge_utils_exports = {};
__export(merge_utils_exports, {
  deepMerge: () => deepMerge,
  isPlainObject: () => isPlainObject,
  mergeAll: () => mergeAll
});
module.exports = __toCommonJS(merge_utils_exports);
function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function deepMerge(target, source) {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source !== void 0 ? source : target;
  }
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (key.endsWith("+append")) {
      const baseKey = key.slice(0, -7);
      if (Array.isArray(value)) {
        const existing = result[baseKey];
        result[baseKey] = Array.isArray(existing) ? [...existing, ...value] : value;
      }
      continue;
    }
    if (value === null) {
      delete result[key];
      continue;
    }
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], value);
      continue;
    }
    result[key] = value;
  }
  return result;
}
function mergeAll(...layers) {
  return layers.reduce((result, layer) => {
    if (!layer || !isPlainObject(layer)) return result;
    return deepMerge(result, layer);
  }, {});
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deepMerge,
  isPlainObject,
  mergeAll
});
