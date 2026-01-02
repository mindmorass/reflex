import type { HookHandler } from '../types/hooks.js';
import { getChromaClient } from '../storage/client.js';
import { warmupEmbeddings } from '../storage/embeddings.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('hooks:session-start');

export const sessionStartHook: HookHandler = async (context) => {
  logger.info('Session starting', { sessionId: context.sessionId, projectId: context.projectId });

  // 1. Initialize ChromaDB connection
  const chromaClient = getChromaClient();
  await chromaClient.initialize();

  // 2. Load or create project-specific collection
  await chromaClient.getCollection(context.projectId);
  logger.debug('Project collection ready');

  // 3. Load user preferences/context from previous sessions
  const results = await chromaClient.query(
    context.projectId,
    'session context preferences settings',
    { limit: 5, filter: { type: 'context' } }
  );

  if (results.length > 0) {
    logger.debug(`Loaded ${results.length} context items from previous sessions`);
  }

  // 4. Initialize audit log if auditing is enabled (handled by audit command)

  // 5. Warm up frequently used embeddings
  await warmupEmbeddings();

  logger.info('Session started successfully');
};
