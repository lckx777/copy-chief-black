'use strict';

/**
 * Session Digest Extractor
 *
 * Captures session intelligence before context compact:
 *   - User corrections (wrong → right pairs)
 *   - Decisions made during session
 *   - Axioms declared (always/never rules)
 *   - Active task, agent, offer state
 *   - Pending tasks from planning files
 *
 * Persists digest to ~/.claude/session-digests/session-{timestamp}.yaml
 * Returns XML additionalContext for post-compact injection.
 *
 * PreCompact Session Digest
 *
 * @module session-digest-extractor
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const HOME = process.env.HOME || '/tmp';
const SESSION_STATE_DIR = path.join(HOME, '.claude', 'session-state');
const SESSION_DIGESTS_DIR = path.join(HOME, '.claude', 'session-digests');
const ECOSYSTEM_DIR = path.join(HOME, 'copywriting-ecosystem');

const MAX_DIGESTS = 10;

const CAPS = {
  corrections: 10,
  axioms: 5,
  decisions: 5,
  pendingTasks: 10,
};

// Patterns for detecting user corrections
const CORRECTION_PATTERNS = [
  /^na verdade/i,
  /^não,?\s/i,
  /^actually/i,
  /^errado/i,
  /^correto é/i,
  /^o correto/i,
  /^wrong/i,
  /^correction:/i,
  /^não é isso/i,
  /^o certo/i,
];

// Patterns for detecting axioms
const AXIOM_PATTERNS = [
  /\bsempre\s+\w+/i,
  /\bnunca\s+\w+/i,
  /\balways\s+\w+/i,
  /\bnever\s+\w+/i,
];

// Patterns for detecting decisions
const DECISION_PATTERNS = [
  /^vamos com\b/i,
  /^usa\b/i,
  /^prefiro\b/i,
  /^escolho\b/i,
  /^decidido:/i,
  /^let'?s go with\b/i,
  /^use\b/i,
  /^aprovado/i,
  /^confirma/i,
];

class SessionDigestExtractor {
  constructor(options = {}) {
    this.options = {
      debug: false,
      sessionStateDir: SESSION_STATE_DIR,
      digestsDir: SESSION_DIGESTS_DIR,
      ecosystemDir: ECOSYSTEM_DIR,
      maxDigests: MAX_DIGESTS,
      ...options,
    };
  }

  /**
   * Main entry point. Called by hook with parsed stdin context.
   * Returns { digest, additionalContext } or null on failure.
   */
  extract(context = {}) {
    try {
      const messages = this._extractMessages(context);
      const analysis = this.analyzeConversation(messages);
      const state = this.aggregateState();
      const digest = this.generateDigest(analysis, state, context);
      const additionalContext = this.buildAdditionalContext(digest);

      this._persistDigest(digest);
      this._cleanupOldDigests();
      this._resetContextCounter();

      return { digest, additionalContext };
    } catch (e) {
      this._log(`Extract failed: ${e.message}`);
      return null;
    }
  }

  /**
   * Phase 1: Analyze conversation messages for corrections, axioms, decisions.
   */
  analyzeConversation(messages = []) {
    const corrections = [];
    const axioms = [];
    const decisions = [];
    let activeTask = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role || '';
      const text = this._getMessageText(msg);
      if (!text) continue;

      if (role === 'user') {
        // Detect corrections
        if (corrections.length < CAPS.corrections) {
          for (const pattern of CORRECTION_PATTERNS) {
            if (pattern.test(text.trim())) {
              const prevAssistant = this._findPrevAssistant(messages, i);
              corrections.push({
                wrong: prevAssistant ? this._truncate(prevAssistant, 120) : '(contexto anterior)',
                right: this._truncate(text, 120),
              });
              break;
            }
          }
        }

        // Detect decisions
        if (decisions.length < CAPS.decisions) {
          for (const pattern of DECISION_PATTERNS) {
            if (pattern.test(text.trim())) {
              decisions.push(this._truncate(text, 150));
              break;
            }
          }
        }

        // Track active task (last substantial user request)
        if (text.length > 20) {
          activeTask = this._truncate(text, 200);
        }
      }

      if (role === 'assistant') {
        // Detect axioms in assistant declarations
        if (axioms.length < CAPS.axioms) {
          const sentences = text.split(/[.!?\n]+/);
          for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed.length < 10 || trimmed.length > 200) continue;
            for (const pattern of AXIOM_PATTERNS) {
              if (pattern.test(trimmed)) {
                axioms.push(this._truncate(trimmed, 150));
                break;
              }
            }
            if (axioms.length >= CAPS.axioms) break;
          }
        }
      }
    }

    return { corrections, axioms, decisions, activeTask };
  }

  /**
   * Phase 2: Read state files from disk.
   */
  aggregateState() {
    const state = {
      activeOffer: null,
      currentPhase: null,
      gatesPassed: null,
      filesRead: 0,
      filesWritten: 0,
      contextBracket: null,
      estimatedTokens: 0,
      activeAgent: null,
      pendingTasks: [],
      taskPlanName: null,
    };

    // current-session.json
    try {
      const raw = fs.readFileSync(path.join(this.options.sessionStateDir, 'current-session.json'), 'utf8');
      const session = JSON.parse(raw);
      state.activeOffer = session.activeOffer || null;
      state.currentPhase = session.currentPhase || null;
      state.gatesPassed = session.gatesPassed || null;
      state.filesRead = Array.isArray(session.filesRead) ? session.filesRead.length : 0;
      state.filesWritten = Array.isArray(session.filesWritten) ? session.filesWritten.length : 0;
    } catch { /* fail-open */ }

    // context-counter.json
    try {
      const raw = fs.readFileSync(path.join(this.options.sessionStateDir, 'context-counter.json'), 'utf8');
      const counter = JSON.parse(raw);
      state.contextBracket = counter.bracket || null;
      state.estimatedTokens = counter.estimated_tokens || 0;
    } catch { /* fail-open */ }

    // active-persona.json
    try {
      const raw = fs.readFileSync(path.join(this.options.sessionStateDir, 'active-persona.json'), 'utf8');
      const persona = JSON.parse(raw);
      state.activeAgent = persona.handle || persona.name || null;
    } catch { /* fail-open */ }

    // progress.md — pending tasks
    try {
      const raw = fs.readFileSync(path.join(this.options.ecosystemDir, 'progress.md'), 'utf8');
      const lines = raw.split('\n').slice(0, 30);
      for (const line of lines) {
        if (/^\s*-\s*\[\s*\]/.test(line) && state.pendingTasks.length < CAPS.pendingTasks) {
          state.pendingTasks.push(line.trim());
        }
      }
    } catch { /* fail-open */ }

    // task_plan.md — current task
    try {
      const raw = fs.readFileSync(path.join(this.options.ecosystemDir, 'task_plan.md'), 'utf8');
      const firstLine = raw.split('\n').find(l => l.trim().length > 0);
      if (firstLine) {
        state.taskPlanName = firstLine.replace(/^#+\s*/, '').trim();
      }
    } catch { /* fail-open */ }

    return state;
  }

  /**
   * Phase 3a: Generate structured YAML digest.
   */
  generateDigest(analysis, state, context = {}) {
    const now = new Date();
    const sessionStart = this._getSessionStart();
    const durationMin = sessionStart
      ? Math.round((now.getTime() - new Date(sessionStart).getTime()) / 60000)
      : null;

    return {
      schema_version: '1.0',
      type: 'session_intelligence',
      timestamp: now.toISOString(),
      session_duration_min: durationMin,
      compact_trigger: 'context_limit',
      context_bracket: state.contextBracket || 'UNKNOWN',

      active_task: {
        description: analysis.activeTask || state.taskPlanName || null,
        source: analysis.activeTask ? 'conversation' : 'task_plan.md',
      },

      active_agent: state.activeAgent,
      active_offer: state.activeOffer,
      offer_phase: state.currentPhase,
      gates_passed: state.gatesPassed,

      user_corrections: analysis.corrections,
      decisions: analysis.decisions,
      axioms: analysis.axioms,
      pending_tasks: state.pendingTasks,

      files_context: {
        recently_read: state.filesRead,
        recently_written: state.filesWritten,
      },
    };
  }

  /**
   * Phase 3b: Build XML additionalContext for post-compact injection.
   */
  buildAdditionalContext(digest) {
    const lines = [];
    const bracket = digest.context_bracket || 'UNKNOWN';
    lines.push(`<session-digest trigger="context_limit" bracket="${bracket}">`);

    // Active task
    if (digest.active_task?.description) {
      lines.push(`  <active-task source="${digest.active_task.source}">${this._escXml(digest.active_task.description)}</active-task>`);
    }

    // Active offer
    if (digest.active_offer) {
      const phase = digest.offer_phase ? ` (${digest.offer_phase.toUpperCase()})` : '';
      lines.push(`  <active-offer>${this._escXml(digest.active_offer)}${phase}</active-offer>`);
    }

    // Active agent
    if (digest.active_agent) {
      lines.push(`  <active-agent>${this._escXml(digest.active_agent)}</active-agent>`);
    }

    // User corrections
    if (digest.user_corrections?.length > 0) {
      lines.push('  <user-corrections>');
      for (const c of digest.user_corrections) {
        lines.push(`    <correction wrong="${this._escXml(c.wrong)}" right="${this._escXml(c.right)}" />`);
      }
      lines.push('  </user-corrections>');
    }

    // Decisions
    if (digest.decisions?.length > 0) {
      lines.push('  <decisions>');
      for (const d of digest.decisions) {
        lines.push(`    <decision>${this._escXml(d)}</decision>`);
      }
      lines.push('  </decisions>');
    }

    // Axioms
    if (digest.axioms?.length > 0) {
      lines.push('  <axioms>');
      for (const a of digest.axioms) {
        lines.push(`    <axiom>${this._escXml(a)}</axiom>`);
      }
      lines.push('  </axioms>');
    }

    // Pending tasks
    if (digest.pending_tasks?.length > 0) {
      lines.push(`  <pending-tasks count="${digest.pending_tasks.length}">`);
      for (const t of digest.pending_tasks) {
        lines.push(`    <task>${this._escXml(t)}</task>`);
      }
      lines.push('  </pending-tasks>');
    }

    lines.push('  <context-reset>Context counter reset to FRESH after compact.</context-reset>');
    lines.push('</session-digest>');

    return lines.join('\n');
  }

  // --- Private helpers ---

  _extractMessages(context) {
    // Claude Code PreCompact stdin: { conversation: { messages: [...] }, ... }
    if (context?.conversation?.messages) return context.conversation.messages;
    if (Array.isArray(context?.messages)) return context.messages;
    return [];
  }

  _getMessageText(msg) {
    if (typeof msg.content === 'string') return msg.content;
    if (Array.isArray(msg.content)) {
      return msg.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
    }
    return '';
  }

  _findPrevAssistant(messages, idx) {
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        const text = this._getMessageText(messages[i]);
        if (text) return text;
      }
    }
    return null;
  }

  _truncate(str, max) {
    if (!str) return '';
    const clean = str.replace(/\n+/g, ' ').trim();
    return clean.length > max ? clean.slice(0, max) + '...' : clean;
  }

  _escXml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _getSessionStart() {
    try {
      const raw = fs.readFileSync(path.join(this.options.sessionStateDir, 'current-session.json'), 'utf8');
      return JSON.parse(raw).startedAt || null;
    } catch {
      return null;
    }
  }

  _persistDigest(digest) {
    try {
      fs.mkdirSync(this.options.digestsDir, { recursive: true });
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `session-${ts}.yaml`;
      const filepath = path.join(this.options.digestsDir, filename);
      fs.writeFileSync(filepath, yaml.dump(digest, { lineWidth: 120, noRefs: true }), 'utf8');
      this._log(`Digest saved: ${filepath}`);
    } catch (e) {
      this._log(`Failed to persist digest: ${e.message}`);
    }
  }

  _cleanupOldDigests() {
    try {
      const files = fs.readdirSync(this.options.digestsDir)
        .filter(f => f.startsWith('session-') && f.endsWith('.yaml'))
        .sort()
        .reverse();

      if (files.length > this.options.maxDigests) {
        for (const f of files.slice(this.options.maxDigests)) {
          fs.unlinkSync(path.join(this.options.digestsDir, f));
        }
      }
    } catch { /* fail-open */ }
  }

  _resetContextCounter() {
    try {
      const counterPath = path.join(this.options.sessionStateDir, 'context-counter.json');
      if (!fs.existsSync(counterPath)) return;

      const raw = fs.readFileSync(counterPath, 'utf8');
      const counter = JSON.parse(raw);

      counter.tool_calls = 0;
      counter.estimated_tokens = 0;
      counter.estimated_pct = 0;
      counter.bracket = 'FRESH';
      counter.warnings_emitted = 0;
      counter.last_updated = new Date().toISOString();
      counter.compact_reset = true;

      fs.writeFileSync(counterPath, JSON.stringify(counter, null, 2), 'utf8');
      this._log('Context counter reset to FRESH');
    } catch (e) {
      this._log(`Failed to reset context counter: ${e.message}`);
    }
  }

  _log(message) {
    if (this.options.debug) {
      console.error(`[SessionDigest] ${message}`);
    }
  }
}

module.exports = { SessionDigestExtractor };
