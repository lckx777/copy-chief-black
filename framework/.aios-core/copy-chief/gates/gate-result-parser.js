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
var gate_result_parser_exports = {};
__export(gate_result_parser_exports, {
  SCORE_REGEX: () => SCORE_REGEX,
  parseBlackValidationOutput: () => parseBlackValidationOutput,
  parseValidateGateOutput: () => parseValidateGateOutput
});
module.exports = __toCommonJS(gate_result_parser_exports);
const SCORE_REGEX = /score[:\s]+(\d+(?:\.\d+)?)/i;
function parseValidateGateOutput(output) {
  const outputStr = typeof output === "string" ? output : JSON.stringify(output);
  try {
    const result = typeof output === "string" ? JSON.parse(output) : output;
    if (result && typeof result === "object") {
      if (result.result === "PASSED") {
        return { outcome: "PASSED" };
      }
      if (result.result === "BLOCKED") {
        const reasons = result.reasons?.join(", ") || "sem raz\xF5es";
        return { outcome: "BLOCKED", reasons };
      }
    }
  } catch {
  }
  if (/PASSED/i.test(outputStr)) {
    return { outcome: "PASSED" };
  }
  if (/BLOCKED/i.test(outputStr)) {
    return { outcome: "BLOCKED" };
  }
  return { outcome: "UNKNOWN" };
}
function parseBlackValidationOutput(output) {
  const outputStr = typeof output === "string" ? output : JSON.stringify(output);
  try {
    const result = typeof output === "string" ? JSON.parse(output) : output;
    if (result && typeof result === "object") {
      const r = result;
      let score = null;
      if (typeof r.score === "number") {
        score = r.score;
      } else if (typeof r.total_score === "number") {
        score = r.total_score;
      } else if (typeof r.weighted_score === "number") {
        score = r.weighted_score;
      }
      if (score !== null) {
        return { score, passed: score >= 8 };
      }
    }
  } catch {
  }
  const scoreMatch = outputStr.match(SCORE_REGEX);
  if (scoreMatch) {
    const score = parseFloat(scoreMatch[1]);
    return { score, passed: score >= 8 };
  }
  return { score: null, passed: false };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SCORE_REGEX,
  parseBlackValidationOutput,
  parseValidateGateOutput
});
