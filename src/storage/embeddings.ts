import { createLogger } from '../utils/logger.js';

const logger = createLogger('embeddings');

// Lazy-loaded embedding pipeline
let embeddingPipeline: unknown = null;
let pipelinePromise: Promise<unknown> | null = null;

async function loadPipeline(): Promise<unknown> {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  if (pipelinePromise) {
    return pipelinePromise;
  }

  pipelinePromise = (async () => {
    try {
      logger.info('Loading embedding model...');
      const { pipeline } = await import('@xenova/transformers');
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      logger.info('Embedding model loaded successfully');
      return embeddingPipeline;
    } catch (error) {
      logger.error('Failed to load embedding model', error);
      pipelinePromise = null;
      throw error;
    }
  })();

  return pipelinePromise;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await loadPipeline() as {
    (text: string, options: { pooling: string; normalize: boolean }): Promise<{ data: Float32Array }>;
  };

  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Warm up embeddings pipeline (call during session start)
export async function warmupEmbeddings(): Promise<void> {
  await loadPipeline();
  // Generate a test embedding to ensure model is fully loaded
  await generateEmbedding('warmup');
  logger.info('Embeddings warmed up');
}
