/**
 * L7 Star-Command Layer Processor
 *
 * Detects *command patterns in the user prompt and loads
 * corresponding rules from the .synapse/commands domain file.
 *
 * Command blocks in the domain file are delimited by [*command]
 * headers. Multiple star-commands in a single prompt are supported.
 *
 * @module core/synapse/layers/l7-star-command
 * @version 1.0.0
 * @created Story SYN-5 - Layer Processors L4-L7
 */

const fs = require('fs');
const path = require('path');
const { loadDomainFile } = require('../domain/domain-loader');
const LayerProcessor = require('./layer-processor');

/** Regex to detect star-commands in prompt */
const STAR_COMMAND_REGEX = /\*([a-z][\w-]*)/gi;

/**
 * L7 Star-Command Processor
 *
 * Detects *command patterns in the prompt, loads the commands
 * domain file, and extracts rules for matching command blocks.
 * Returns null if no star-commands detected.
 *
 * @extends LayerProcessor
 */
class L7StarCommandProcessor extends LayerProcessor {
  constructor() {
    super({ name: 'star-command', layer: 7, timeout: 5 });
  }

  /**
   * Detect star-commands and load matching rules.
   *
   * Detection flow:
   * 1. Scan prompt for *command patterns via regex
   * 2. Deduplicate detected commands
   * 3. Load .synapse/commands domain file
   * 4. Parse command blocks delimited by [*command]
   * 5. Collect rules for detected commands
   *
   * @param {object} context
   * @param {string} context.prompt - Current prompt text
   * @param {object} context.session - Session state (SYN-2 schema)
   * @param {object} context.config - Config with synapsePath and manifest
   * @param {object[]} context.previousLayers - Results from previous layers
   * @returns {{ rules: string[], metadata: object } | null}
   */
  process(context) {
    const { prompt, config } = context;
    const { synapsePath } = config;

    if (!prompt) {
      return null;
    }

    // 1. Detect star-commands in prompt
    const commands = this._detectCommands(prompt);
    if (commands.length === 0) {
      return null;
    }

    // 2. Load commands domain file
    const commandsFilePath = path.join(synapsePath, 'commands');
    const rawRules = loadDomainFile(commandsFilePath);

    if (!rawRules || rawRules.length === 0) {
      return null;
    }

    // 3. Parse command blocks from raw rules
    const commandBlocks = this._parseCommandBlocks(rawRules);

    // 4. Collect rules for detected commands
    const allRules = [];
    const matchedCommands = [];

    for (const cmd of commands) {
      const block = commandBlocks[cmd];
      if (block && block.length > 0) {
        allRules.push(...block);
        matchedCommands.push(cmd);
      }
    }

    // 5. For any commands not found in the main file, auto-discover from star-commands/ directory
    const unmatched = commands.filter(cmd => !matchedCommands.includes(cmd));
    for (const cmd of unmatched) {
      const discovered = this._loadStarCommandFile(synapsePath, cmd);
      if (discovered && discovered.length > 0) {
        allRules.push(...discovered);
        matchedCommands.push(cmd);
      }
    }

    if (allRules.length === 0) {
      return null;
    }

    return {
      rules: allRules,
      metadata: {
        layer: 7,
        source: 'star-command',
        commands: matchedCommands,
      },
    };
  }

  /**
   * Detect star-command patterns in prompt text.
   *
   * @param {string} prompt - User prompt text
   * @returns {string[]} Deduplicated list of command names (lowercase)
   * @private
   */
  _detectCommands(prompt) {
    const matches = [];
    let match;

    // Reset regex state
    STAR_COMMAND_REGEX.lastIndex = 0;

    while ((match = STAR_COMMAND_REGEX.exec(prompt)) !== null) {
      matches.push(match[1].toLowerCase());
    }

    return [...new Set(matches)];
  }

  /**
   * Auto-discover and load a star-command from the star-commands/ directory.
   *
   * Looks for a file at {synapsePath}/star-commands/{command}.
   * The file may use [*command] header format or plain text rules.
   *
   * @param {string} synapsePath - Path to the .synapse directory
   * @param {string} command - Command name (lowercase, no asterisk)
   * @returns {string[]|null} Array of rule strings, or null if not found
   * @private
   */
  _loadStarCommandFile(synapsePath, command) {
    const filePath = path.join(synapsePath, 'star-commands', command);
    if (!fs.existsSync(filePath)) return null;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      const rules = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        // Strip [*command] header line itself (keep content after header if any)
        const headerMatch = trimmed.match(/^\[\*([a-z][\w-]*)\][^:]*:?\s*(.*)?$/i);
        if (headerMatch) {
          const afterHeader = (headerMatch[2] || '').trim();
          if (afterHeader) rules.push(afterHeader);
          continue;
        }
        rules.push(trimmed);
      }

      return rules.length > 0 ? rules : null;
    } catch {
      return null;
    }
  }

  /**
   * Parse command blocks from domain file rules.
   *
   * Format:
   * [*command] COMMAND:
   *   0. Rule text here
   *   1. Another rule
   *
   * Each [*command] header starts a new block.
   * Rules within a block are the lines following the header.
   *
   * @param {string[]} rules - Raw rules from loadDomainFile
   * @returns {object} Map of command name -> rule strings
   * @private
   */
  _parseCommandBlocks(rules) {
    const blocks = {};
    let currentCommand = null;

    for (const rule of rules) {
      // Check if this line is a command header: [*command]
      const headerMatch = rule.match(/^\[\*([a-z][\w-]*)\]/i);
      if (headerMatch) {
        currentCommand = headerMatch[1].toLowerCase();
        if (!blocks[currentCommand]) {
          blocks[currentCommand] = [];
        }
        // If there's content after the header on the same line, include it
        const afterHeader = rule.substring(headerMatch[0].length).trim();
        if (afterHeader && !afterHeader.endsWith(':')) {
          blocks[currentCommand].push(afterHeader);
        }
        continue;
      }

      // Add rule to current command block
      if (currentCommand && rule.trim()) {
        blocks[currentCommand].push(rule.trim());
      }
    }

    return blocks;
  }
}

module.exports = L7StarCommandProcessor;
