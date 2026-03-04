#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
var import_doc_rot_scanner = require("../.aios-core/copy-chief/health/doc-rot-scanner");
function runCli() {
  const args = process.argv.slice(2);
  let ecosystemPath = import_doc_rot_scanner.DEFAULT_ECOSYSTEM;
  let scanAll = false;
  let targetOffer = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--all") {
      scanAll = true;
    } else if (args[i] === "--ecosystem-path" && args[i + 1]) {
      ecosystemPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith("-")) {
      targetOffer = args[i];
    }
  }
  if (scanAll) {
    const reports = (0, import_doc_rot_scanner.scanAllOffers)(ecosystemPath);
    for (const report of reports) {
      console.log((0, import_doc_rot_scanner.formatReport)(report));
      (0, import_doc_rot_scanner.saveReport)(report);
    }
    const avg = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.health_score, 0) / reports.length) : 100;
    console.log(`ECOSYSTEM: ${reports.length} offers, avg health ${avg}/100`);
  } else if (targetOffer) {
    const { existsSync } = require("fs");
    let offerPath = targetOffer;
    if (!existsSync(offerPath)) offerPath = (0, import_path.join)(ecosystemPath, targetOffer);
    if (!existsSync(offerPath)) {
      console.error(`Not found: ${targetOffer}`);
      process.exit(1);
    }
    const report = (0, import_doc_rot_scanner.scanOffer)(offerPath);
    console.log((0, import_doc_rot_scanner.formatReport)(report));
    (0, import_doc_rot_scanner.saveReport)(report);
  } else {
    console.log("Usage: bun run doc-rot-detector.ts [offer-path] | --all [--ecosystem-path /path]");
  }
}
async function runHook() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8").trim();
    const input = stdin ? JSON.parse(stdin) : {};
    const result = await (0, import_doc_rot_scanner.processHookEvent)(input);
    for (const w of result.warnings) {
      process.stderr.write(w + "\n");
    }
  } catch {
  }
  process.exit(0);
}
if (process.argv.slice(2).length > 0) {
  runCli();
} else {
  runHook();
}
