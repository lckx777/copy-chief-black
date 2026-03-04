#!/usr/bin/env bun
/**
 * Memory Consolidation Script (Tier 3)
 *
 * Background batch process that:
 * 1. Clusters similar episodic entries
 * 2. Generates technique-register entries from clusters
 * 3. Detects cross-offer patterns
 * 4. Applies decay to low-score old entries
 * 5. Reinforces frequently-accessed entries
 *
 * Usage: bun run src/scripts/consolidate-memory.ts [--dry-run]
 */

import { Database } from "bun:sqlite";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { getLoadablePath as getVecPath } from "sqlite-vec";
import { EmbeddingService } from "../db/embedding-service.js";

// @ts-ignore
import yaml from "js-yaml";

const HOME = process.env.HOME || "~";
const DB_DIR = path.join(HOME, ".claude", "plugins", "copywriting-mcp", "data");
const DB_PATH = path.join(DB_DIR, "copywriting.db");
const AGENT_MEMORY_DIR = path.join(HOME, ".claude", "agent-memory");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

const CLUSTER_THRESHOLD = 0.85; // Similarity threshold for clustering
const MIN_CLUSTER_SIZE = 3;     // Min entries to generate technique
const DECAY_MIN_SCORE = 5;      // Score below which decay applies
const DECAY_MAX_AGE_DAYS = 60;  // Age after which decay kicks in

const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");

try {
  db.loadExtension(getVecPath());
} catch (err) {
  console.error("Warning: sqlite-vec not loaded:", err);
}

interface MemoryRow {
  id: number;
  source: string;
  agent_id: string | null;
  offer: string | null;
  niche: string | null;
  content: string;
  metadata: string | null;
  source_file: string | null;
  created_at: string;
}

// ============================================================
// 1. Cluster Detection
// ============================================================

interface Cluster {
  centroid_id: number;
  entries: MemoryRow[];
  offers: Set<string>;
  agents: Set<string>;
}

async function detectClusters(): Promise<Cluster[]> {
  console.log("\n--- Cluster Detection ---");

  // Get all episodic entries that have embeddings
  const entries = db.prepare(`
    SELECT m.* FROM memory_entries m
    JOIN memory_vec v ON v.entry_id = m.id
    WHERE m.source IN ('agent-episodic', 'offer-episodic')
    ORDER BY m.id
  `).all() as MemoryRow[];

  if (entries.length < MIN_CLUSTER_SIZE) {
    console.log(`  Only ${entries.length} entries — need at least ${MIN_CLUSTER_SIZE} to cluster.`);
    return [];
  }

  console.log(`  Analyzing ${entries.length} episodic entries...`);

  const clusters: Cluster[] = [];
  const clustered = new Set<number>();

  for (const entry of entries) {
    if (clustered.has(entry.id)) continue;

    // Get this entry's embedding and search for similar
    const vecRow = db.prepare(`SELECT embedding FROM memory_vec WHERE entry_id = ?`).get(entry.id) as { embedding: Buffer } | null;
    if (!vecRow) continue;

    const similar = db.prepare(`
      SELECT entry_id, distance FROM memory_vec
      WHERE embedding MATCH ?
      ORDER BY distance
      LIMIT 20
    `).all(vecRow.embedding) as Array<{ entry_id: number; distance: number }>;

    // Filter by threshold
    const closeEntries = similar
      .filter(s => s.entry_id !== entry.id && (1 - s.distance) >= CLUSTER_THRESHOLD && !clustered.has(s.entry_id));

    if (closeEntries.length < MIN_CLUSTER_SIZE - 1) continue;

    // Build cluster
    const clusterIds = [entry.id, ...closeEntries.map(s => s.entry_id)];
    const clusterRows = db.prepare(
      `SELECT * FROM memory_entries WHERE id IN (${clusterIds.map(() => "?").join(",")})`
    ).all(...clusterIds) as MemoryRow[];

    const cluster: Cluster = {
      centroid_id: entry.id,
      entries: clusterRows,
      offers: new Set(clusterRows.map(r => r.offer).filter(Boolean) as string[]),
      agents: new Set(clusterRows.map(r => r.agent_id).filter(Boolean) as string[]),
    };

    clusters.push(cluster);
    for (const id of clusterIds) clustered.add(id);
  }

  console.log(`  Found ${clusters.length} clusters (${clustered.size} entries clustered)`);
  return clusters;
}

// ============================================================
// 2. Technique Generation
// ============================================================

function generateTechniques(clusters: Cluster[]): number {
  console.log("\n--- Technique Generation ---");

  let generated = 0;

  for (const cluster of clusters) {
    if (cluster.entries.length < MIN_CLUSTER_SIZE) continue;

    // Extract common patterns from cluster entries
    const contentSnippets = cluster.entries.map(e => e.content.substring(0, 200));
    const isCrossOffer = cluster.offers.size > 1;

    // Build technique name from first entry content
    const firstContent = cluster.entries[0].content;
    const name = firstContent.length > 80
      ? firstContent.substring(0, 77) + "..."
      : firstContent;

    // Build description from all entries
    const description = `Pattern detected across ${cluster.entries.length} episodic entries.\n` +
      `Agents: ${[...cluster.agents].join(", ")}\n` +
      `Offers: ${[...cluster.offers].join(", ")}\n` +
      (isCrossOffer ? `\nCROSS-OFFER PATTERN — applies across multiple offers.\n` : "") +
      `\nEntries:\n${contentSnippets.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}`;

    // Calculate average score from metadata
    let totalScore = 0;
    let scoreCount = 0;
    for (const entry of cluster.entries) {
      if (entry.metadata) {
        try {
          const meta = JSON.parse(entry.metadata);
          if (meta.score != null) {
            totalScore += Number(meta.score);
            scoreCount++;
          }
        } catch {}
      }
    }
    const avgScore = scoreCount > 0 ? totalScore / scoreCount : 7;

    // Determine which agent has most entries in this cluster
    const agentCounts = new Map<string, number>();
    for (const entry of cluster.entries) {
      if (entry.agent_id) {
        agentCounts.set(entry.agent_id, (agentCounts.get(entry.agent_id) || 0) + 1);
      }
    }
    const topAgent = [...agentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

    if (!DRY_RUN) {
      // Write technique to agent's technique-register.yaml
      const techFilePath = path.join(AGENT_MEMORY_DIR, topAgent, "technique-register.yaml");
      const dir = path.dirname(techFilePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

      let existing: any[] = [];
      if (existsSync(techFilePath)) {
        try {
          const raw = readFileSync(techFilePath, "utf8");
          const parsed = yaml.load(raw);
          existing = Array.isArray(parsed) ? parsed : [];
        } catch {}
      }

      // Check if similar technique already exists (by centroid_id tag)
      const alreadyExists = existing.some(t =>
        t._consolidation_centroid === cluster.centroid_id
      );

      if (!alreadyExists) {
        existing.unshift({
          name,
          description,
          score: Math.round(avgScore),
          niche: [...cluster.offers][0] ? undefined : undefined, // Will be set per-entry niche
          hit_count: 0,
          _consolidation_centroid: cluster.centroid_id,
          _cross_offer: isCrossOffer,
          timestamp: new Date().toISOString(),
        });

        // Cap at 20
        if (existing.length > 20) existing = existing.slice(0, 20);

        writeFileSync(techFilePath, yaml.dump(existing, { lineWidth: 120, noRefs: true }), "utf8");
        generated++;
        console.log(`  Generated technique for ${topAgent} (${cluster.entries.length} entries, cross-offer: ${isCrossOffer})`);
      }
    } else {
      console.log(`  [DRY RUN] Would generate technique for ${topAgent} (${cluster.entries.length} entries, cross-offer: ${isCrossOffer})`);
      generated++;
    }
  }

  console.log(`  Total techniques generated: ${generated}`);
  return generated;
}

// ============================================================
// 3. Cross-Offer Detection
// ============================================================

function tagCrossOfferPatterns(clusters: Cluster[]): number {
  console.log("\n--- Cross-Offer Pattern Detection ---");

  let tagged = 0;

  for (const cluster of clusters) {
    if (cluster.offers.size <= 1) continue;

    if (!DRY_RUN) {
      // Tag entries in this cluster with cross-offer metadata
      const updateStmt = db.prepare(`
        UPDATE memory_entries
        SET metadata = json_set(COALESCE(metadata, '{}'), '$.cross_offer_pattern', true,
          '$.related_offers', ?)
        WHERE id = ?
      `);

      const relatedOffers = JSON.stringify([...cluster.offers]);
      for (const entry of cluster.entries) {
        updateStmt.run(relatedOffers, entry.id);
        tagged++;
      }
    } else {
      tagged += cluster.entries.length;
    }

    console.log(`  Cross-offer cluster: ${[...cluster.offers].join(", ")} (${cluster.entries.length} entries)`);
  }

  console.log(`  Entries tagged: ${tagged}`);
  return tagged;
}

// ============================================================
// 4. Decay
// ============================================================

function applyDecay(): number {
  console.log("\n--- Decay ---");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DECAY_MAX_AGE_DAYS);
  const cutoffStr = cutoff.toISOString();

  // Find candidates: low score + old
  const candidates = db.prepare(`
    SELECT id, metadata FROM memory_entries
    WHERE created_at < ?
      AND json_extract(metadata, '$.score') IS NOT NULL
      AND CAST(json_extract(metadata, '$.score') AS REAL) < ?
      AND (json_extract(metadata, '$.decayed') IS NULL OR json_extract(metadata, '$.decayed') = false)
  `).all(cutoffStr, DECAY_MIN_SCORE) as Array<{ id: number; metadata: string }>;

  if (candidates.length === 0) {
    console.log("  No entries eligible for decay.");
    return 0;
  }

  if (!DRY_RUN) {
    const updateStmt = db.prepare(`
      UPDATE memory_entries
      SET metadata = json_set(COALESCE(metadata, '{}'), '$.decayed', true, '$.decayed_at', ?)
      WHERE id = ?
    `);

    for (const c of candidates) {
      updateStmt.run(new Date().toISOString(), c.id);
    }
  }

  console.log(`  ${DRY_RUN ? "[DRY RUN] Would decay" : "Decayed"}: ${candidates.length} entries`);
  return candidates.length;
}

// ============================================================
// 5. Reinforcement
// ============================================================

function reportReinforcement(): void {
  console.log("\n--- Reinforcement Report ---");

  const topHits = db.prepare(`
    SELECT id, source, agent_id, offer, content,
      CAST(json_extract(metadata, '$.hit_count') AS INTEGER) as hits
    FROM memory_entries
    WHERE json_extract(metadata, '$.hit_count') IS NOT NULL
      AND CAST(json_extract(metadata, '$.hit_count') AS INTEGER) > 0
    ORDER BY hits DESC
    LIMIT 10
  `).all() as Array<{ id: number; source: string; agent_id: string; offer: string; content: string; hits: number }>;

  if (topHits.length === 0) {
    console.log("  No entries have been accessed yet via semantic search.");
    return;
  }

  console.log("  Most accessed memories:");
  for (const row of topHits) {
    const preview = row.content.substring(0, 60).replace(/\n/g, " ");
    console.log(`    [${row.hits} hits] ${row.source}/${row.agent_id || "-"}/${row.offer || "-"}: ${preview}`);
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("Memory Consolidation - Copywriting MCP");
  console.log(`Database: ${DB_PATH}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  // Stats
  const totalEntries = (db.prepare("SELECT COUNT(*) as c FROM memory_entries").get() as any).c;
  const totalVecs = (db.prepare("SELECT COUNT(*) as c FROM memory_vec").get() as any).c;
  console.log(`Memory entries: ${totalEntries}, Embeddings: ${totalVecs}`);

  if (totalEntries === 0) {
    console.log("\nNo memory entries found. Run the memory indexer first:");
    console.log("  bun run src/indexers/memory-indexer.ts");
    db.close();
    return;
  }

  // 1. Detect clusters
  const clusters = await detectClusters();

  // 2. Generate techniques from clusters
  if (clusters.length > 0) {
    generateTechniques(clusters);
  }

  // 3. Tag cross-offer patterns
  if (clusters.length > 0) {
    tagCrossOfferPatterns(clusters);
  }

  // 4. Apply decay
  applyDecay();

  // 5. Reinforcement report
  reportReinforcement();

  console.log("\n========================================");
  console.log("Consolidation complete.");
  console.log("========================================");

  db.close();
}

main().catch(console.error);
