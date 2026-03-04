#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const toolName = input.tool_name;
    if (!["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(toolName)) {
      allow();
      return;
    }
    const filePath = input.tool_input?.file_path || input.tool_input?.path || input.tool_input?.notebook_path || "";
    if (!filePath) {
      allow();
      return;
    }
    let deliverableType = null;
    try {
      const assignmentModule = require((0, import_path.join)(process.env.HOME, ".claude", ".aios-core", "copy-chief", "orchestration", "deliverable-assignment"));
      deliverableType = assignmentModule.getDeliverableType(filePath);
    } catch {
      allow();
      return;
    }
    if (!deliverableType) {
      allow();
      return;
    }
    const setPath = (0, import_path.join)(process.env.HOME, ".claude", "session-state", "active-agents.json");
    let DELIVERABLE_ASSIGNMENT_TABLE;
    try {
      DELIVERABLE_ASSIGNMENT_TABLE = require((0, import_path.join)(process.env.HOME, ".claude", ".aios-core", "copy-chief", "orchestration", "deliverable-assignment")).DELIVERABLE_ASSIGNMENT_TABLE;
    } catch {
      allow();
      return;
    }
    const assignment = DELIVERABLE_ASSIGNMENT_TABLE[deliverableType];
    if (!assignment) {
      allow();
      return;
    }
    let agentSet = {};
    if ((0, import_fs.existsSync)(setPath)) {
      try {
        agentSet = JSON.parse((0, import_fs.readFileSync)(setPath, "utf-8"));
      } catch {
      }
    }
    const expectedPersona = assignment.persona;
    if (agentSet[expectedPersona]) {
      console.error(`[DELEGATION-GATE] OK: ${expectedPersona} is active \u2014 write to production/${deliverableType}/ allowed`);
      allow();
      return;
    }
    const markerPath = (0, import_path.join)(process.env.HOME, ".claude", "session-state", "active-persona.json");
    if ((0, import_fs.existsSync)(markerPath)) {
      try {
        const marker = JSON.parse((0, import_fs.readFileSync)(markerPath, "utf-8"));
        if (marker.persona === expectedPersona) {
          console.error(`[DELEGATION-GATE] OK: ${marker.persona} writing to production/${deliverableType}/ (single marker)`);
          allow();
          return;
        }
      } catch {
      }
    }
    if (Object.keys(agentSet).length === 0) {
      blockNoDelegation(filePath, deliverableType);
    } else {
      const activeList = Object.keys(agentSet).join(", ");
      blockWrongPersona(filePath, deliverableType, activeList, assignment);
    }
  } catch (error) {
    console.error(`[DELEGATION-GATE] Error (fail-open): ${error}`);
    allow();
  }
}
function allow() {
  console.log(JSON.stringify({}));
  process.exit(0);
}
function blockNoDelegation(filePath, deliverableType) {
  let assignment;
  try {
    const { DELIVERABLE_ASSIGNMENT_TABLE } = require((0, import_path.join)(process.env.HOME, ".claude", ".aios-core", "copy-chief", "orchestration", "deliverable-assignment"));
    assignment = DELIVERABLE_ASSIGNMENT_TABLE[deliverableType];
  } catch {
  }
  const persona = assignment?.persona || "unknown";
  const model = assignment?.model || "sonnet";
  const personaCapitalized = persona.charAt(0).toUpperCase() + persona.slice(1);
  const output = {
    decision: "block",
    reason: `BLOQUEADO \u2014 Write em production/${deliverableType}/ requer delegacao para ${personaCapitalized} (@${persona}).

**Arquivo:** ${filePath}
**Principio:** Orchestrador NUNCA faz work direto em production/ (AIOS executor-assignment pattern)

**ACAO \u2014 Use Agent tool com:**
\`\`\`
Agent(
  description: "${personaCapitalized}: produzir ${deliverableType}",
  subagent_type: "general-purpose",
  model: "${model}",
  prompt: "You are ${personaCapitalized} (@${persona}).
    Read ~/.claude/agents/${persona}.md
    TASK: [sua tarefa aqui]
    OFFER: [niche/offer] at ~/copywriting-ecosystem/[niche]/[offer]/
    Write outputs to files. Return YAML summary."
)
\`\`\`

Referencia: AIOS executor-assignment pattern (orchestrador NUNCA faz work direto)`
  };
  console.error(`[DELEGATION-GATE] BLOCKED: No active persona for production/${deliverableType}/ write to ${filePath}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
function blockWrongPersona(filePath, deliverableType, activePersona, assignment) {
  const persona = assignment.persona;
  const model = assignment.model;
  const personaCapitalized = persona.charAt(0).toUpperCase() + persona.slice(1);
  const output = {
    decision: "block",
    reason: `BLOQUEADO \u2014 Persona errada para production/${deliverableType}/.

**Arquivo:** ${filePath}
**Persona ativa:** ${activePersona}
**Persona requerida:** ${personaCapitalized} (@${persona})

production/${deliverableType}/ so pode ser escrito por ${personaCapitalized} (@${persona}).
A persona ativa "${activePersona}" nao tem permissao para este tipo de deliverable.

**ACAO:** Delegue para a persona correta via Agent tool (model: ${model}).`
  };
  console.error(`[DELEGATION-GATE] BLOCKED: Wrong persona ${activePersona} for production/${deliverableType}/ (expected ${persona})`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
main();
