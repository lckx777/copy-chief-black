#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
var import_session_state = require("../.aios-core/copy-chief/state/session-state");
var import_gate_prereq = require("../.aios-core/copy-chief/gates/gate-prereq");
var import_weighted_gates = require("../.aios-core/copy-chief/gates/weighted-gates");
var import_quality_gate_manager = require("../.aios-core/copy-chief/gates/quality-gate-manager");
function collectQualityScores(offerPath) {
  const scores = {};
  try {
    const ecosystemRoot = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
    const helixStatePath = (0, import_path.join)(ecosystemRoot, offerPath, "helix-state.yaml");
    if (!(0, import_fs.existsSync)(helixStatePath)) return scores;
    const content = (0, import_fs.readFileSync)(helixStatePath, "utf-8");
    const scorePatterns = {
      blind_critic: /blind_critic[:\s]+(\d+(?:\.\d+)?)/,
      emotional_stress_test: /emotional_stress_test[:\s]+(\d+(?:\.\d+)?)/,
      black_validation: /black_validation[:\s]+(\d+(?:\.\d+)?)/,
      logo_test: /logo_test[:\s]+(\d+(?:\.\d+)?)/,
      specificity: /specificity[:\s]+(\d+(?:\.\d+)?)/
    };
    for (const [key, pattern] of Object.entries(scorePatterns)) {
      const match = content.match(pattern);
      if (match) scores[key] = parseFloat(match[1]);
    }
  } catch {
  }
  return scores;
}
function getMecanismoState(offerPath) {
  try {
    const ecosystemRoot = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
    const mecPath = (0, import_path.join)(ecosystemRoot, offerPath, "mecanismo-unico.yaml");
    if (!(0, import_fs.existsSync)(mecPath)) return void 0;
    const content = (0, import_fs.readFileSync)(mecPath, "utf-8");
    const stateMatch = content.match(/state:\s*(\w+)/);
    return stateMatch ? stateMatch[1] : void 0;
  } catch {
    return void 0;
  }
}
function allow() {
  const output = {};
  console.log(JSON.stringify(output));
  process.exit(0);
}
function block(gateType, toolsUsed, missingGroups) {
  const offer = (0, import_session_state.getActiveOffer)();
  const phase = (0, import_session_state.getCurrentPhase)();
  const output = {
    decision: "block",
    reason: (0, import_gate_prereq.formatBlockReason)(gateType, toolsUsed, missingGroups, offer, phase)
  };
  console.error(`[VALIDATE-GATE-PREREQ] \u274C Bloqueado: ${missingGroups.length} grupo(s) de ferramentas faltando`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (input.tool_name !== "mcp__copywriting__validate_gate") {
      allow();
      return;
    }
    const gateType = input.tool_input?.gate_type;
    if (!gateType) {
      allow();
      return;
    }
    const validGateTypes = ["research", "briefing", "production"];
    if (!validGateTypes.includes(gateType)) {
      allow();
      return;
    }
    const sessionTools = (0, import_session_state.getToolsUsedInPhase)(gateType);
    const persistentTools = (0, import_gate_prereq.getToolsFromPersistentState)((0, import_session_state.getActiveOffer)(), gateType);
    const toolsUsed = [.../* @__PURE__ */ new Set([...sessionTools, ...persistentTools])];
    const prereq = (0, import_gate_prereq.evaluateGatePrereq)(gateType, toolsUsed);
    if (!prereq.passed) {
      block(gateType, toolsUsed, prereq.missingGroups);
      return;
    }
    if (prereq.missingRecommended.length > 0) {
      console.error(`[VALIDATE-GATE-PREREQ] \u26A0\uFE0F Ferramentas recomendadas n\xE3o usadas: ${prereq.missingRecommended.join(", ")}`);
    }
    console.error(`[VALIDATE-GATE-PREREQ] \u2705 Todas ferramentas obrigat\xF3rias usadas para ${gateType}`);
    try {
      const offerPath = (0, import_session_state.getActiveOffer)();
      if (offerPath) {
        const qgm = new import_quality_gate_manager.QualityGateManager(gateType, offerPath);
        const result = qgm.orchestrate({
          toolsUsed,
          scores: collectQualityScores(offerPath),
          mecanismoState: getMecanismoState(offerPath)
        });
        console.error(`[QGM] ${gateType}: ${result.status} (${result.duration}ms)`);
        for (const layer of result.layers) {
          const icon = layer.pass ? "\u2705" : "\u274C";
          console.error(`[QGM]   ${icon} ${layer.layer}: ${layer.status}`);
          for (const check of layer.results.filter((r) => !r.pass && !r.skipped)) {
            console.error(`[QGM]     \u26A0 ${check.message}`);
          }
        }
        if (!result.pass && result.status === "failed") {
          console.error(`[QGM] \u26A0\uFE0F Quality gate ${result.stoppedAt} failed. Non-blocking warning.`);
        }
        qgm.saveStatus();
      }
    } catch (err) {
      console.error(`[QGM] Warning: ${err}`);
    }
    try {
      const offerPath = (0, import_session_state.getActiveOffer)();
      if (offerPath) {
        const gateScore = gateType === "research" ? (0, import_weighted_gates.evaluateResearchGate)(offerPath) : gateType === "production" ? (0, import_weighted_gates.evaluateProductionGate)(offerPath) : void 0;
        if (gateScore) {
          console.error(`[WEIGHTED-GATE] ${gateScore.gate}: ${gateScore.total_weighted}/100 (${gateScore.verdict})`);
          if (gateScore.verdict === "NEEDS_REVIEW") {
            console.error(`[WEIGHTED-GATE] \u26A0\uFE0F Score below 85. Review recommended.`);
          }
        }
      }
    } catch {
    }
    allow();
  } catch (error) {
    console.error(`[VALIDATE-GATE-PREREQ] Erro: ${error}`);
    allow();
  }
}
main();
