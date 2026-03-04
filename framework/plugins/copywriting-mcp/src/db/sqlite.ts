/**
 * SQLite Database Module (Bun Native)
 *
 * Uses bun:sqlite instead of better-sqlite3 for compatibility.
 *
 * Storage local para:
 * - VOC quotes (com embeddings)
 * - Swipes library
 * - Competitor intel
 * - Validation history
 */

import { Database } from "bun:sqlite";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { getLoadablePath as getVecPath } from "sqlite-vec";

const DB_DIR = path.join(process.env.HOME || "~", ".claude", "plugins", "copywriting-mcp", "data");
const DB_PATH = path.join(DB_DIR, "copywriting.db");

let db: Database | null = null;

/**
 * Initialize database with all required tables
 */
export async function initDatabase(): Promise<void> {
  // Ensure data directory exists
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Enable WAL mode for better performance
  db.exec("PRAGMA journal_mode = WAL");

  // Load sqlite-vec extension
  try {
    db.loadExtension(getVecPath());
    console.error("sqlite-vec extension loaded");
  } catch (err) {
    console.error("Warning: sqlite-vec extension failed to load:", err);
  }

  // Create tables
  db.exec(`
    -- VOC Quotes Storage
    CREATE TABLE IF NOT EXISTS voc_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id TEXT NOT NULL,
      nicho TEXT NOT NULL,
      platform TEXT NOT NULL,
      quote TEXT NOT NULL,
      username TEXT,
      emotion TEXT,
      intensity INTEGER CHECK(intensity >= 1 AND intensity <= 5),
      engagement_metrics TEXT,
      embedding BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_accessed DATETIME,
      stability REAL DEFAULT 1.0,
      difficulty REAL DEFAULT 0.5,
      next_review DATETIME
    );

    -- Swipe Library
    CREATE TABLE IF NOT EXISTS swipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      nicho TEXT NOT NULL,
      angle TEXT,
      format TEXT,
      content TEXT NOT NULL,
      source TEXT,
      performance_notes TEXT,
      embedding BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      stability REAL DEFAULT 1.0
    );

    -- Competitor Intelligence
    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_name TEXT NOT NULL,
      page_id TEXT,
      nicho TEXT NOT NULL,
      scale_score REAL,
      ads_count INTEGER,
      funnel_type TEXT,
      mechanism TEXT,
      top_hooks TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(page_id, nicho)
    );

    -- Copy Validation History
    CREATE TABLE IF NOT EXISTS validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id TEXT NOT NULL,
      copy_type TEXT NOT NULL,
      chapter TEXT,
      rmbc_score REAL,
      emotion_score REAL,
      logic_score REAL,
      genericidade_score REAL,
      visceral_score REAL,
      scroll_stop_score REAL,
      prova_social_score REAL,
      verdict TEXT,
      objections TEXT,
      improvements TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- HELIX Phase Progress
    CREATE TABLE IF NOT EXISTS helix_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id TEXT NOT NULL,
      phase INTEGER NOT NULL CHECK(phase >= 1 AND phase <= 10),
      status TEXT DEFAULT 'pending',
      output_file TEXT,
      notes TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      UNIQUE(offer_id, phase)
    );

    -- Session State
    CREATE TABLE IF NOT EXISTS session_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      offer_id TEXT,
      current_phase INTEGER,
      last_action TEXT,
      context_snapshot TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_voc_nicho ON voc_quotes(nicho);
    CREATE INDEX IF NOT EXISTS idx_voc_emotion ON voc_quotes(emotion);
    CREATE INDEX IF NOT EXISTS idx_voc_intensity ON voc_quotes(intensity);
    CREATE INDEX IF NOT EXISTS idx_swipes_category ON swipes(category);
    CREATE INDEX IF NOT EXISTS idx_swipes_nicho ON swipes(nicho);
    CREATE INDEX IF NOT EXISTS idx_competitors_nicho ON competitors(nicho);
    CREATE INDEX IF NOT EXISTS idx_validations_offer ON validations(offer_id);
    CREATE INDEX IF NOT EXISTS idx_helix_offer ON helix_progress(offer_id);
  `);

  // Semantic memory tables
  db.exec(`
    -- Memory entries for semantic search
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

  // Vec0 virtual tables (only if sqlite-vec loaded)
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memory_vec USING vec0(
        entry_id INTEGER PRIMARY KEY,
        embedding float[384]
      );
    `);
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS voc_vec USING vec0(
        quote_id INTEGER PRIMARY KEY,
        embedding float[384]
      );
    `);
    console.error("vec0 virtual tables ready");
  } catch (err) {
    console.error("Warning: vec0 tables not created (sqlite-vec may not be loaded):", err);
  }

  console.error(`Database initialized at ${DB_PATH}`);
}

/**
 * Get database instance
 */
export function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// VOC Operations
export interface VocQuote {
  id?: number;
  offer_id: string;
  nicho: string;
  platform: string;
  quote: string;
  username?: string;
  emotion?: string;
  intensity?: number;
  engagement_metrics?: Record<string, any>;
  embedding?: Uint8Array;
}

export function insertVocQuote(quote: VocQuote): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO voc_quotes (offer_id, nicho, platform, quote, username, emotion, intensity, engagement_metrics, embedding)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    quote.offer_id,
    quote.nicho,
    quote.platform,
    quote.quote,
    quote.username || null,
    quote.emotion || null,
    quote.intensity || null,
    quote.engagement_metrics ? JSON.stringify(quote.engagement_metrics) : null,
    quote.embedding || null
  );

  return Number(result.lastInsertRowid);
}

export function searchVocByKeyword(keyword: string, nicho?: string, limit = 50): VocQuote[] {
  const db = getDb();
  let query = `SELECT * FROM voc_quotes WHERE quote LIKE ?`;
  const params: any[] = [`%${keyword}%`];

  if (nicho) {
    query += ` AND nicho = ?`;
    params.push(nicho);
  }

  query += ` ORDER BY intensity DESC, created_at DESC LIMIT ?`;
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params) as VocQuote[];
}

export function searchVocByEmotion(emotion: string, nicho?: string, minIntensity = 3, limit = 50): VocQuote[] {
  const db = getDb();
  let query = `SELECT * FROM voc_quotes WHERE emotion = ? AND intensity >= ?`;
  const params: any[] = [emotion, minIntensity];

  if (nicho) {
    query += ` AND nicho = ?`;
    params.push(nicho);
  }

  query += ` ORDER BY intensity DESC, created_at DESC LIMIT ?`;
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params) as VocQuote[];
}

// Competitor Operations
export interface Competitor {
  id?: number;
  page_name: string;
  page_id?: string;
  nicho: string;
  scale_score?: number;
  ads_count?: number;
  funnel_type?: string;
  mechanism?: string;
  top_hooks?: string[];
}

export function upsertCompetitor(competitor: Competitor): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO competitors (page_name, page_id, nicho, scale_score, ads_count, funnel_type, mechanism, top_hooks, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(page_id, nicho) DO UPDATE SET
      page_name = excluded.page_name,
      scale_score = excluded.scale_score,
      ads_count = excluded.ads_count,
      funnel_type = excluded.funnel_type,
      mechanism = excluded.mechanism,
      top_hooks = excluded.top_hooks,
      last_updated = CURRENT_TIMESTAMP
  `);

  stmt.run(
    competitor.page_name,
    competitor.page_id || null,
    competitor.nicho,
    competitor.scale_score || null,
    competitor.ads_count || null,
    competitor.funnel_type || null,
    competitor.mechanism || null,
    competitor.top_hooks ? JSON.stringify(competitor.top_hooks) : null
  );
}

export function getTopCompetitors(nicho: string, limit = 10): Competitor[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM competitors
    WHERE nicho = ?
    ORDER BY scale_score DESC
    LIMIT ?
  `);

  return stmt.all(nicho, limit) as Competitor[];
}

// Validation History
export interface ValidationRecord {
  offer_id: string;
  copy_type: string;
  chapter?: string;
  rmbc_score?: number;
  emotion_score?: number;
  logic_score?: number;
  genericidade_score?: number;
  visceral_score?: number;
  scroll_stop_score?: number;
  prova_social_score?: number;
  verdict: string;
  objections?: string[];
  improvements?: string[];
}

export function insertValidation(record: ValidationRecord): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO validations (
      offer_id, copy_type, chapter,
      rmbc_score, emotion_score, logic_score,
      genericidade_score, visceral_score, scroll_stop_score, prova_social_score,
      verdict, objections, improvements
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    record.offer_id,
    record.copy_type,
    record.chapter || null,
    record.rmbc_score || null,
    record.emotion_score || null,
    record.logic_score || null,
    record.genericidade_score || null,
    record.visceral_score || null,
    record.scroll_stop_score || null,
    record.prova_social_score || null,
    record.verdict,
    record.objections ? JSON.stringify(record.objections) : null,
    record.improvements ? JSON.stringify(record.improvements) : null
  );

  return Number(result.lastInsertRowid);
}

export function getValidationHistory(offer_id: string, copy_type?: string): ValidationRecord[] {
  const db = getDb();
  let query = `SELECT * FROM validations WHERE offer_id = ?`;
  const params: any[] = [offer_id];

  if (copy_type) {
    query += ` AND copy_type = ?`;
    params.push(copy_type);
  }

  query += ` ORDER BY created_at DESC`;

  const stmt = db.prepare(query);
  return stmt.all(...params) as ValidationRecord[];
}

// HELIX Progress
export interface HelixProgress {
  offer_id: string;
  phase: number;
  status: "pending" | "in_progress" | "completed";
  output_file?: string;
  notes?: string;
}

export function updateHelixProgress(progress: HelixProgress): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO helix_progress (offer_id, phase, status, output_file, notes, started_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(offer_id, phase) DO UPDATE SET
      status = excluded.status,
      output_file = excluded.output_file,
      notes = excluded.notes,
      completed_at = CASE WHEN excluded.status = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
  `);

  stmt.run(
    progress.offer_id,
    progress.phase,
    progress.status,
    progress.output_file || null,
    progress.notes || null
  );
}

export function getHelixProgress(offer_id: string): HelixProgress[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM helix_progress
    WHERE offer_id = ?
    ORDER BY phase ASC
  `);

  return stmt.all(offer_id) as HelixProgress[];
}

export function getCurrentPhase(offer_id: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT MAX(phase) as current_phase
    FROM helix_progress
    WHERE offer_id = ? AND status = 'completed'
  `);

  const result = stmt.get(offer_id) as { current_phase: number | null } | null;
  return (result?.current_phase || 0) + 1;
}

// ============================================================
// Memory Entries (Semantic Memory)
// ============================================================

export type MemorySource = 'agent-episodic' | 'offer-episodic' | 'narrative' | 'technique' | 'gotchas' | 'user-decision';

export interface MemoryEntry {
  id?: number;
  source: MemorySource;
  agent_id?: string;
  offer?: string;
  niche?: string;
  content: string;
  metadata?: Record<string, any>;
  source_file?: string;
  source_hash?: string;
  created_at?: string;
}

export function insertMemoryEntry(entry: MemoryEntry): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO memory_entries (source, agent_id, offer, niche, content, metadata, source_file, source_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    entry.source,
    entry.agent_id || null,
    entry.offer || null,
    entry.niche || null,
    entry.content,
    entry.metadata ? JSON.stringify(entry.metadata) : null,
    entry.source_file || null,
    entry.source_hash || null
  );

  return Number(result.lastInsertRowid);
}

export function getMemoryEntry(id: number): MemoryEntry | null {
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM memory_entries WHERE id = ?`);
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  };
}

export function memoryEntryExists(sourceHash: string): boolean {
  const db = getDb();
  const stmt = db.prepare(`SELECT 1 FROM memory_entries WHERE source_hash = ?`);
  return stmt.get(sourceHash) !== null;
}

export function getMemoryEntriesByIds(ids: number[]): MemoryEntry[] {
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const stmt = db.prepare(`SELECT * FROM memory_entries WHERE id IN (${placeholders})`);
  const rows = stmt.all(...ids) as any[];
  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

// ============================================================
// Vector Operations
// ============================================================

export function insertMemoryVector(entryId: number, embedding: Buffer): void {
  const db = getDb();
  const stmt = db.prepare(`INSERT OR REPLACE INTO memory_vec (entry_id, embedding) VALUES (?, ?)`);
  stmt.run(entryId, embedding);
}

export function insertVocVector(quoteId: number, embedding: Buffer): void {
  const db = getDb();
  const stmt = db.prepare(`INSERT OR REPLACE INTO voc_vec (quote_id, embedding) VALUES (?, ?)`);
  stmt.run(quoteId, embedding);
}

export function searchMemoryVec(queryVec: Buffer, limit: number): Array<{ entry_id: number; distance: number }> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT entry_id, distance
    FROM memory_vec
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
  `);
  return stmt.all(queryVec, limit) as Array<{ entry_id: number; distance: number }>;
}

export function searchVocVec(queryVec: Buffer, limit: number): Array<{ quote_id: number; distance: number }> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT quote_id, distance
    FROM voc_vec
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
  `);
  return stmt.all(queryVec, limit) as Array<{ quote_id: number; distance: number }>;
}

export function searchMemoryVecFiltered(
  queryVec: Buffer,
  limit: number,
  filters: { agent_id?: string; offer?: string; niche?: string; source?: string }
): Array<MemoryEntry & { distance: number; similarity: number }> {
  const db = getDb();

  // Over-fetch from vec0, then filter via JOIN with memory_entries
  const overFetch = limit * 3;
  const conditions: string[] = [];
  const filterParams: any[] = [];

  if (filters.agent_id) { conditions.push("m.agent_id = ?"); filterParams.push(filters.agent_id); }
  if (filters.offer) { conditions.push("m.offer = ?"); filterParams.push(filters.offer); }
  if (filters.niche) { conditions.push("m.niche = ?"); filterParams.push(filters.niche); }
  if (filters.source) { conditions.push("m.source = ?"); filterParams.push(filters.source); }

  // vec0 MATCH must be in subquery, then filter+limit on the outer join
  const sql = `
    SELECT m.*, sub.distance
    FROM (
      SELECT entry_id, distance
      FROM memory_vec
      WHERE embedding MATCH ?
      ORDER BY distance
      LIMIT ?
    ) sub
    JOIN memory_entries m ON m.id = sub.entry_id
    ${conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""}
    ORDER BY sub.distance
    LIMIT ?
  `;

  const params = [queryVec, overFetch, ...filterParams, limit];
  const rows = db.prepare(sql).all(...params) as any[];

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    similarity: 1 - row.distance,
  }));
}
