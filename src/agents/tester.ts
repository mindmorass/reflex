import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class TesterAgent extends BaseAgent {
  readonly name = 'tester';
  readonly description = 'Test generation, test execution, coverage analysis, and quality assurance';
  readonly skills = [
    'test-patterns',
    'code-review-patterns',
  ];
  readonly mcpServers = ['playwright'];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`Tester agent executing task: ${context.task}`);

    try {
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('generate') || taskLower.includes('create') || taskLower.includes('write')) {
        return await this.generateTests(context);
      }

      if (taskLower.includes('coverage') || taskLower.includes('analyze')) {
        return await this.analyzeCoverage(context);
      }

      if (taskLower.includes('review') || taskLower.includes('assess')) {
        return await this.reviewTests(context);
      }

      // Default: generate tests
      return await this.generateTests(context);
    } catch (error) {
      this.logger.error('Tester agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Testing failed'
      );
    }
  }

  private async generateTests(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('test-patterns', {
      task: context.task,
      mode: 'generate',
      projectContext: context.projectContext,
      previousOutput: context.previousAgentOutput,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'reviewer', // Review the tests
      artifacts: [{
        type: 'code',
        name: 'generated-tests.ts',
        content: typeof result === 'object' && result !== null && 'tests' in result
          ? String((result as { tests: unknown }).tests)
          : '',
      }],
    });
  }

  private async analyzeCoverage(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('test-patterns', {
      task: context.task,
      mode: 'coverage',
      projectContext: context.projectContext,
    }, context);

    const output = result as { coverage?: number; gaps?: string[] };
    const needsMoreTests = output?.coverage !== undefined && output.coverage < 80;

    return this.success(result, {
      suggestedNextAgent: needsMoreTests ? 'tester' : undefined,
      handoffContext: needsMoreTests ? { gaps: output?.gaps } : undefined,
      artifacts: [{
        type: 'report',
        name: 'coverage-report.md',
        content: typeof result === 'object' && result !== null && 'report' in result
          ? String((result as { report: unknown }).report)
          : JSON.stringify(result, null, 2),
      }],
    });
  }

  private async reviewTests(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('code-review-patterns', {
      task: context.task,
      mode: 'test-review',
      projectContext: context.projectContext,
    }, context);

    return this.success(result);
  }
}
