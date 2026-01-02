import { randomUUID } from 'crypto';
import { createLogger } from './utils/logger.js';
import { env } from './utils/env.js';
import { HookManager } from './hooks/index.js';
import { getChromaClient, ChromaDBClient } from './storage/client.js';
import { getSkillRegistry, SkillRegistry } from './skills/registry.js';
import { getMCPServerManager, MCPServerManager } from './mcp/config.js';
import { BaseAgent, createAllAgents } from './agents/index.js';
import type {
  AgentContext,
  AgentResult,
  HandoffRequest,
  ProjectContext,
} from './types/agents.js';
import type { SkillContext } from './types/skills.js';

const logger = createLogger('orchestrator');

export interface OrchestratorConfig {
  defaultAgent: string;
  maxHandoffDepth: number;
  timeoutMs: number;
}

export class Orchestrator {
  private agents: Map<string, BaseAgent>;
  private hookManager: HookManager;
  private chromaClient: ChromaDBClient;
  private skillRegistry: SkillRegistry;
  private mcpManager: MCPServerManager;
  private config: OrchestratorConfig;
  private currentProject: string;
  private sessionId: string;
  private handoffDepth: number = 0;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.sessionId = randomUUID();
    this.currentProject = env.projectId;

    // Initialize components
    this.agents = createAllAgents();
    this.hookManager = new HookManager(this.sessionId, this.currentProject);
    this.chromaClient = getChromaClient();
    this.skillRegistry = getSkillRegistry();
    this.mcpManager = getMCPServerManager();

    // Set up agent event listeners
    this.setupAgentListeners();

    logger.info('Orchestrator initialized', {
      sessionId: this.sessionId,
      project: this.currentProject,
      agentCount: this.agents.size,
    });
  }

  private setupAgentListeners(): void {
    for (const [name, agent] of this.agents) {
      agent.on('handoff', async (request: HandoffRequest) => {
        logger.debug(`Received handoff request from ${name}`, request);
        // Handoff handling is done in routeTask after agent execution
      });
    }
  }

  async initialize(): Promise<void> {
    // Initialize ChromaDB
    await this.chromaClient.initialize();

    // Fire session start hook
    await this.hookManager.emit('session_start', {
      sessionId: this.sessionId,
      projectId: this.currentProject,
    });

    logger.info('Orchestrator session started');
  }

  async shutdown(): Promise<void> {
    // Fire session end hook
    await this.hookManager.emit('session_end', {
      sessionId: this.sessionId,
      projectId: this.currentProject,
    });

    // Stop all MCP servers
    await this.mcpManager.stopAllServers();

    logger.info('Orchestrator session ended');
  }

  setProject(projectId: string): void {
    this.currentProject = projectId;
    this.hookManager.setProjectId(projectId);
    logger.info(`Project set to: ${projectId}`);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getProject(): string {
    return this.currentProject;
  }

  getHookManager(): HookManager {
    return this.hookManager;
  }

  async routeTask(
    task: string,
    preferredAgent?: string,
    projectContext?: Partial<ProjectContext>
  ): Promise<AgentResult> {
    const startTime = Date.now();
    this.handoffDepth = 0;

    // Determine which agent to use
    const agentName = preferredAgent || await this.determineAgent(task);
    const agent = this.agents.get(agentName);

    if (!agent) {
      logger.error(`Agent not found: ${agentName}`);
      return {
        success: false,
        output: { error: `Agent not found: ${agentName}` },
      };
    }

    // Create agent context
    const context: AgentContext = {
      task,
      projectContext: {
        projectId: this.currentProject,
        workingDirectory: process.cwd(),
        ...projectContext,
      },
      chromaCollection: `reflex_${this.currentProject}`,
      sessionId: this.sessionId,
    };

    // Start required MCP servers for this agent
    if (agent.mcpServers && agent.mcpServers.length > 0) {
      await this.mcpManager.startServers(agent.mcpServers);
    }

    logger.info(`Routing task to agent: ${agentName}`, { task });

    try {
      // Execute agent
      let result = await this.executeWithTimeout(agent, context);

      // Handle handoffs
      while (result.suggestedNextAgent && this.handoffDepth < this.config.maxHandoffDepth) {
        result = await this.handleHandoff(
          {
            targetAgent: result.suggestedNextAgent,
            reason: 'Agent suggested handoff',
            context: result.handoffContext,
          },
          result,
          context
        );
      }

      // Cache results to ChromaDB
      await this.cacheResult(task, result);

      const duration = Date.now() - startTime;
      result.duration_ms = duration;

      logger.info(`Task completed`, { agent: agentName, duration, success: result.success });

      return result;
    } catch (error) {
      logger.error(`Task execution failed`, error);

      await this.hookManager.emit('error', {
        originalEvent: 'route_task',
        error,
        context: { task, agent: agentName },
      });

      return {
        success: false,
        output: { error: error instanceof Error ? error.message : 'Task execution failed' },
        duration_ms: Date.now() - startTime,
      };
    }
  }

  private async executeWithTimeout(agent: BaseAgent, context: AgentContext): Promise<AgentResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Agent ${agent.name} timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      agent
        .execute(context)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async handleHandoff(
    request: HandoffRequest,
    previousResult: AgentResult,
    originalContext: AgentContext
  ): Promise<AgentResult> {
    this.handoffDepth++;

    // Fire pre-handoff hook
    await this.hookManager.emit('pre_agent_handoff', {
      request,
      sourceAgent: originalContext.metadata?.currentAgent,
      previousResult,
    });

    const targetAgent = this.agents.get(request.targetAgent);

    if (!targetAgent) {
      logger.error(`Handoff target not found: ${request.targetAgent}`);
      return previousResult;
    }

    logger.info(`Handling handoff to ${request.targetAgent}`, {
      reason: request.reason,
      depth: this.handoffDepth,
    });

    // Start required MCP servers for target agent
    if (targetAgent.mcpServers && targetAgent.mcpServers.length > 0) {
      await this.mcpManager.startServers(targetAgent.mcpServers);
    }

    // Create context for target agent
    const targetContext: AgentContext = {
      ...originalContext,
      previousAgentOutput: previousResult.output,
      metadata: {
        ...originalContext.metadata,
        currentAgent: request.targetAgent,
        handoffDepth: this.handoffDepth,
        handoffContext: request.context,
      },
    };

    return this.executeWithTimeout(targetAgent, targetContext);
  }

  private async determineAgent(task: string): Promise<string> {
    // Simple keyword-based routing
    const taskLower = task.toLowerCase();

    if (taskLower.includes('analyze') || taskLower.includes('metrics') || taskLower.includes('troubleshoot')) {
      return 'analyst';
    }

    if (taskLower.includes('code') || taskLower.includes('implement') || taskLower.includes('refactor')) {
      return 'coder';
    }

    if (taskLower.includes('deploy') || taskLower.includes('pipeline') || taskLower.includes('infrastructure')) {
      return 'devops';
    }

    if (taskLower.includes('harvest') || taskLower.includes('collect') || taskLower.includes('scrape')) {
      return 'harvester';
    }

    if (taskLower.includes('research') || taskLower.includes('investigate') || taskLower.includes('compare')) {
      return 'researcher';
    }

    if (taskLower.includes('review') || taskLower.includes('audit') || taskLower.includes('security')) {
      return 'reviewer';
    }

    if (taskLower.includes('test') || taskLower.includes('coverage') || taskLower.includes('qa')) {
      return 'tester';
    }

    if (taskLower.includes('document') || taskLower.includes('write') || taskLower.includes('readme')) {
      return 'writer';
    }

    // Default to planner for task breakdown
    return this.config.defaultAgent;
  }

  private async cacheResult(task: string, result: AgentResult): Promise<void> {
    if (!result.success) return;

    try {
      await this.chromaClient.store(this.currentProject, {
        text: `Task: ${task}\nResult: ${JSON.stringify(result.output)}`,
        type: 'context',
        source: 'orchestrator',
        metadata: {
          sessionId: this.sessionId,
          task,
          success: result.success,
        },
      });
    } catch (error) {
      logger.warn('Failed to cache result', error);
    }
  }

  async invokeSkill(skillName: string, input: unknown): Promise<unknown> {
    const skillContext: SkillContext = {
      chromaCollection: `reflex_${this.currentProject}`,
      sessionId: this.sessionId,
      projectId: this.currentProject,
    };

    const startTime = Date.now();

    try {
      const result = await this.skillRegistry.invokeSkill(skillName, input, skillContext);

      await this.hookManager.emit('post_tool_call', {
        toolName: skillName,
        input,
        output: result,
        duration_ms: Date.now() - startTime,
        success: true,
        cacheable: true,
      });

      return result;
    } catch (error) {
      await this.hookManager.emit('post_tool_call', {
        toolName: skillName,
        input,
        output: error,
        duration_ms: Date.now() - startTime,
        success: false,
      });

      throw error;
    }
  }

  listAgents(): { name: string; description: string; skills: string[] }[] {
    return Array.from(this.agents.values()).map((agent) => ({
      name: agent.name,
      description: agent.description,
      skills: agent.skills,
    }));
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
}

// Factory function
export function createOrchestrator(config?: Partial<OrchestratorConfig>): Orchestrator {
  const defaultConfig: OrchestratorConfig = {
    defaultAgent: 'planner',
    maxHandoffDepth: 5,
    timeoutMs: 300000,
  };

  return new Orchestrator({ ...defaultConfig, ...config });
}
