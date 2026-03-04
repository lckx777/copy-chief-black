#!/usr/bin/env node
var import_template_validator = require("../.aios-core/copy-chief/quality/template-validator");
const MAX_EXECUTION_MS = 2e3;
const startTime = Date.now();
async function main() {
  let input;
  try {
    input = JSON.parse(require("fs").readFileSync(0, "utf8"));
  } catch {
    return;
  }
  if (Date.now() - startTime > MAX_EXECUTION_MS) return;
  const result = (0, import_template_validator.runTemplateValidation)(input);
  if (result?.warningMessage) {
    console.error(result.warningMessage);
  }
  const elapsed = Date.now() - startTime;
  if (elapsed > 1e3) {
    console.error(`  \u23F1  template-header-validation took ${elapsed}ms (target: <${MAX_EXECUTION_MS}ms)`);
  }
}
main().catch(() => {
});
