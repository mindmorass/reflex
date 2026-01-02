import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class CoderAgent extends BaseAgent {
  readonly name = 'coder';
  readonly description = 'Write, modify, and refactor application code across languages and frameworks';
  readonly skills = [
    'microsoft-code-reference',
    'test-patterns',
    'docker-patterns',
    'ci-cd-patterns',
  ];
  readonly mcpServers = ['github', 'git'];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`Coder agent executing task: ${context.task}`);

    try {
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('docker') || taskLower.includes('container')) {
        return await this.handleDocker(context);
      }

      if (taskLower.includes('test') || taskLower.includes('spec')) {
        return await this.handleTests(context);
      }

      if (taskLower.includes('ci') || taskLower.includes('cd') || taskLower.includes('pipeline')) {
        return await this.handleCICD(context);
      }

      // Default: code implementation
      return await this.implementCode(context);
    } catch (error) {
      this.logger.error('Coder agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Code implementation failed'
      );
    }
  }

  private async handleDocker(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('docker-patterns', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      artifacts: [{
        type: 'file',
        name: 'Dockerfile',
        content: typeof result === 'object' && result !== null && 'dockerfile' in result
          ? String((result as { dockerfile: unknown }).dockerfile)
          : '',
      }],
    });
  }

  private async handleTests(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('test-patterns', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'tester', // Suggest tester to run the tests
    });
  }

  private async handleCICD(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('ci-cd-patterns', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'devops', // Suggest devops to deploy
    });
  }

  private async implementCode(context: AgentContext): Promise<AgentResult> {
    // Use microsoft code reference for implementation guidance
    const result = await this.invokeSkill('microsoft-code-reference', {
      query: context.task,
      context: context.projectContext,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'reviewer', // Suggest reviewer to review code
    });
  }
}
