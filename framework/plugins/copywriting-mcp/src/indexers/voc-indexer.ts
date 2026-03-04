#!/usr/bin/env bun
/**
 * VOC Indexer
 *
 * Indexa VOC quotes de ofertas existentes no database SQLite.
 * Parseia arquivos summary.md e processed/*.md para extrair quotes.
 * Gera embeddings para busca semantica via sqlite-vec.
 *
 * Uso: bun run index:voc [--skip-embeddings] [--backfill]
 */

import { Database } from "bun:sqlite";
import { glob } from "glob";
import { readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { getLoadablePath as getVecPath } from "sqlite-vec";
import { EmbeddingService } from "../db/embedding-service.js";

const DB_DIR = path.join(process.env.HOME || "~", ".claude", "plugins", "copywriting-mcp", "data");
const DB_PATH = path.join(DB_DIR, "copywriting.db");
const ECOSYSTEM_PATH = path.join(process.env.HOME || "~", "copywriting-ecosystem");

const args = process.argv.slice(2);
const SKIP_EMBEDDINGS = args.includes("--skip-embeddings");
const BACKFILL = args.includes("--backfill");

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

  CREATE INDEX IF NOT EXISTS idx_voc_nicho ON voc_quotes(nicho);
  CREATE INDEX IF NOT EXISTS idx_voc_emotion ON voc_quotes(emotion);
  CREATE INDEX IF NOT EXISTS idx_voc_intensity ON voc_quotes(intensity);
`);

// Create voc_vec if not exists
try {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS voc_vec USING vec0(
      quote_id INTEGER PRIMARY KEY,
      embedding float[384]
    );
  `);
} catch (err) {
  console.error("Warning: voc_vec table not created:", err);
}

interface ParsedQuote {
  quote: string;
  username?: string;
  platform: string;
  emotion?: string;
  intensity?: number;
  engagement?: Record<string, any>;
}

/**
 * Extract quotes from markdown content
 */
function extractQuotesFromMarkdown(content: string): ParsedQuote[] {
  const quotes: ParsedQuote[] = [];

  // Pattern 1: Quote blocks with > prefix
  // > "Quote text" - @username (platform)
  const blockQuotePattern = />\s*[""]([^""]+)[""]\s*[-–—]\s*@?(\w+)?\s*\((\w+)\)?/g;
  let match;

  while ((match = blockQuotePattern.exec(content)) !== null) {
    quotes.push({
      quote: match[1].trim(),
      username: match[2] || undefined,
      platform: match[3] || "unknown",
    });
  }

  // Pattern 2: Table rows with quotes
  // | "Quote" | emotion | intensity | platform |
  const tablePattern = /\|\s*[""]([^""]+)[""]\s*\|\s*(\w+)?\s*\|\s*(\d)?\s*\|\s*(\w+)?\s*\|/g;

  while ((match = tablePattern.exec(content)) !== null) {
    quotes.push({
      quote: match[1].trim(),
      emotion: match[2] || undefined,
      intensity: match[3] ? parseInt(match[3]) : undefined,
      platform: match[4] || "unknown",
    });
  }

  // Pattern 3: Simple quotes in lists
  // - "Quote text"
  const listQuotePattern = /[-*]\s*[""]([^""]{20,})[""]/g;

  while ((match = listQuotePattern.exec(content)) !== null) {
    // Avoid duplicates
    const quoteText = match[1].trim();
    if (!quotes.some((q) => q.quote === quoteText)) {
      quotes.push({
        quote: quoteText,
        platform: "unknown",
      });
    }
  }

  // Pattern 4: Quotes with @username
  // @username: "Quote text"
  const userQuotePattern = /@(\w+):\s*[""]([^""]+)[""]/g;

  while ((match = userQuotePattern.exec(content)) !== null) {
    const quoteText = match[2].trim();
    if (!quotes.some((q) => q.quote === quoteText)) {
      quotes.push({
        quote: quoteText,
        username: match[1],
        platform: "unknown",
      });
    }
  }

  return quotes;
}

/**
 * Detect emotion from quote text
 */
function detectEmotion(quote: string): { emotion: string; intensity: number } | null {
  const emotionPatterns: Array<{ emotion: string; patterns: RegExp[]; baseIntensity: number }> = [
    {
      emotion: "frustração",
      patterns: [
        /não funciona/i,
        /não consigo/i,
        /tentei de tudo/i,
        /cansad[oa]/i,
        /desisti/i,
        /impossível/i,
        /não adianta/i,
      ],
      baseIntensity: 4,
    },
    {
      emotion: "medo",
      patterns: [
        /medo de/i,
        /com medo/i,
        /tenho medo/i,
        /assustado/i,
        /preocupad[oa]/i,
        /e se/i,
        /nunca vou/i,
      ],
      baseIntensity: 4,
    },
    {
      emotion: "ansiedade",
      patterns: [
        /ansied/i,
        /nervos/i,
        /não durmo/i,
        /não consigo dormir/i,
        /agonia/i,
        /sufocad/i,
      ],
      baseIntensity: 4,
    },
    {
      emotion: "vergonha",
      patterns: [/vergonha/i, /constrangid/i, /humilhad/i, /ridícul/i, /esconder/i],
      baseIntensity: 5,
    },
    {
      emotion: "culpa",
      patterns: [/culpa/i, /devia ter/i, /me arrependo/i, /erro meu/i, /minha falha/i],
      baseIntensity: 4,
    },
    {
      emotion: "raiva",
      patterns: [/raiva/i, /ódio/i, /revoltad/i, /injust/i, /absurd/i, /indignada/i],
      baseIntensity: 5,
    },
    {
      emotion: "esperança",
      patterns: [/consegui/i, /funcionou/i, /deu certo/i, /mudou minha vida/i, /recomendo/i],
      baseIntensity: 4,
    },
    {
      emotion: "desejo",
      patterns: [/quero muito/i, /sonho/i, /preciso/i, /queria/i, /gostaria/i],
      baseIntensity: 3,
    },
  ];

  for (const { emotion, patterns, baseIntensity } of emotionPatterns) {
    let matchCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(quote)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      // Increase intensity for multiple matches
      const intensity = Math.min(5, baseIntensity + (matchCount > 2 ? 1 : 0));
      return { emotion, intensity };
    }
  }

  return null;
}

/**
 * Detect platform from file path or content
 */
function detectPlatform(filePath: string, content: string): string {
  const pathLower = filePath.toLowerCase();
  const contentLower = content.toLowerCase();

  if (pathLower.includes("youtube") || contentLower.includes("youtube")) return "YouTube";
  if (pathLower.includes("instagram") || contentLower.includes("instagram")) return "Instagram";
  if (pathLower.includes("tiktok") || contentLower.includes("tiktok")) return "TikTok";
  if (pathLower.includes("reddit") || contentLower.includes("reddit")) return "Reddit";
  if (pathLower.includes("reclame") || contentLower.includes("reclame aqui"))
    return "Reclame Aqui";
  if (pathLower.includes("amazon") || contentLower.includes("amazon")) return "Amazon";
  if (pathLower.includes("mercado") || contentLower.includes("mercado livre"))
    return "Mercado Livre";
  if (pathLower.includes("twitter") || pathLower.includes("x.com")) return "Twitter";

  return "unknown";
}

/**
 * Extract offer_id and nicho from file path
 */
function parseOfferPath(filePath: string): { offer_id: string; nicho: string } {
  // Expected structure: copywriting-ecosystem/{nicho}/{offer}/research/voc/...
  const parts = filePath.split(path.sep);
  const ecosystemIndex = parts.findIndex((p) => p === "copywriting-ecosystem");

  if (ecosystemIndex !== -1 && parts.length > ecosystemIndex + 2) {
    const nicho = parts[ecosystemIndex + 1];
    const offer_id = parts[ecosystemIndex + 2];
    return { offer_id, nicho };
  }

  return { offer_id: "unknown", nicho: "unknown" };
}

/**
 * Index a single VOC file
 */
function indexVocFile(filePath: string): number {
  const content = readFileSync(filePath, "utf-8");
  const { offer_id, nicho } = parseOfferPath(filePath);
  const defaultPlatform = detectPlatform(filePath, content);

  const quotes = extractQuotesFromMarkdown(content);
  let indexed = 0;

  const insertStmt = db.prepare(`
    INSERT INTO voc_quotes (offer_id, nicho, platform, quote, username, emotion, intensity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const checkStmt = db.prepare(`
    SELECT id FROM voc_quotes WHERE quote = ? AND offer_id = ?
  `);

  for (const q of quotes) {
    // Skip very short quotes
    if (q.quote.length < 20) continue;

    // Check for duplicates
    const existing = checkStmt.get(q.quote, offer_id);
    if (existing) continue;

    // Auto-detect emotion if not present
    let emotion = q.emotion;
    let intensity = q.intensity;

    if (!emotion) {
      const detected = detectEmotion(q.quote);
      if (detected) {
        emotion = detected.emotion;
        intensity = detected.intensity;
      }
    }

    insertStmt.run(
      offer_id,
      nicho,
      q.platform || defaultPlatform,
      q.quote,
      q.username || null,
      emotion || null,
      intensity || null
    );
    indexed++;
  }

  return indexed;
}

/**
 * Embed a batch of quotes and insert into voc_vec.
 */
const insertVecStmt = db.prepare(`INSERT OR REPLACE INTO voc_vec (quote_id, embedding) VALUES (?, ?)`);

async function embedAndInsertBatch(batch: { id: number; text: string }[]) {
  if (batch.length === 0) return 0;
  try {
    const svc = await EmbeddingService.getInstance();
    if (!svc.isReady()) return 0;

    const vectors = await svc.embedTexts(batch.map(b => b.text));
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

/**
 * Main indexer function
 */
async function main() {
  console.log("VOC Indexer - Copywriting MCP\n");
  console.log(`Database: ${DB_PATH}`);
  console.log(`Ecosystem: ${ECOSYSTEM_PATH}`);
  console.log(`Embeddings: ${SKIP_EMBEDDINGS ? "SKIP" : "ENABLED"}${BACKFILL ? " (backfill)" : ""}\n`);

  // Find all VOC files
  const patterns = [
    `${ECOSYSTEM_PATH}/**/voc/**/*.md`,
    `${ECOSYSTEM_PATH}/**/research/voc/*.md`,
    `${ECOSYSTEM_PATH}/**/biblioteca_nicho_*.md`,
  ];

  let totalFiles = 0;
  let totalQuotes = 0;
  const quoteBatch: { id: number; text: string }[] = [];

  for (const pattern of patterns) {
    const files = await glob(pattern, { ignore: ["**/node_modules/**", "**/.git/**"] });

    for (const file of files) {
      try {
        const indexed = indexVocFile(file);
        if (indexed > 0) {
          console.log(`  ${path.basename(file)}: ${indexed} quotes`);
          totalQuotes += indexed;
          totalFiles++;
        }
      } catch (error) {
        console.error(`  Error indexing ${file}:`, error);
      }
    }
  }

  // Get total count from database
  const countStmt = db.prepare("SELECT COUNT(*) as total FROM voc_quotes");
  const { total } = countStmt.get() as { total: number };

  console.log("\n========================================");
  console.log(`Files processed: ${totalFiles}`);
  console.log(`New quotes indexed: ${totalQuotes}`);
  console.log(`Total quotes in database: ${total}`);
  console.log("========================================\n");

  // Generate embeddings for all quotes without vectors
  if (!SKIP_EMBEDDINGS) {
    let embedQuery: string;
    if (BACKFILL) {
      embedQuery = `SELECT id, quote FROM voc_quotes`;
    } else {
      embedQuery = `
        SELECT q.id, q.quote FROM voc_quotes q
        LEFT JOIN voc_vec v ON v.quote_id = q.id
        WHERE v.quote_id IS NULL
      `;
    }

    const quotesNeedingEmbeddings = db.prepare(embedQuery).all() as Array<{ id: number; quote: string }>;

    if (quotesNeedingEmbeddings.length > 0) {
      console.log(`\nGenerating embeddings for ${quotesNeedingEmbeddings.length} quotes...`);
      let embeddedCount = 0;
      const BATCH_SIZE = 32;

      for (let i = 0; i < quotesNeedingEmbeddings.length; i += BATCH_SIZE) {
        const batch = quotesNeedingEmbeddings.slice(i, i + BATCH_SIZE).map(q => ({
          id: q.id,
          text: q.quote,
        }));
        const count = await embedAndInsertBatch(batch);
        embeddedCount += count;
        if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= quotesNeedingEmbeddings.length) {
          console.log(`  Embedded: ${embeddedCount}/${quotesNeedingEmbeddings.length}`);
        }
      }

      console.log(`Embeddings generated: ${embeddedCount}`);
    } else {
      console.log("All quotes already have embeddings.");
    }
  }

  // Show emotion distribution
  const emotionStmt = db.prepare(`
    SELECT emotion, COUNT(*) as count
    FROM voc_quotes
    WHERE emotion IS NOT NULL
    GROUP BY emotion
    ORDER BY count DESC
  `);
  const emotions = emotionStmt.all() as Array<{ emotion: string; count: number }>;

  if (emotions.length > 0) {
    console.log("\nEmotion Distribution:");
    for (const { emotion, count } of emotions) {
      console.log(`  ${emotion}: ${count}`);
    }
  }

  // Show nicho distribution
  const nichoStmt = db.prepare(`
    SELECT nicho, COUNT(*) as count
    FROM voc_quotes
    GROUP BY nicho
    ORDER BY count DESC
  `);
  const nichos = nichoStmt.all() as Array<{ nicho: string; count: number }>;

  if (nichos.length > 0) {
    console.log("\nNicho Distribution:");
    for (const { nicho, count } of nichos) {
      console.log(`  ${nicho}: ${count}`);
    }
  }

  db.close();
}

main().catch(console.error);
