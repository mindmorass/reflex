import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class HarvesterAgent extends BaseAgent {
  readonly name = 'harvester';
  readonly description = 'Collect and process data from external sources: web, APIs, documents, media';
  readonly skills = [
    'github-harvester',
    'pdf-harvester',
    'site-crawler',
    'youtube-harvester',
    'knowledge-ingestion-patterns',
  ];
  readonly mcpServers = ['markitdown'];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`Harvester agent executing task: ${context.task}`);

    try {
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('github') || taskLower.includes('repo')) {
        return await this.harvestGitHub(context);
      }

      if (taskLower.includes('pdf') || taskLower.includes('document')) {
        return await this.harvestPDF(context);
      }

      if (taskLower.includes('youtube') || taskLower.includes('video')) {
        return await this.harvestYouTube(context);
      }

      if (taskLower.includes('website') || taskLower.includes('crawl') || taskLower.includes('scrape')) {
        return await this.crawlSite(context);
      }

      // Default: general knowledge ingestion
      return await this.ingestKnowledge(context);
    } catch (error) {
      this.logger.error('Harvester agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Harvesting failed'
      );
    }
  }

  private async harvestGitHub(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('github-harvester', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'analyst', // Analyze harvested data
    });
  }

  private async harvestPDF(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('pdf-harvester', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'researcher', // Research the content
    });
  }

  private async harvestYouTube(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('youtube-harvester', {
      task: context.task,
    }, context);

    return this.success(result);
  }

  private async crawlSite(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('site-crawler', {
      task: context.task,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'writer', // Document findings
    });
  }

  private async ingestKnowledge(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('knowledge-ingestion-patterns', {
      input: context.task,
      mode: 'ingest',
    }, context);

    return this.success(result);
  }
}
