#!/usr/bin/env bun
/**
 * Memory Indexer — YAML/JSON → SQLite + Embeddings
 *
 * Scans 6 memory sources, inserts into memory_entries table,
 * generates embeddings, and stores in memory_vec for semantic search.
 *
 * Sources:
 *   1. agent-episodic    — ~/.claude/agent-memory/{agent}/episodic.yaml
 *   2. technique         — ~/.claude/agent-memory/{agent}/technique-register.yaml
 *   3. offer-episodic    — ~/.claude/memory/episodic/{offer}.yaml
 *   4. narrative         — ~/.claude/memory/narrative/{offer}.yaml
 *   5. gotchas           — ~/.claude/memory/gotchas.json
 *   6. user-decision     — ~/.claude/memory/user-decisions.json
 *
 * Usage: bun run src/indexers/memory-indexer.ts [--full | --incremental]
 */

import { Database } from "bun:sqlite";
import { readFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { getLoadablePath as getVecPath } from "sqlite-vec";
import { EmbeddingService } from "../db/embedding-service.js";

// @ts-ignore — js-yaml types
import yaml from "js-yaml";

const HOME = process.env.HOME || "~";
const DB_DIR = path.join(HOME, ".claude", "plugins", "copywriting-mcp", "data");
const DB_PATH = path.join(DB_DIR, "copywriting.db");
const AGENT_MEMORY_DIR = path.join(HOME, ".claude", "agent-memory");
const MEMORY_DIR = path.join(HOME, ".claude", "memory");

const args = process.argv.slice(2);
const FULL_MODE = args.includes("--full");

// Ensure data directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");

// Load sqlite-vec
try {
  db.loadExtension(getVecPath());
} catch (err) {
  console.error("Warning: sqlite-vec not loaded:", err);
}

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS memory_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    agent_id TEXT,
    offer TEXT,
    niche TEXT,
    content TEXT NOT NULL,
    metadata TEXT,
    source_file TEXT,
    source_hash TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_memory_source ON memory_entries(source);
  CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory_entries(agent_id);
  CREATE INDEX IF NOT EXISTS idx_memory_offer ON memory_entries(offer);
`);

try {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS memory_vec USING vec0(
      entry_id INTEGER PRIMARY KEY,
      embedding float[384]
    );
  `);
} catch (err) {
  console.error("Warning: memory_vec table not created:", err);
}

// Prepared statements
const insertEntryStmt = db.prepare(`
  INSERT OR IGNORE INTO memory_entries (source, agent_id, offer, niche, content, metadata, source_file, source_hash)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const checkHashStmt = db.prepare(`SELECT 1 FROM memory_entries WHERE source_hash = ?`);

const insertVecStmt = db.prepare(`INSERT OR REPLACE INTO memory_vec (entry_id, embedding) VALUES (?, ?)`);

interface PendingEntry {
  id: number;
  content: string;
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function entryExists(hash: string): boolean {
  if (FULL_MODE) return false;
  return checkHashStmt.get(hash) !== null;
}

function insertEntry(
  source: string,
  agentId: string | null,
  offer: string | null,
  niche: string | null,
  content: string,
  metadata: Record<string, any> | null,
  sourceFile: string
): PendingEntry | null {
  const hash = hashContent(content);
  if (entryExists(hash)) return null;

  const result = insertEntryStmt.run(
    source,
    agentId,
    offer,
    niche,
    content,
    metadata ? JSON.stringify(metadata) : null,
    sourceFile,
    hash
  );

  const id = Number(result.lastInsertRowid);
  if (id === 0) return null; // INSERT OR IGNORE — duplicate hash

  return { id, content };
}

function loadYaml(filePath: string): any[] {
  try {
    const raw = readFileSync(filePath, "utf8");
    const data = yaml.load(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function loadJson(filePath: string): any[] {
  try {
    const raw = readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ============================================================
// Source Scanners
// ============================================================

function scanAgentEpisodic(): PendingEntry[] {
  const pending: PendingEntry[] = [];
  if (!existsSync(AGENT_MEMORY_DIR)) return pending;

  const agents = readdirSync(AGENT_MEMORY_DIR).filter(d =>
    statSync(path.join(AGENT_MEMORY_DIR, d)).isDirectory()
  );

  for (const agent of agents) {
    const filePath = path.join(AGENT_MEMORY_DIR, agent, "episodic.yaml");
    const entries = loadYaml(filePath);

    for (const entry of entries) {
      if (!entry.learning) continue;
      const content = [
        entry.learning,
        entry.what_worked && `What worked: ${entry.what_worked}`,
        entry.what_failed && `What failed: ${entry.what_failed}`,
        entry.tags && `Tags: ${entry.tags.join(", ")}`,
      ].filter(Boolean).join("\n");

      const result = insertEntry(
        "agent-episodic",
        agent,
        entry.offer || null,
        entry.niche || null,
        content,
        { score: entry.score, deliverable_type: entry.deliverable_type },
        filePath
      );
      if (result) pending.push(result);
    }
  }

  return pending;
}

function scanTechniqueRegister(): PendingEntry[] {
  const pending: PendingEntry[] = [];
  if (!existsSync(AGENT_MEMORY_DIR)) return pending;

  const agents = readdirSync(AGENT_MEMORY_DIR).filter(d =>
    statSync(path.join(AGENT_MEMORY_DIR, d)).isDirectory()
  );

  for (const agent of agents) {
    const filePath = path.join(AGENT_MEMORY_DIR, agent, "technique-register.yaml");
    const entries = loadYaml(filePath);

    for (const entry of entries) {
      const content = [
        entry.name && `Technique: ${entry.name}`,
        entry.description,
        entry.when_to_use && `When to use: ${entry.when_to_use}`,
      ].filter(Boolean).join("\n");

      if (!content.trim()) continue;

      const result = insertEntry(
        "technique",
        agent,
        entry.offer || null,
        entry.niche || null,
        content,
        { score: entry.score, hit_count: entry.hit_count },
        filePath
      );
      if (result) pending.push(result);
    }
  }

  return pending;
}

function scanOfferEpisodic(): PendingEntry[] {
  const pending: PendingEntry[] = [];
  const episodicDir = path.join(MEMORY_DIR, "episodic");
  if (!existsSync(episodicDir)) return pending;

  const files = readdirSync(episodicDir).filter(f => f.endsWith(".yaml"));
  for (const file of files) {
    const offer = file.replace(".yaml", "");
    const filePath = path.join(episodicDir, file);
    const entries = loadYaml(filePath);

    for (const entry of entries) {
      const content = [
        entry.learning,
        entry.what_worked && `What worked: ${entry.what_worked}`,
        entry.tags && `Tags: ${entry.tags.join(", ")}`,
      ].filter(Boolean).join("\n");

      if (!content.trim()) continue;

      const result = insertEntry(
        "offer-episodic",
        entry.agent || null,
        offer,
        entry.niche || null,
        content,
        { phase: entry.phase, score: entry.score },
        filePath
      );
      if (result) pending.push(result);
    }
  }

  return pending;
}

function scanNarrative(): PendingEntry[] {
  const pending: PendingEntry[] = [];
  const narrativeDir = path.join(MEMORY_DIR, "narrative");
  if (!existsSync(narrativeDir)) return pending;

  const files = readdirSync(narrativeDir).filter(f => f.endsWith(".yaml"));
  for (const file of files) {
    const offer = file.replace(".yaml", "");
    const filePath = path.join(narrativeDir, file);
    const entries = loadYaml(filePath);

    for (const entry of entries) {
      const content = [
        entry.insight,
        entry.evidence && `Evidence: ${entry.evidence}`,
        entry.implication && `Implication: ${entry.implication}`,
      ].filter(Boolean).join("\n");

      if (!content.trim()) continue;

      const result = insertEntry(
        "narrative",
        null,
        offer,
        entry.niche || null,
        content,
        { confidence: entry.confidence },
        filePath
      );
      if (result) pending.push(result);
    }
  }

  return pending;
}

function scanGotchas(): PendingEntry[] {
  const pending: PendingEntry[] = [];
  const filePath = path.join(MEMORY_DIR, "gotchas.json");
  if (!existsSync(filePath)) return pending;

  const entries = loadJson(filePath);
  for (const entry of entries) {
    const content = [
      entry.title && `Gotcha: ${entry.title}`,
      entry.description,
      entry.resolution && `Resolution: ${entry.resolution}`,
    ].filter(Boolean).join("\n");

    if (!content.trim()) continue;

    const result = insertEntry(
      "gotchas",
      entry.agent || null,
      entry.offer || null,
      entry.niche || null,
      content,
      { severity: entry.severity },
      filePath
    );
    if (result) pending.push(result);
  }

  return pending;
}

function scanUserDecisions(): PendingEntry[] {
  const pending: PendingEntry[] = [];
  const filePath = path.join(MEMORY_DIR, "user-decisions.json");
  if (!existsSync(filePath)) return pending;

  const entries = loadJson(filePath);
  for (const entry of entries) {
    const content = entry.text || entry.decision || "";
    if (!content.trim()) continue;

    const result = insertEntry(
      "user-decision",
      null,
      entry.offer || null,
      entry.niche || null,
      content,
      { context: entry.context },
      filePath
    );
    if (result) pending.push(result);
  }

  return pending;
}

// ============================================================
// Embedding + Main
// ============================================================

async function embedBatch(batch: PendingEntry[]): Promise<number> {
  if (batch.length === 0) return 0;
  try {
    const svc = await EmbeddingService.getInstance();
    if (!svc.isReady()) return 0;

    const vectors = await svc.embedTexts(batch.map(b => b.content));
    for (let i = 0; i < batch.length; i++) {
      if (vectors[i]) {
        insertVecStmt.run(batch[i].id, EmbeddingService.serializeVector(vectors[i]));
      }
    }
    return vectors.length;
  } catch (err) {
    console.error("  Embedding batch failed:", err);
    return 0;
  }
}

async function main() {
  console.log("Memory Indexer - Copywriting MCP\n");
  console.log(`Database: ${DB_PATH}`);
  console.log(`Mode: ${FULL_MODE ? "FULL (re-index all)" : "INCREMENTAL (skip existing)"}\n`);

  // If full mode, clear existing entries
  if (FULL_MODE) {
    db.exec("DELETE FROM memory_vec");
    db.exec("DELETE FROM memory_entries");
    console.log("Cleared existing memory entries.\n");
  }

  // Scan all sources
  const scanners = [
    { name: "agent-episodic", fn: scanAgentEpisodic },
    { name: "technique-register", fn: scanTechniqueRegister },
    { name: "offer-episodic", fn: scanOfferEpisodic },
    { name: "narrative", fn: scanNarrative },
    { name: "gotchas", fn: scanGotchas },
    { name: "user-decisions", fn: scanUserDecisions },
  ];

  const allPending: PendingEntry[] = [];

  for (const { name, fn } of scanners) {
    const pending = fn();
    console.log(`  ${name}: ${pending.length} new entries`);
    allPending.push(...pending);
  }

  console.log(`\nTotal new entries: ${allPending.length}`);

  // Generate embeddings in batches
  if (allPending.length > 0) {
    console.log("\nGenerating embeddings...");
    let embedded = 0;
    const BATCH_SIZE = 32;

    for (let i = 0; i < allPending.length; i += BATCH_SIZE) {
      const batch = allPending.slice(i, i + BATCH_SIZE);
      const count = await embedBatch(batch);
      embedded += count;
      if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= allPending.length) {
        console.log(`  Embedded: ${embedded}/${allPending.length}`);
      }
    }

    console.log(`\nEmbeddings generated: ${embedded}`);
  }

  // Stats
  const totalEntries = (db.prepare("SELECT COUNT(*) as c FROM memory_entries").get() as any).c;
  const totalVecs = (db.prepare("SELECT COUNT(*) as c FROM memory_vec").get() as any).c;

  console.log("\n========================================");
  console.log(`Total memory entries: ${totalEntries}`);
  console.log(`Total embeddings: ${totalVecs}`);
  console.log("========================================");

  // Breakdown by source
  const sources = db.prepare(`
    SELECT source, COUNT(*) as count FROM memory_entries GROUP BY source ORDER BY count DESC
  `).all() as Array<{ source: string; count: number }>;

  if (sources.length > 0) {
    console.log("\nBy source:");
    for (const { source, count } of sources) {
      console.log(`  ${source}: ${count}`);
    }
  }

  db.close();
}

main().catch(console.error);
