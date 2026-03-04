#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
var import_offer_state = require("../.aios-core/copy-chief/state/offer-state");
var import_helix_phases = require("../.aios-core/copy-chief/workflow/helix-phases");
var import_yaml_validator = require("../.aios-core/copy-chief/utils/yaml-validator");
var import_phase_checklist = require("../.aios-core/copy-chief/workflow/phase-checklist");
const ECOSYSTEM_ROOT = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
function allow() {
  const output = {};
  console.log(JSON.stringify(output));
  process.exit(0);
}
function block(reason, offerPath, phase, missingTools) {
  const state = (0, import_offer_state.getOfferState)(offerPath);
  const phaseKey = `phase_${phase}`;
  const phaseState = state.helix_phases[phaseKey];
  const toolsUsed = phaseState?.tools_used || [];
  const toolsRequired = phaseState?.tools_required || [];
  const output = {
    decision: "block",
    reason: `BLOQUEADO - FASE HELIX ${phase}

${reason}

**Estado da Oferta:** ${offerPath}
**Fase:** ${phase}
**Ferramentas Obrigatorias:** ${toolsRequired.map((t) => import_offer_state.TOOL_DISPLAY_NAMES[t] || t).join(", ")}
**Ferramentas Usadas:** ${toolsUsed.length > 0 ? toolsUsed.map((t) => import_offer_state.TOOL_DISPLAY_NAMES[t] || t).join(", ") : "(nenhuma)"}
**Ferramentas Faltando:** ${(missingTools || []).map((t) => import_offer_state.TOOL_DISPLAY_NAMES[t] || t).join(", ")}

**ACAO OBRIGATORIA:**
Execute as ferramentas faltantes ANTES de criar o arquivo da fase.

**Por que isso existe (v8.0):**
O sistema usa estado POR OFERTA (persistente entre sessoes).
Isso garante que as ferramentas corretas foram usadas,
mesmo se voce fechou e reabriu o Claude Code.
Alem disso, um checklist de 3 camadas e gerado automaticamente
ao avancar fase (reviews/phase-XX-review.md).

Ver: ~/.claude/reference/tool-usage-matrix.md
Estado: ${offerPath}/helix-state.yaml`
  };
  console.error(`[PHASE-ADVANCE-GATE] Blocked: Phase ${phase} - missing tools: ${(missingTools || []).join(", ")}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
async function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (input.tool_name !== "Write") {
      allow();
      return;
    }
    const filePath = input.tool_input?.file_path;
    if (!filePath) {
      allow();
      return;
    }
    if (!filePath.includes("briefings/phases/") && !filePath.includes("briefings\\phases\\")) {
      allow();
      return;
    }
    const offerPath = (0, import_offer_state.detectOfferFromPath)(filePath);
    if (!offerPath) {
      console.error(`[PHASE-ADVANCE-GATE] Warning: Could not detect offer from path: ${filePath}`);
      allow();
      return;
    }
    const phase = (0, import_offer_state.detectPhaseFromPath)(filePath);
    if (!phase) {
      console.error(`[PHASE-ADVANCE-GATE] Warning: Could not detect phase from file: ${filePath}`);
      allow();
      return;
    }
    const helixStatePath = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "helix-state.yaml");
    if ((0, import_fs.existsSync)(helixStatePath)) {
      const helixContent = (0, import_fs.readFileSync)(helixStatePath, "utf-8");
      const yamlValidation = await (0, import_yaml_validator.validateYAML)(helixContent, "helix-state");
      if (!yamlValidation.valid) {
        const output = {
          decision: "block",
          reason: `BLOQUEADO - helix-state.yaml invalido

Erro: ${yamlValidation.error}

Corrija o arquivo antes de avancar a fase.
${offerPath}/helix-state.yaml`
        };
        console.error(`[PHASE-ADVANCE-GATE] helix-state.yaml validation failed: ${yamlValidation.error}`);
        console.log(JSON.stringify(output));
        process.exit(0);
        return;
      }
    }
    const check = (0, import_offer_state.canWriteHelixPhase)(offerPath, phase);
    if (!check.allowed) {
      block(check.reason || "Ferramentas obrigatorias nao usadas", offerPath, phase, check.missingTools);
      return;
    }
    const offerFullPath = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath);
    const prereqCheck = (0, import_helix_phases.isPhaseUnlocked)(phase, offerFullPath);
    if (!prereqCheck.unlocked) {
      console.error(`[PHASE-ADVANCE-GATE] Phase ${phase} prerequisites not met: ${prereqCheck.missingNames.join(", ")}`);
    }
    (0, import_phase_checklist.generatePhaseReviewChecklist)(offerPath, phase);
    console.error(`[PHASE-ADVANCE-GATE] Phase ${phase} can be written - required tools used`);
    allow();
  } catch (error) {
    console.error(`[PHASE-ADVANCE-GATE] Error: ${error}`);
    allow();
  }
}
main().catch((err) => {
  console.error(`[PHASE-ADVANCE-GATE] Fatal error: ${err}`);
  process.exit(0);
});
