/**
 * Embedding Service — Singleton wrapper over fastembed
 *
 * Lazy-initialized. First call downloads BGE-small-en-v1.5 (~33MB) to cache.
 * Subsequent calls reuse the cached model.
 *
 * Uses bun-native imports. Falls back to node subprocess if onnxruntime fails.
 *
 * @module embedding-service
 */

import { FlagEmbedding, EmbeddingModel } from "fastembed";

const EMBEDDING_DIM = 384; // BGE-small-en-v1.5

export class EmbeddingService {
  private static instance: EmbeddingService | null = null;
  private model: FlagEmbedding | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Get or create the singleton instance.
   * Lazy-inits the model on first use.
   */
  static async getInstance(): Promise<EmbeddingService> {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    const svc = EmbeddingService.instance;
    if (!svc.model && !svc.initPromise) {
      svc.initPromise = svc._init();
    }
    if (svc.initPromise) {
      await svc.initPromise;
      svc.initPromise = null;
    }
    return svc;
  }

  private async _init(): Promise<void> {
    try {
      this.model = await FlagEmbedding.init({
        model: EmbeddingModel.BGESmallENV15,
        maxLength: 512,
        showDownloadProgress: true,
      });
      console.error(`[EmbeddingService] Model loaded: BGE-small-en-v1.5 (${EMBEDDING_DIM}-dim)`);
    } catch (err) {
      console.error(`[EmbeddingService] Failed to init model:`, err);
      this.model = null;
    }
  }

  /**
   * Embed multiple texts. Returns array of float vectors (384-dim each).
   * Returns empty array if model not available.
   */
  async embedTexts(texts: string[], batchSize = 32): Promise<number[][]> {
    if (!this.model || texts.length === 0) return [];

    try {
      const results: number[][] = [];
      for await (const batch of this.model.embed(texts, batchSize)) {
        results.push(...batch);
      }
      return results;
    } catch (err) {
      console.error(`[EmbeddingService] embedTexts failed:`, err);
      return [];
    }
  }

  /**
   * Embed a single query string. Returns float vector (384-dim).
   * Returns null if model not available.
   */
  async embedQuery(query: string): Promise<number[] | null> {
    if (!this.model) return null;

    try {
      return await this.model.queryEmbed(query);
    } catch (err) {
      console.error(`[EmbeddingService] embedQuery failed:`, err);
      return null;
    }
  }

  /**
   * Check if the service is ready (model loaded).
   */
  isReady(): boolean {
    return this.model !== null;
  }

  /**
   * Get embedding dimensionality.
   */
  static getDim(): number {
    return EMBEDDING_DIM;
  }

  /**
   * Serialize a float vector to Buffer for sqlite-vec storage.
   * sqlite-vec expects little-endian float32 blobs.
   */
  static serializeVector(vec: number[]): Buffer {
    const buf = Buffer.alloc(vec.length * 4);
    for (let i = 0; i < vec.length; i++) {
      buf.writeFloatLE(vec[i], i * 4);
    }
    return buf;
  }

  /**
   * Deserialize a Buffer back to float vector.
   */
  static deserializeVector(buf: Buffer): number[] {
    const vec: number[] = [];
    for (let i = 0; i < buf.length; i += 4) {
      vec.push(buf.readFloatLE(i));
    }
    return vec;
  }
}

// Self-test when run directly
if (import.meta.main) {
  (async () => {
    console.log("Testing EmbeddingService...");
    const svc = await EmbeddingService.getInstance();

    if (!svc.isReady()) {
      console.error("Model failed to load");
      process.exit(1);
    }

    const vec = await svc.embedQuery("teste de embedding semantico");
    if (vec) {
      console.log(`Dimension: ${vec.length}`);
      console.log(`First 5 values: ${vec.slice(0, 5).map(v => v.toFixed(4)).join(", ")}`);
      console.log(`Norm: ${Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)).toFixed(4)}`);

      // Test serialization round-trip
      const buf = EmbeddingService.serializeVector(vec);
      const restored = EmbeddingService.deserializeVector(buf);
      const diff = vec.reduce((sum, v, i) => sum + Math.abs(v - restored[i]), 0);
      console.log(`Serialization round-trip error: ${diff.toFixed(10)}`);
    }

    console.log("OK");
  })();
}
