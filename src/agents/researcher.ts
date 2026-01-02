import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class ResearcherAgent extends BaseAgent {
  readonly name = 'researcher';
  readonly description = 'Deep investigation, option comparison, context gathering, and documentation review';
  readonly skills = [
    'microsoft-docs',
    'site-crawler',
    'knowledge-ingestion-patterns',
    'embedding-comparison',
  ];
  readonly mcpServers = ['microsoft-docs'];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`Researcher agent executing task: ${context.task}`);

    try {
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('microsoft') || taskLower.includes('azure') || taskLower.includes('.net')) {
        return await this.searchMicrosoftDocs(context);
      }

      if (taskLower.includes('compare') || taskLower.includes('alternative') || taskLower.includes('option')) {
        return await this.compareOptions(context);
      }

      if (taskLower.includes('website') || taskLower.includes('url') || taskLower.includes('page')) {
        return await this.crawlForResearch(context);
      }

      // Default: general research
      return await this.generalResearch(context);
    } catch (error) {
      this.logger.error('Researcher agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Research failed'
      );
    }
  }

  private async searchMicrosoftDocs(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('microsoft-docs', {
      query: context.task,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'coder', // Implement based on docs
    });
  }

  private async compareOptions(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('embedding-comparison', {
      query: context.task,
      collection: context.chromaCollection,
    }, context);

    return this.success(result, {
      artifacts: [{
        type: 'report',
        name: 'comparison-report.md',
        content: typeof result === 'object' && result !== null && 'report' in result
          ? String((result as { report: unknown }).report)
          : JSON.stringify(result, null, 2),
      }],
    });
  }

  private async crawlForResearch(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('site-crawler', {
      task: context.task,
      mode: 'research',
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'writer', // Document findings
    });
  }

  private async generalResearch(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('knowledge-ingestion-patterns', {
      input: context.task,
      mode: 'research',
    }, context);

    return this.success(result);
  }
}
