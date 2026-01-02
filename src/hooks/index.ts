import { createLogger } from '../utils/logger.js';
import { env } from '../utils/env.js';
import type { HookEvent, HookContext, HookHandler } from '../types/hooks.js';

const logger = createLogger('hooks');

export class HookManager {
  private hooks: Map<HookEvent, HookHandler[]>;
  private sessionId: string;
  private projectId: string;

  constructor(sessionId: string, projectId?: string) {
    this.hooks = new Map();
    this.sessionId = sessionId;
    this.projectId = projectId || env.projectId;

    // Initialize empty handler arrays for all events
    const events: HookEvent[] = [
      'session_start',
      'session_end',
      'pre_agent_handoff',
      'post_tool_call',
      'error',
      'file_upload',
    ];

    for (const event of events) {
      this.hooks.set(event, []);
    }
  }

  register(event: HookEvent, handler: HookHandler): void {
    const handlers = this.hooks.get(event) || [];
    handlers.push(handler);
    this.hooks.set(event, handlers);
    logger.debug(`Registered handler for ${event}`);
  }

  unregister(event: HookEvent, handler: HookHandler): void {
    const handlers = this.hooks.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      logger.debug(`Unregistered handler for ${event}`);
    }
  }

  async emit(event: HookEvent, data: unknown): Promise<void> {
    const handlers = this.hooks.get(event) || [];

    const context: HookContext = {
      sessionId: this.sessionId,
      projectId: this.projectId,
      timestamp: new Date(),
      event,
      data,
    };

    logger.debug(`Emitting ${event} to ${handlers.length} handlers`);

    for (const handler of handlers) {
      try {
        await handler(context);
      } catch (error) {
        // Log error but don't stop execution of other handlers
        logger.error(`Error in ${event} handler`, error);

        // If this is an error event, don't recurse
        if (event !== 'error') {
          await this.emit('error', {
            originalEvent: event,
            error,
            context,
          });
        }
      }
    }
  }

  getHandlerCount(event: HookEvent): number {
    return this.hooks.get(event)?.length || 0;
  }

  setProjectId(projectId: string): void {
    this.projectId = projectId;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }
}

export { HookEvent, HookContext, HookHandler } from '../types/hooks.js';
