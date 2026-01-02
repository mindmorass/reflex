import { ChromaClient as Chroma, Collection } from 'chromadb';
import { createHash } from 'crypto';
import { createLogger } from '../utils/logger.js';
import { env } from '../utils/env.js';
import { generateEmbedding } from './embeddings.js';
import type {
  StorageContent,
  QueryOptions,
  QueryResult,
  CacheHit,
  ProjectInfo,
} from './collections.js';

const logger = createLogger('chromadb');

export interface ChromaConfig {
  path?: string;
}

export class ChromaDBClient {
  private client: Chroma;
  private collections: Map<string, Collection>;
  private initialized: boolean = false;

  constructor(config: ChromaConfig = {}) {
    this.client = new Chroma({
      path: config.path || env.chromaDbPath,
    });
    this.collections = new Map();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify connection by listing collections
      await this.client.listCollections();
      this.initialized = true;
      logger.info('ChromaDB client initialized');
    } catch (error) {
      logger.error('Failed to initialize ChromaDB', error);
      throw error;
    }
  }

  async getCollection(projectId: string): Promise<Collection> {
    const collectionName = `reflex_${projectId}`;

    if (!this.collections.has(collectionName)) {
      const collection = await this.client.getOrCreateCollection({
        name: collectionName,
        metadata: {
          projectId,
          created: new Date().toISOString(),
          embeddingModel: 'all-MiniLM-L6-v2',
        },
      });
      this.collections.set(collectionName, collection);
      logger.debug(`Collection created/retrieved: ${collectionName}`);
    }

    return this.collections.get(collectionName)!;
  }

  private generateId(content: StorageContent): string {
    const hash = createHash('sha256');
    hash.update(content.text);
    hash.update(content.type);
    hash.update(content.source);
    return hash.digest('hex').substring(0, 32);
  }

  private isExpired(timestamp: string, ttl?: number): boolean {
    if (!ttl) return false;

    const created = new Date(timestamp).getTime();
    const now = Date.now();
    const ttlMs = ttl * 1000;

    return now - created > ttlMs;
  }

  async store(projectId: string, content: StorageContent): Promise<string> {
    const collection = await this.getCollection(projectId);
    const embedding = await generateEmbedding(content.text);
    const id = this.generateId(content);

    const metadata: Record<string, string | number | boolean> = {
      type: content.type,
      source: content.source,
      timestamp: new Date().toISOString(),
    };

    if (content.ttl !== undefined) {
      metadata.ttl = content.ttl;
    }

    if (content.metadata) {
      for (const [key, value] of Object.entries(content.metadata)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          metadata[key] = value;
        }
      }
    }

    await collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [content.text],
      metadatas: [metadata],
    });

    logger.debug(`Stored content: ${id}`, { type: content.type, source: content.source });
    return id;
  }

  async query(
    projectId: string,
    queryText: string,
    options: QueryOptions = {}
  ): Promise<QueryResult[]> {
    const collection = await this.getCollection(projectId);
    const embedding = await generateEmbedding(queryText);

    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: options.limit || 5,
      where: options.filter as Record<string, string | number | boolean> | undefined,
    });

    return this.formatResults(
      {
        ids: results.ids,
        documents: results.documents,
        metadatas: results.metadatas,
        distances: results.distances ?? undefined,
      },
      options.minSimilarity
    );
  }

  private formatResults(
    results: {
      ids: string[][];
      documents: (string | null)[][];
      metadatas: (Record<string, unknown> | null)[][];
      distances?: number[][];
    },
    minSimilarity?: number
  ): QueryResult[] {
    const formatted: QueryResult[] = [];

    if (!results.ids[0]) return formatted;

    for (let i = 0; i < results.ids[0].length; i++) {
      // ChromaDB returns distances, convert to similarity (1 - distance for cosine)
      const distance = results.distances?.[0]?.[i] ?? 0;
      const similarity = 1 - distance;

      if (minSimilarity && similarity < minSimilarity) {
        continue;
      }

      formatted.push({
        id: results.ids[0][i],
        content: results.documents[0]?.[i] ?? '',
        similarity,
        metadata: (results.metadatas[0]?.[i] as Record<string, unknown>) ?? {},
      });
    }

    return formatted;
  }

  async checkCache(
    projectId: string,
    toolName: string,
    inputHash: string
  ): Promise<CacheHit | null> {
    const collection = await this.getCollection(projectId);

    const results = await collection.get({
      where: {
        type: 'tool_cache',
        toolName,
        inputHash,
      },
    });

    if (results.ids.length > 0) {
      const metadata = results.metadatas[0] as Record<string, unknown>;
      const timestamp = metadata.timestamp as string;
      const ttl = metadata.ttl as number | undefined;

      if (this.isExpired(timestamp, ttl)) {
        await collection.delete({ ids: [results.ids[0]] });
        logger.debug(`Cache entry expired and deleted: ${results.ids[0]}`);
        return null;
      }

      return {
        hit: true,
        result: JSON.parse(results.documents[0] as string),
        timestamp,
      };
    }

    return null;
  }

  async cacheToolResult(
    projectId: string,
    toolName: string,
    input: unknown,
    result: unknown,
    ttl?: number
  ): Promise<string> {
    const inputHash = createHash('sha256')
      .update(JSON.stringify(input))
      .digest('hex')
      .substring(0, 32);

    return this.store(projectId, {
      text: JSON.stringify(result),
      type: 'tool_cache',
      source: toolName,
      ttl,
      metadata: {
        toolName,
        inputHash,
      },
    });
  }

  async listProjects(): Promise<ProjectInfo[]> {
    const collectionNames = await this.client.listCollections();

    return collectionNames
      .filter((name) => name.startsWith('reflex_'))
      .map((name) => ({
        projectId: name.replace('reflex_', ''),
        metadata: {},
      }));
  }

  async deleteProject(projectId: string): Promise<void> {
    const collectionName = `reflex_${projectId}`;
    await this.client.deleteCollection({ name: collectionName });
    this.collections.delete(collectionName);
    logger.info(`Deleted project collection: ${collectionName}`);
  }

  async deleteExpired(projectId: string): Promise<number> {
    const collection = await this.getCollection(projectId);
    let deleted = 0;

    // Get all entries - we'll filter for TTL manually
    const results = await collection.get({});

    const idsToDelete: string[] = [];

    for (let i = 0; i < results.ids.length; i++) {
      const metadata = results.metadatas[i] as Record<string, unknown> | null;
      if (!metadata) continue;

      const timestamp = metadata.timestamp as string | undefined;
      const ttl = metadata.ttl as number | undefined;

      if (timestamp && ttl && this.isExpired(timestamp, ttl)) {
        idsToDelete.push(results.ids[i]);
      }
    }

    if (idsToDelete.length > 0) {
      await collection.delete({ ids: idsToDelete });
      deleted = idsToDelete.length;
      logger.info(`Deleted ${deleted} expired entries from ${projectId}`);
    }

    return deleted;
  }
}

// Singleton instance
let chromaClient: ChromaDBClient | null = null;

export function getChromaClient(config?: ChromaConfig): ChromaDBClient {
  if (!chromaClient) {
    chromaClient = new ChromaDBClient(config);
  }
  return chromaClient;
}
