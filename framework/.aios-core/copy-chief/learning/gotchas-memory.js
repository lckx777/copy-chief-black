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
var gotchas_memory_exports = {};
__export(gotchas_memory_exports, {
  GotchasMemory: () => GotchasMemory,
  getActiveGotchas: () => getActiveGotchas,
  getRelevantGotchas: () => getRelevantGotchas,
  recordError: () => recordError
});
module.exports = __toCommonJS(gotchas_memory_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_events = require("events");
const REPEAT_THRESHOLD = 3;
const ERROR_WINDOW_MS = 24 * 60 * 60 * 1e3;
const SCHEMA_VERSION = "aios-gotchas-memory-v1";
const VERSION = "1.0.0";
const CATEGORY_KEYWORDS = {
  build: ["build", "compile", "webpack", "bundle", "typescript", "tsc"],
  test: ["test", "jest", "vitest", "expect", "assert", "coverage"],
  lint: ["lint", "eslint", "prettier", "format", "indentation"],
  runtime: ["runtime", "TypeError", "ReferenceError", "null", "undefined", "crash"],
  integration: ["api", "http", "fetch", "cors", "database", "postgres"],
  security: ["security", "xss", "csrf", "injection", "auth", "token"],
  general: []
};
class GotchasMemory extends import_events.EventEmitter {
  rootPath;
  gotchasJsonPath;
  gotchasMdPath;
  errorTrackingPath;
  repeatThreshold;
  quiet;
  gotchas;
  errorTracking;
  constructor(rootPath, options = {}) {
    super();
    this.rootPath = rootPath || process.cwd();
    this.repeatThreshold = options.repeatThreshold ?? REPEAT_THRESHOLD;
    this.quiet = options.quiet ?? false;
    this.gotchasJsonPath = (0, import_path.join)(this.rootPath, ".aios", "gotchas.json");
    this.gotchasMdPath = (0, import_path.join)(this.rootPath, ".aios", "gotchas.md");
    this.errorTrackingPath = (0, import_path.join)(this.rootPath, ".aios", "error-tracking.json");
    this.gotchas = /* @__PURE__ */ new Map();
    this.errorTracking = /* @__PURE__ */ new Map();
    this._loadGotchas();
    this._loadErrorTracking();
  }
  // ─── Public API ─────────────────────────────────────────────────────────────
  addGotcha(data) {
    const gotcha = this._createGotcha(data, "manual");
    this.gotchas.set(gotcha.id, gotcha);
    this._saveGotchas();
    this.emit("gotcha_added", gotcha);
    return gotcha;
  }
  trackError(errorData) {
    const errorHash = this._hashError(errorData);
    const now = Date.now();
    let tracking = this.errorTracking.get(errorHash);
    if (!tracking) {
      tracking = {
        count: 0,
        firstSeen: now,
        lastSeen: now,
        samples: [],
        errorPattern: errorData.message,
        category: this._detectCategory(errorData.message + " " + (errorData.stack || ""))
      };
    }
    tracking.count++;
    tracking.lastSeen = now;
    if (tracking.samples.length < 5) {
      tracking.samples.push({
        timestamp: new Date(now).toISOString(),
        file: errorData.file,
        context: errorData.context
      });
    }
    this.errorTracking.set(errorHash, tracking);
    this._saveErrorTracking();
    this.emit("error_tracked", { errorHash, tracking });
    if (tracking.count >= this.repeatThreshold) {
      const existing = this._findGotchaByErrorPattern(errorData.message);
      if (!existing) {
        return this._autoCaptureGotcha(errorData, tracking);
      }
    }
    return null;
  }
  listGotchas(options = {}) {
    let list = [...this.gotchas.values()];
    if (options.category) list = list.filter((g) => g.category === options.category);
    if (options.severity) list = list.filter((g) => g.severity === options.severity);
    if (options.unresolved) list = list.filter((g) => !g.resolved);
    const order = { critical: 0, warning: 1, info: 2 };
    list.sort((a, b) => {
      const diff = (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
      if (diff !== 0) return diff;
      return new Date(b.source.lastSeen).getTime() - new Date(a.source.lastSeen).getTime();
    });
    return list;
  }
  getContextForTask(taskDescription, relatedFiles = []) {
    const descLower = taskDescription.toLowerCase();
    const filePaths = relatedFiles.map((f) => f.toLowerCase());
    const scored = [];
    for (const gotcha of this.gotchas.values()) {
      if (gotcha.resolved) continue;
      let score = 0;
      if (gotcha.category === this._detectCategory(taskDescription)) score += 3;
      const keywords = this._extractKeywords(`${gotcha.title} ${gotcha.description} ${gotcha.workaround || ""}`);
      for (const kw of keywords) {
        if (descLower.includes(kw)) score += 1;
      }
      for (const gf of gotcha.relatedFiles || []) {
        for (const tf of filePaths) {
          if (tf.includes(gf.toLowerCase()) || gf.toLowerCase().includes(tf)) score += 2;
        }
      }
      if (gotcha.trigger?.errorPattern && descLower.includes(gotcha.trigger.errorPattern.toLowerCase())) {
        score += 5;
      }
      if (score > 0) scored.push({ ...gotcha, relevanceScore: score });
    }
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.slice(0, 5);
  }
  formatForPrompt(gotchas) {
    if (!gotchas || gotchas.length === 0) return "";
    let out = "\n## Known Gotchas (Review Before Proceeding)\n\n";
    for (const g of gotchas) {
      const icon = { critical: "[CRITICAL]", warning: "[WARNING]", info: "[INFO]" }[g.severity] || "[INFO]";
      out += `### ${icon} ${g.title}
${g.description}
`;
      if (g.workaround) out += `
**Workaround:** ${g.workaround}
`;
      if (g.relatedFiles?.length) out += `**Related Files:** ${g.relatedFiles.join(", ")}
`;
      out += "\n";
    }
    return out;
  }
  resolveGotcha(gotchaId, resolvedBy = "manual") {
    const gotcha = this.gotchas.get(gotchaId);
    if (!gotcha) return null;
    gotcha.resolved = true;
    gotcha.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
    gotcha.resolvedBy = resolvedBy;
    this._saveGotchas();
    this.emit("gotcha_resolved", gotcha);
    return gotcha;
  }
  removeGotcha(gotchaId) {
    const gotcha = this.gotchas.get(gotchaId);
    if (!gotcha) return false;
    this.gotchas.delete(gotchaId);
    this._saveGotchas();
    this.emit("gotcha_removed", gotcha);
    return true;
  }
  search(query) {
    const q = query.toLowerCase();
    return [...this.gotchas.values()].filter((g) => {
      const text = [g.id, g.title, g.description, g.workaround || "", g.category, ...g.relatedFiles || []].join(" ").toLowerCase();
      return text.includes(q);
    });
  }
  getStatistics() {
    const list = [...this.gotchas.values()];
    const byCategory = {};
    const bySeverity = { critical: 0, warning: 0, info: 0 };
    const bySource = { manual: 0, auto_detected: 0 };
    for (const g of list) {
      byCategory[g.category] = (byCategory[g.category] || 0) + 1;
      bySeverity[g.severity] = (bySeverity[g.severity] || 0) + 1;
      bySource[g.source.type] = (bySource[g.source.type] || 0) + 1;
    }
    return {
      totalGotchas: list.length,
      resolved: list.filter((g) => g.resolved).length,
      unresolved: list.filter((g) => !g.resolved).length,
      byCategory,
      bySeverity,
      bySource,
      trackedErrors: this.errorTracking.size,
      pendingAutoCapture: [...this.errorTracking.values()].filter((t) => t.count >= this.repeatThreshold - 1 && t.count < this.repeatThreshold).length
    };
  }
  toJSON() {
    return {
      schema: SCHEMA_VERSION,
      version: VERSION,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      statistics: this.getStatistics(),
      gotchas: [...this.gotchas.values()]
    };
  }
  toMarkdown() {
    const stats = this.getStatistics();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const cats = Object.keys(CATEGORY_KEYWORDS);
    let md = `# Known Gotchas

> Last updated: ${now}
> Total: ${stats.totalGotchas} (${stats.unresolved} unresolved)

---

`;
    for (const cat of cats) {
      const items = this.listGotchas({ category: cat });
      if (!items.length) continue;
      md += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}

`;
      for (const g of items) {
        const icon = { critical: "**[CRITICAL]**", warning: "**[WARNING]**", info: "[INFO]" }[g.severity] || "";
        md += `### ${g.title}

${icon}${g.resolved ? " (RESOLVED)" : ""}

${g.description}

`;
        if (g.workaround) md += `**Workaround:** ${g.workaround}

`;
        if (g.relatedFiles?.length) md += `**Related Files:** ${g.relatedFiles.join(", ")}

`;
        md += `**Source:** ${g.source.type} (${g.source.occurrences} occurrences)
**First Seen:** ${g.source.firstSeen}

---

`;
      }
    }
    md += `---

## Statistics

| Metric | Value |
|--------|-------|
| Total | ${stats.totalGotchas} |
| Unresolved | ${stats.unresolved} |
| Critical | ${stats.bySeverity.critical} |
| Warning | ${stats.bySeverity.warning} |
| Info | ${stats.bySeverity.info} |

*Generated by GotchasMemory v${VERSION}*
`;
    return md;
  }
  save() {
    this._saveGotchas();
    this._saveErrorTracking();
  }
  // ─── Private Helpers ─────────────────────────────────────────────────────────
  _createGotcha(data, sourceType) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const category = data.category || this._detectCategory(`${data.title || ""} ${data.description || ""}`);
    return {
      id: data.id || this._generateId(),
      title: data.title || "Untitled Gotcha",
      description: data.description || "",
      category,
      severity: this._normalizeSeverity(data.severity),
      workaround: data.workaround || null,
      relatedFiles: data.relatedFiles || [],
      trigger: data.trigger || null,
      source: {
        type: sourceType,
        occurrences: data.occurrences || 1,
        firstSeen: data.firstSeen || now,
        lastSeen: data.lastSeen || now
      },
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: now
    };
  }
  _autoCaptureGotcha(errorData, tracking) {
    const gotcha = this._createGotcha({
      title: this._generateTitleFromError(errorData.message),
      description: errorData.message,
      category: tracking.category,
      severity: "warning",
      relatedFiles: tracking.samples.filter((s) => s.file).map((s) => s.file).filter((f, i, arr) => arr.indexOf(f) === i),
      trigger: { errorPattern: this._extractErrorPattern(errorData.message), files: tracking.samples.map((s) => s.file).filter(Boolean) },
      occurrences: tracking.count,
      firstSeen: new Date(tracking.firstSeen).toISOString(),
      lastSeen: new Date(tracking.lastSeen).toISOString()
    }, "auto_detected");
    this.gotchas.set(gotcha.id, gotcha);
    this._saveGotchas();
    this.emit("auto_captured", gotcha);
    return gotcha;
  }
  _findGotchaByErrorPattern(msg) {
    const pattern = this._extractErrorPattern(msg);
    for (const g of this.gotchas.values()) {
      if (g.trigger?.errorPattern === pattern) return g;
      if (g.description?.includes(msg.substring(0, 50))) return g;
    }
    return null;
  }
  _generateTitleFromError(msg) {
    const first = msg.split("\n")[0].replace(/at .+/, "").replace(/Error:?\s*/i, "").trim();
    return first.length > 60 ? first.substring(0, 57) + "..." : first || "Repeated Error";
  }
  _extractErrorPattern(msg) {
    return msg.split("\n")[0].replace(/\d+/g, "N").replace(/["'].*?["']/g, '"X"').replace(/`.*?`/g, "`X`").substring(0, 100);
  }
  _hashError(errorData) {
    const pattern = this._extractErrorPattern(errorData.message);
    let hash = 0;
    for (let i = 0; i < pattern.length; i++) {
      hash = (hash << 5) - hash + pattern.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  _detectCategory(text) {
    const lower = text.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (cat === "general") continue;
      for (const kw of keywords) {
        if (lower.includes(kw.toLowerCase())) return cat;
      }
    }
    return "general";
  }
  _normalizeSeverity(s) {
    if (!s) return "warning";
    const lower = s.toLowerCase();
    if (lower === "critical" || lower === "high" || lower === "error") return "critical";
    if (lower === "info" || lower === "low") return "info";
    return "warning";
  }
  _extractKeywords(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3);
  }
  _generateId() {
    return `gotcha-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  }
  _ensureDir(filePath) {
    const dir = (0, import_path.dirname)(filePath);
    if (!(0, import_fs.existsSync)(dir)) (0, import_fs.mkdirSync)(dir, { recursive: true });
  }
  _loadGotchas() {
    try {
      if (!(0, import_fs.existsSync)(this.gotchasJsonPath)) return;
      const data = JSON.parse((0, import_fs.readFileSync)(this.gotchasJsonPath, "utf-8"));
      if (Array.isArray(data.gotchas)) {
        for (const g of data.gotchas) this.gotchas.set(g.id, g);
      }
    } catch {
    }
  }
  _saveGotchas() {
    try {
      this._ensureDir(this.gotchasJsonPath);
      (0, import_fs.writeFileSync)(this.gotchasJsonPath, JSON.stringify(this.toJSON(), null, 2), "utf-8");
      (0, import_fs.writeFileSync)(this.gotchasMdPath, this.toMarkdown(), "utf-8");
    } catch {
    }
  }
  _loadErrorTracking() {
    try {
      if (!(0, import_fs.existsSync)(this.errorTrackingPath)) return;
      const data = JSON.parse((0, import_fs.readFileSync)(this.errorTrackingPath, "utf-8"));
      if (data.errors && typeof data.errors === "object") {
        for (const [hash, tracking] of Object.entries(data.errors)) {
          this.errorTracking.set(hash, tracking);
        }
      }
    } catch {
    }
  }
  _saveErrorTracking() {
    try {
      this._ensureDir(this.errorTrackingPath);
      (0, import_fs.writeFileSync)(this.errorTrackingPath, JSON.stringify({ version: VERSION, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), errors: Object.fromEntries(this.errorTracking) }, null, 2), "utf-8");
    } catch {
    }
  }
}
const MEMORY_ROOT = (0, import_path.join)(process.env.HOME || "/tmp", ".claude", "memory");
let _singleton = null;
function getInstance() {
  if (!_singleton) _singleton = new GotchasMemory(MEMORY_ROOT, { quiet: true });
  return _singleton;
}
function recordError(tool, error, context) {
  return getInstance().trackError({ message: `[${tool}] ${error}`, context, file: tool });
}
function getActiveGotchas() {
  const inst = getInstance();
  return Array.from(inst.gotchas.values()).filter((g) => g.status === "active");
}
function getRelevantGotchas(taskDesc, files = []) {
  return getInstance().getContextForTask(taskDesc, files);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GotchasMemory,
  getActiveGotchas,
  getRelevantGotchas,
  recordError
});
