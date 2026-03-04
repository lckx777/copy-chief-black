#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
const HOME = require("os").homedir();
const SESSION_DIR = (0, import_path.join)(HOME, ".claude/session-state");
const COUNTER_FILE = (0, import_path.join)(SESSION_DIR, "tool-call-counter.json");
const THRESHOLD = 30;
const MAX_EXECUTION_MS = 2e3;
function ensureSessionDir() {
  if (!(0, import_fs.existsSync)(SESSION_DIR)) {
    (0, import_fs.mkdirSync)(SESSION_DIR, { recursive: true });
  }
}
function readCounter() {
  try {
    if ((0, import_fs.existsSync)(COUNTER_FILE)) {
      const content = (0, import_fs.readFileSync)(COUNTER_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (typeof parsed.count === "number" && typeof parsed.last_reminder === "string") {
        return parsed;
      }
    }
  } catch {
  }
  return { count: 0, last_reminder: (/* @__PURE__ */ new Date()).toISOString() };
}
function writeCounter(state) {
  ensureSessionDir();
  (0, import_fs.writeFileSync)(COUNTER_FILE, JSON.stringify(state, null, 2));
}
function main() {
  const timeout = setTimeout(() => {
    process.exit(0);
  }, MAX_EXECUTION_MS);
  try {
    let stdin = "";
    try {
      stdin = (0, import_fs.readFileSync)(0, "utf8");
    } catch {
      clearTimeout(timeout);
      process.exit(0);
      return;
    }
    try {
      const input = JSON.parse(stdin);
      if (!input.tool_name) {
        clearTimeout(timeout);
        process.exit(0);
        return;
      }
    } catch {
      clearTimeout(timeout);
      process.exit(0);
      return;
    }
    const state = readCounter();
    state.count += 1;
    if (state.count >= THRESHOLD) {
      const timeSinceLast = state.last_reminder ? timeDiffDescription(new Date(state.last_reminder), /* @__PURE__ */ new Date()) : "unknown";
      process.stderr.write(
        `
\u{1F9E0} META-PROMPT REMINDER (${THRESHOLD} tool calls desde ultimo check, ${timeSinceLast}):
Pergunte-se:
- O que deveria ter perguntado ao usuario que nao perguntei?
- Que contexto esta faltando para produzir melhor?
- Que suposicoes estou fazendo que deveriam ser validadas?
- Estou seguindo o briefing ou derivei?

Dica: Releia synthesis.md e mecanismo-unico.yaml da oferta ativa.

`
      );
      state.count = 0;
      state.last_reminder = (/* @__PURE__ */ new Date()).toISOString();
    }
    writeCounter(state);
    clearTimeout(timeout);
    process.exit(0);
  } catch (error) {
    try {
      process.stderr.write(`[META-PROMPT] Error: ${error}
`);
    } catch {
    }
    clearTimeout(timeout);
    process.exit(0);
  }
}
function timeDiffDescription(from, to) {
  const diffMs = to.getTime() - from.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "unknown";
  const minutes = Math.floor(diffMs / 6e4);
  if (minutes < 1) return "menos de 1 minuto";
  if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours < 24) {
    return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days} dia${days !== 1 ? "s" : ""}`;
}
main();
