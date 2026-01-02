import type { HookHandler } from '../types/hooks.js';
import type { HandoffRequest, AgentResult } from '../types/agents.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('hooks:pre-agent-handoff');

interface HandoffData {
  request: HandoffRequest;
  sourceAgent: string;
  previousResult?: AgentResult;
}

export const preAgentHandoffHook: HookHandler = async (context) => {
  const data = context.data as HandoffData;

  logger.info('Agent handoff initiated', {
    from: data.sourceAgent,
    to: data.request.targetAgent,
    reason: data.request.reason,
  });

  // 1. Validate handoff request
  if (!data.request.targetAgent) {
    throw new Error('Handoff request missing target agent');
  }

  if (!data.request.reason) {
    logger.warn('Handoff request missing reason', { request: data.request });
  }

  // 2. Ensure target agent exists and is available
  // This is validated by the orchestrator, but we log here for audit

  // 3. Serialize current agent state
  const serializedState = {
    sourceAgent: data.sourceAgent,
    previousResult: data.previousResult,
    handoffContext: data.request.context,
    timestamp: context.timestamp.toISOString(),
  };

  logger.debug('Serialized agent state for handoff', serializedState);

  // 4. Log handoff in audit trail
  // This is captured by the audit system if enabled

  // 5. Prepare context for target agent
  // The orchestrator will use the serialized state to create the agent context
};
