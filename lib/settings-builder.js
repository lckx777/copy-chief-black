/**
 * Settings Builder — Generates settings.json from template
 * Resolves placeholders with platform-specific values
 */
'use strict';

const fs = require('fs');
const path = require('path');
const platform = require('./platform');

/**
 * Build settings.json content from template
 * @param {object} opts - Override options
 * @returns {object} Parsed settings object
 */
function buildSettings(opts = {}) {
  const templatePath = opts.template || path.join(__dirname, '..', 'templates', 'settings.json.tpl');
  const raw = fs.readFileSync(templatePath, 'utf8');

  const vars = {
    CLAUDE_HOME: platform.claudeHome(),
    AIOS_CORE: platform.aiosCoreDir(),
    HOOKS_DIR: platform.hooksDir(),
    ECOSYSTEM_ROOT: opts.ecosystemRoot || platform.ecosystemRoot(),
    NODE_BIN: 'node',
    PATH: platform.buildPath(),
  };

  // Replace {{VAR}} placeholders
  let resolved = raw;
  for (const [key, val] of Object.entries(vars)) {
    const escaped = val.replace(/\\/g, '\\\\'); // Escape backslashes for JSON
    resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escaped);
  }

  return JSON.parse(resolved);
}

/**
 * Write settings.json to claude home
 * @param {object} opts
 */
function writeSettings(opts = {}) {
  const settings = buildSettings(opts);
  const target = path.join(platform.claudeHome(), 'settings.json');

  // Merge with existing settings if present
  if (fs.existsSync(target) && !opts.force) {
    const existing = JSON.parse(fs.readFileSync(target, 'utf8'));
    const merged = mergeSettings(existing, settings);
    fs.writeFileSync(target, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    return merged;
  }

  fs.writeFileSync(target, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  return settings;
}

/**
 * Deep merge settings — preserves user customizations
 * Framework keys overwrite, user-added keys preserved
 */
function mergeSettings(existing, incoming) {
  const merged = { ...existing };

  // Always update env
  merged.env = { ...existing.env, ...incoming.env };

  // Merge permissions (additive)
  if (incoming.permissions) {
    merged.permissions = merged.permissions || {};
    for (const key of ['allow', 'deny']) {
      if (incoming.permissions[key]) {
        const existingSet = new Set(merged.permissions[key] || []);
        for (const item of incoming.permissions[key]) existingSet.add(item);
        merged.permissions[key] = [...existingSet];
      }
    }
  }

  // Hooks: replace entire section (framework-managed)
  if (incoming.hooks) {
    merged.hooks = incoming.hooks;
  }

  return merged;
}

/**
 * Validate settings.json structure
 * @returns {Array<string>} List of issues found
 */
function validateSettings(settingsPath) {
  const issues = [];

  if (!fs.existsSync(settingsPath)) {
    issues.push('settings.json not found');
    return issues;
  }

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    issues.push(`settings.json parse error: ${e.message}`);
    return issues;
  }

  // Check required sections
  if (!settings.env) issues.push('Missing env section');
  if (!settings.hooks) issues.push('Missing hooks section');
  if (!settings.permissions) issues.push('Missing permissions section');

  // Check hook commands exist
  if (settings.hooks) {
    for (const [event, matchers] of Object.entries(settings.hooks)) {
      if (!Array.isArray(matchers)) continue;
      for (const matcher of matchers) {
        if (!matcher.hooks || !Array.isArray(matcher.hooks)) continue;
        for (const hook of matcher.hooks) {
          if (!hook.command) continue;
          // Extract file path from command
          const match = hook.command.match(/(?:node|bun run|bash)\s+([\S]+)/);
          if (match) {
            const hookPath = platform.resolvePath(match[1]);
            if (!fs.existsSync(hookPath)) {
              issues.push(`Hook file missing: ${match[1]} (${event})`);
            }
          }
        }
      }
    }
  }

  // Check PATH contains node
  if (settings.env && settings.env.PATH) {
    const hasNode = platform.findExecutable('node');
    if (!hasNode) issues.push('node not found in PATH');
  }

  return issues;
}

/**
 * Build mcp.json from template
 */
function buildMcpJson(opts = {}) {
  const templatePath = path.join(__dirname, '..', 'templates', 'mcp.json.tpl');
  const raw = fs.readFileSync(templatePath, 'utf8');

  const vars = {
    CLAUDE_HOME: platform.claudeHome(),
    ECOSYSTEM_ROOT: opts.ecosystemRoot || platform.ecosystemRoot(),
    NODE_BIN: 'node',
    APIFY_TOKEN: opts.apifyToken || process.env.APIFY_TOKEN || '',
  };

  let resolved = raw;
  for (const [key, val] of Object.entries(vars)) {
    const escaped = (val || '').replace(/\\/g, '\\\\');
    resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escaped);
  }

  return JSON.parse(resolved);
}

/**
 * Write mcp.json to claude home
 */
function writeMcpJson(opts = {}) {
  const mcpConfig = buildMcpJson(opts);
  const target = path.join(platform.claudeHome(), 'mcp.json');

  if (fs.existsSync(target) && !opts.force) {
    // Merge: add new servers, preserve existing
    const existing = JSON.parse(fs.readFileSync(target, 'utf8'));
    existing.mcpServers = { ...existing.mcpServers, ...mcpConfig.mcpServers };
    fs.writeFileSync(target, JSON.stringify(existing, null, 2) + '\n', 'utf8');
    return existing;
  }

  fs.writeFileSync(target, JSON.stringify(mcpConfig, null, 2) + '\n', 'utf8');
  return mcpConfig;
}

module.exports = { buildSettings, writeSettings, mergeSettings, validateSettings, buildMcpJson, writeMcpJson };
