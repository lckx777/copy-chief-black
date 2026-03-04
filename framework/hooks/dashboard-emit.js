#!/usr/bin/env node
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
var dashboard_emit_exports = {};
__export(dashboard_emit_exports, {
  recordToolStart: () => import_dashboard_client.recordToolStart
});
module.exports = __toCommonJS(dashboard_emit_exports);
var import_fs = require("fs");
var import_dashboard_client = require("../.aios-core/copy-chief/observability/dashboard-client");
async function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    await (0, import_dashboard_client.emitDashboardEvent)(input);
  } catch {
  }
  process.exit(0);
}
main();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  recordToolStart
});
