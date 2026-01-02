import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class DevOpsAgent extends BaseAgent {
  readonly name = 'devops';
  readonly description = 'Infrastructure as Code, CI/CD pipelines, deployment, and operations';
  readonly skills = [
    'ci-cd-patterns',
    'docker-patterns',
    'workspace-builder',
    'workflow-builder',
  ];
  readonly mcpServers = ['azure', 'azure-devops', 'github'];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`DevOps agent executing task: ${context.task}`);

    try {
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('workspace') || taskLower.includes('dev environment')) {
        return await this.buildWorkspace(context);
      }

      if (taskLower.includes('workflow') || taskLower.includes('automation')) {
        return await this.buildWorkflow(context);
      }

      if (taskLower.includes('docker') || taskLower.includes('container')) {
        return await this.handleDocker(context);
      }

      // Default: CI/CD pipeline
      return await this.buildPipeline(context);
    } catch (error) {
      this.logger.error('DevOps agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'DevOps task failed'
      );
    }
  }

  private async buildWorkspace(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('workspace-builder', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      artifacts: [{
        type: 'file',
        name: 'devcontainer.json',
        content: typeof result === 'object' && result !== null && 'devcontainer' in result
          ? JSON.stringify((result as { devcontainer: unknown }).devcontainer, null, 2)
          : '',
      }],
    });
  }

  private async buildWorkflow(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('workflow-builder', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result);
  }

  private async handleDocker(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('docker-patterns', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result);
  }

  private async buildPipeline(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('ci-cd-patterns', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      artifacts: [{
        type: 'file',
        name: 'azure-pipelines.yml',
        content: typeof result === 'object' && result !== null && 'pipeline' in result
          ? String((result as { pipeline: unknown }).pipeline)
          : '',
      }],
    });
  }
}
