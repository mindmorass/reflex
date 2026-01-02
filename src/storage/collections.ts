export interface StorageContent {
  text: string;
  type: ContentType;
  source: string;
  ttl?: number; // Time to live in seconds
  metadata?: Record<string, unknown>;
}

export type ContentType =
  | 'tool_cache' // Cached tool/skill results
  | 'document' // Uploaded/harvested documents
  | 'code' // Code snippets and symbols
  | 'conversation' // Conversation history
  | 'research' // Research findings
  | 'context'; // General context

export interface QueryOptions {
  limit?: number;
  filter?: Record<string, unknown>;
  minSimilarity?: number;
}

export interface QueryResult {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface CacheHit {
  hit: boolean;
  result: unknown;
  timestamp: string;
}

export interface ProjectInfo {
  projectId: string;
  metadata: Record<string, unknown>;
}
