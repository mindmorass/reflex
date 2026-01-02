import type { HookHandler } from '../types/hooks.js';
import { getChromaClient } from '../storage/client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('hooks:session-end');

export const sessionEndHook: HookHandler = async (context) => {
  logger.info('Session ending', { sessionId: context.sessionId, projectId: context.projectId });

  const chromaClient = getChromaClient();

  // 1. Persist any pending data to ChromaDB
  // Store session metadata for future reference
  await chromaClient.store(context.projectId, {
    text: `Session ${context.sessionId} ended at ${context.timestamp.toISOString()}`,
    type: 'context',
    source: 'session',
    metadata: {
      sessionId: context.sessionId,
      endedAt: context.timestamp.toISOString(),
    },
  });

  // 2. Finalize and close audit log (handled by audit command)

  // 3. Generate session summary
  const sessionData = context.data as { actionsCount?: number; agentsUsed?: string[] } | undefined;
  if (sessionData) {
    logger.info('Session summary', {
      actionsCount: sessionData.actionsCount || 0,
      agentsUsed: sessionData.agentsUsed || [],
    });
  }

  // 4. Cleanup temporary resources
  // Delete expired cache entries
  const deleted = await chromaClient.deleteExpired(context.projectId);
  if (deleted > 0) {
    logger.debug(`Cleaned up ${deleted} expired cache entries`);
  }

  // 5. Save session metadata for future reference (done in step 1)

  logger.info('Session ended successfully');
};
