import type { HookHandler } from '../types/hooks.js';
import { getChromaClient } from '../storage/client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('hooks:post-tool-call');

interface ToolCallData {
  toolName: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
  success: boolean;
  cacheable?: boolean;
  cacheTTL?: number;
}

export const postToolCallHook: HookHandler = async (context) => {
  const data = context.data as ToolCallData;

  logger.debug('Tool call completed', {
    tool: data.toolName,
    duration: data.duration_ms,
    success: data.success,
  });

  // 1. Extract key information from tool result
  // 2. Generate embeddings for cacheable content
  // 3. Store in ChromaDB with metadata

  if (data.cacheable && data.success) {
    const chromaClient = getChromaClient();

    await chromaClient.cacheToolResult(
      context.projectId,
      data.toolName,
      data.input,
      data.output,
      data.cacheTTL
    );

    logger.debug('Cached tool result', {
      tool: data.toolName,
      ttl: data.cacheTTL,
    });
  }

  // 4. Update audit log if auditing enabled
  // This is handled by the audit system

  // 5. Check for error patterns to surface
  if (!data.success) {
    logger.warn('Tool call failed', {
      tool: data.toolName,
      input: data.input,
      output: data.output,
    });
  }
};
