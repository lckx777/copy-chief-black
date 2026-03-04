#!/usr/bin/env bun
/**
 * Database Initialization Script
 *
 * Run with: bun run db:init
 *
 * Creates:
 * - SQLite database file
 * - All required tables
 * - Initial indexes
 */

import { initDatabase, closeDb } from "./sqlite.js";
import path from "path";
import { existsSync, mkdirSync } from "fs";

async function main() {
  console.log("Initializing copywriting-mcp database...\n");

  // Ensure data directory exists
  const dataDir = path.join(process.env.HOME || "~", ".claude/plugins/copywriting-mcp/data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }

  // Initialize database
  try {
    await initDatabase();
    console.log("✅ Database initialized successfully\n");

    console.log("Tables created:");
    console.log("  - voc_quotes (VOC storage with embeddings)");
    console.log("  - swipes (Swipe library)");
    console.log("  - competitors (Competitor intelligence)");
    console.log("  - validations (Copy validation history)");
    console.log("  - helix_progress (HELIX phase tracking)");
    console.log("  - session_state (Session recovery)");

    console.log("\nIndexes created:");
    console.log("  - idx_voc_nicho, idx_voc_emotion, idx_voc_intensity");
    console.log("  - idx_swipes_category, idx_swipes_nicho");
    console.log("  - idx_competitors_nicho");
    console.log("  - idx_validations_offer");
    console.log("  - idx_helix_offer");

    closeDb();
    console.log("\n✅ Database ready to use");

  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

main();
