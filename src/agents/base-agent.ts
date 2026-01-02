import { EventEmitter } from 'events';
import { createLogger, Logger } from '../utils/logger.js';
import { getSkillRegistry } from '../skills/registry.js';
import type {
  AgentContext,
  AgentResult,
  HandoffRequest,
  Artifact,
} from '../types/agents.js';
import type { SkillContext } from '../types/skills.js';

const defaultLogger = createLogger('agent');

export abstract class BaseAgent extends EventEmitter {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly skills: string[];

  // Optional MCP servers this agent needs
  readonly mcpServers?: string[];

  protected get logger(): Logger {
    return defaultLogger;
  }

  // Execute the agent's task
  abstract execute(context: AgentContext): Promise<AgentResult>;

  // Request handoff to another agent via orchestrator
  protected requestHandoff(request: HandoffRequest): void {
    this.logger.info(`Agent ${this.name} requesting handoff to ${request.targetAgent}`, {
      reason: request.reason,
    });
    this.emit('handoff', request);
  }

  // Invoke a skill
  protected async invokeSkill(skillName: string, input: unknown, context: AgentContext): Promise<unknown> {
    // Validate skill is in this.skills
    if (!this.skills.includes(skillName)) {
      throw new Error(
        `Agent ${this.name} is not authorized to invoke skill ${skillName}. ` +
        `Authorized skills: ${this.skills.join(', ')}`
      );
    }

    const registry = getSkillRegistry();

    if (!registry.hasSkill(skillName)) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    const skillContext: SkillContext = {
      chromaCollection: context.chromaCollection,
      sessionId: context.sessionId,
      projectId: context.projectContext.projectId,
      agent: this.name,
    };

    return registry.invokeSkill(skillName, input, skillContext);
  }

  // Helper to create a successful result
  protected success(output: unknown, options?: {
    artifacts?: Artifact[];
    suggestedNextAgent?: string;
    handoffContext?: unknown;
  }): AgentResult {
    return {
      success: true,
      output,
      ...options,
    };
  }

  // Helper to create a failed result
  protected failure(message: string, output?: unknown): AgentResult {
    return {
      success: false,
      output: output ?? { error: message },
    };
  }

  // Validate that the agent has required skills
  validateSkills(): string[] {
    const registry = getSkillRegistry();
    const missing: string[] = [];

    for (const skillName of this.skills) {
      if (!registry.hasSkill(skillName)) {
        missing.push(skillName);
      }
    }

    return missing;
  }
}
