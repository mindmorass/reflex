import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class PlannerAgent extends BaseAgent {
  readonly name = 'planner';
  readonly description = 'Task breakdown, project planning, roadmap creation, and prioritization';
  readonly skills = [
    'task-decomposition',
    'project-onboarding',
    'workflow-builder',
    'router-builder',
  ];
  readonly mcpServers = ['atlassian', 'azure-devops'];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`Planner agent executing task: ${context.task}`);

    try {
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('onboard') || taskLower.includes('new project')) {
        return await this.onboardProject(context);
      }

      if (taskLower.includes('workflow') || taskLower.includes('process')) {
        return await this.buildWorkflow(context);
      }

      if (taskLower.includes('route') || taskLower.includes('direct') || taskLower.includes('assign')) {
        return await this.buildRouter(context);
      }

      // Default: task decomposition
      return await this.decomposeTasks(context);
    } catch (error) {
      this.logger.error('Planner agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Planning failed'
      );
    }
  }

  private async onboardProject(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('project-onboarding', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      artifacts: [{
        type: 'report',
        name: 'onboarding-checklist.md',
        content: typeof result === 'object' && result !== null && 'checklist' in result
          ? String((result as { checklist: unknown }).checklist)
          : '',
      }],
    });
  }

  private async buildWorkflow(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('workflow-builder', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      artifacts: [{
        type: 'diagram',
        name: 'workflow.mmd',
        content: typeof result === 'object' && result !== null && 'workflow' in result
          ? String((result as { workflow: unknown }).workflow)
          : '',
      }],
    });
  }

  private async buildRouter(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('router-builder', {
      task: context.task,
      agents: ['analyst', 'coder', 'devops', 'harvester', 'planner', 'researcher', 'reviewer', 'tester', 'writer'],
    }, context);

    return this.success(result);
  }

  private async decomposeTasks(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('task-decomposition', {
      task: context.task,
      context: context.projectContext,
    }, context);

    // Determine suggested next agent based on first subtask
    const output = result as { tasks?: Array<{ type?: string }> };
    let suggestedNextAgent: string | undefined;

    if (output?.tasks?.[0]?.type) {
      const taskType = output.tasks[0].type.toLowerCase();
      if (taskType.includes('code') || taskType.includes('implement')) {
        suggestedNextAgent = 'coder';
      } else if (taskType.includes('research') || taskType.includes('investigate')) {
        suggestedNextAgent = 'researcher';
      } else if (taskType.includes('test')) {
        suggestedNextAgent = 'tester';
      } else if (taskType.includes('deploy') || taskType.includes('infra')) {
        suggestedNextAgent = 'devops';
      }
    }

    return this.success(result, { suggestedNextAgent });
  }
}
