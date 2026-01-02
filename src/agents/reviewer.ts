import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class ReviewerAgent extends BaseAgent {
  readonly name = 'reviewer';
  readonly description = 'Code review, security review, architecture review, and quality assessment';
  readonly skills = [
    'code-review-patterns',
    'security-review',
    'test-patterns',
  ];
  readonly mcpServers = ['github'];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`Reviewer agent executing task: ${context.task}`);

    try {
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('security') || taskLower.includes('vulnerability') || taskLower.includes('audit')) {
        return await this.securityReview(context);
      }

      if (taskLower.includes('test') || taskLower.includes('coverage')) {
        return await this.testReview(context);
      }

      // Default: code review
      return await this.codeReview(context);
    } catch (error) {
      this.logger.error('Reviewer agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Review failed'
      );
    }
  }

  private async codeReview(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('code-review-patterns', {
      task: context.task,
      projectContext: context.projectContext,
      previousOutput: context.previousAgentOutput,
    }, context);

    const output = result as { issues?: unknown[]; suggestions?: unknown[] };
    const hasIssues = output?.issues && output.issues.length > 0;

    return this.success(result, {
      suggestedNextAgent: hasIssues ? 'coder' : undefined, // Send back to coder if issues found
      artifacts: [{
        type: 'report',
        name: 'code-review.md',
        content: typeof result === 'object' && result !== null && 'report' in result
          ? String((result as { report: unknown }).report)
          : JSON.stringify(result, null, 2),
      }],
    });
  }

  private async securityReview(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('security-review', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    const output = result as { vulnerabilities?: unknown[] };
    const hasVulnerabilities = output?.vulnerabilities && output.vulnerabilities.length > 0;

    return this.success(result, {
      suggestedNextAgent: hasVulnerabilities ? 'coder' : undefined,
      artifacts: [{
        type: 'report',
        name: 'security-review.md',
        content: typeof result === 'object' && result !== null && 'report' in result
          ? String((result as { report: unknown }).report)
          : JSON.stringify(result, null, 2),
      }],
    });
  }

  private async testReview(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('test-patterns', {
      task: context.task,
      mode: 'review',
      projectContext: context.projectContext,
    }, context);

    const output = result as { gaps?: unknown[] };
    const hasGaps = output?.gaps && output.gaps.length > 0;

    return this.success(result, {
      suggestedNextAgent: hasGaps ? 'tester' : undefined,
    });
  }
}
