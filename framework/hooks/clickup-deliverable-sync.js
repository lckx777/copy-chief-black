#!/usr/bin/env node
var import_fs = require("fs");
var import_clickup_client = require("../.aios-core/copy-chief/integrations/clickup-client");
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (!["Write", "Edit"].includes(input.tool_name)) {
      process.exit(0);
      return;
    }
    const filePath = (0, import_clickup_client.extractFilePath)(input.tool_input);
    if (!filePath || !(0, import_clickup_client.isProductionFile)(filePath)) {
      process.exit(0);
      return;
    }
    const offerPath = (0, import_clickup_client.extractOfferFromPath)(filePath);
    if (!offerPath) {
      process.exit(0);
      return;
    }
    const syncConfig = (0, import_clickup_client.loadSyncConfig)(offerPath);
    if (!syncConfig) {
      process.exit(0);
      return;
    }
    const deliverableType = (0, import_clickup_client.extractDeliverableType)(filePath);
    if (!deliverableType) {
      process.exit(0);
      return;
    }
    (0, import_clickup_client.syncDeliverableWrite)(offerPath, syncConfig, deliverableType, filePath);
  } catch (error) {
    console.error(`[CLICKUP-DELIVERABLE] Error: ${error}`);
    process.exit(0);
  }
}
main();
