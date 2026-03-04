#!/usr/bin/env node
'use strict';

/**
 * PreCompact Session Digest — Thin Hook Wrapper
 *
 * Captures session intelligence (corrections, decisions, axioms, state)
 * before context compact. Returns additionalContext XML for post-compact injection.
 *
 * Business logic: copy-chief/memory/session-digest-extractor.js
 */

const fs = require('fs');
const path = require('path');

function main() {
  let stdinRaw = '';
  try {
    stdinRaw = fs.readFileSync(0, 'utf8');
  } catch {
    // No stdin — fail-open
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Parse stdin context
  let context = {};
  try {
    if (stdinRaw.trim()) {
      context = JSON.parse(stdinRaw);
    }
  } catch {
    // Malformed JSON — fail-open
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Load extractor
  let SessionDigestExtractor;
  try {
    const modPath = path.join(
      process.env.HOME || '/tmp',
      '.claude', '.aios-core', 'copy-chief', 'memory', 'session-digest-extractor'
    );
    ({ SessionDigestExtractor } = require(modPath));
  } catch (e) {
    // Module not found — fail-open
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Extract digest
  try {
    const extractor = new SessionDigestExtractor();
    const result = extractor.extract(context);

    if (result && result.additionalContext) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          additionalContext: result.additionalContext,
        },
      }));
    } else {
      process.stdout.write(JSON.stringify({}));
    }
  } catch {
    // Any runtime error — fail-open
    process.stdout.write(JSON.stringify({}));
  }
}

main();
