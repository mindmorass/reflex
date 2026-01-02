import type { HookHandler } from '../types/hooks.js';
import { getChromaClient } from '../storage/client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('hooks:error');

interface ErrorData {
  originalEvent?: string;
  error: Error | unknown;
  context?: unknown;
  recoverable?: boolean;
  retryCount?: number;
}

const MAX_RETRIES = 3;

export const errorHook: HookHandler = async (context) => {
  const data = context.data as ErrorData;
  const error = data.error instanceof Error ? data.error : new Error(String(data.error));

  // 1. Log error with full context
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    originalEvent: data.originalEvent,
    context: data.context,
  });

  // 2. Determine if error is recoverable
  const recoverable = data.recoverable ?? isRecoverable(error);

  // 3. If recoverable, attempt recovery strategy
  if (recoverable) {
    const retryCount = data.retryCount || 0;

    if (retryCount < MAX_RETRIES) {
      logger.info(`Attempting recovery (attempt ${retryCount + 1}/${MAX_RETRIES})`);

      // Retry with exponential backoff
      const backoffMs = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));

      // Note: Actual retry would be handled by the calling code
      // This hook just prepares and logs the recovery attempt
    } else {
      logger.warn('Max retries exceeded, marking as unrecoverable');
    }
  }

  // 4. If not recoverable, ensure graceful degradation
  if (!recoverable) {
    logger.error('Unrecoverable error, graceful degradation initiated');
  }

  // 5. Store error pattern for future avoidance
  try {
    const chromaClient = getChromaClient();
    await chromaClient.store(context.projectId, {
      text: `Error: ${error.message}\nEvent: ${data.originalEvent || 'unknown'}`,
      type: 'context',
      source: 'error',
      ttl: 86400 * 7, // Keep for 7 days
      metadata: {
        errorType: error.name,
        originalEvent: data.originalEvent,
        recoverable,
        timestamp: context.timestamp.toISOString(),
      },
    });
  } catch (storageError) {
    // Don't let storage errors cascade
    logger.warn('Failed to store error pattern', storageError);
  }
};

function isRecoverable(error: Error): boolean {
  // Network errors are usually recoverable
  if (error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')) {
    return true;
  }

  // Rate limiting is recoverable
  if (error.message.includes('rate limit') ||
      error.message.includes('429')) {
    return true;
  }

  // Syntax errors, type errors are not recoverable
  if (error instanceof SyntaxError ||
      error instanceof TypeError ||
      error instanceof ReferenceError) {
    return false;
  }

  // Default to recoverable
  return true;
}
