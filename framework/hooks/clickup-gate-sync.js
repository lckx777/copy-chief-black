#!/usr/bin/env node
var import_fs = require("fs");
var import_clickup_client = require("../.aios-core/copy-chief/integrations/clickup-client");
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (!import_clickup_client.GATE_TOOLS.includes(input.tool_name)) {
      process.exit(0);
      return;
    }
    const offerPath = (0, import_clickup_client.extractOfferPath)(input.tool_input);
    if (!offerPath) {
      process.exit(0);
      return;
    }
    const syncConfig = (0, import_clickup_client.loadSyncConfig)(offerPath);
    if (!syncConfig) {
      process.exit(0);
      return;
    }
    const gateResult = (0, import_clickup_client.extractGateResult)(input.tool_output);
    if (!gateResult) {
      process.exit(0);
      return;
    }
    (0, import_clickup_client.syncGateResult)(offerPath, syncConfig, gateResult);
  } catch (error) {
    console.error(`[CLICKUP-SYNC] Error: ${error}`);
    process.exit(0);
  }
}
main();
