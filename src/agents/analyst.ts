import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class AnalystAgent extends BaseAgent {
  readonly name = 'analyst';
  readonly description = 'Data analysis, metrics evaluation, pattern recognition, and insight generation';
  readonly skills = [
    'embedding-comparison',
    'knowledge-ingestion-patterns',
    'task-decomposition',
    'troubleshooting',
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`Analyst agent executing task: ${context.task}`);

    try {
      // Determine the type of analysis needed
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('troubleshoot') || taskLower.includes('debug') || taskLower.includes('issue')) {
        return await this.troubleshoot(context);
      }

      if (taskLower.includes('compare') || taskLower.includes('similarity')) {
        return await this.compareEmbeddings(context);
      }

      if (taskLower.includes('decompose') || taskLower.includes('break down')) {
        return await this.decomposeTask(context);
      }

      // Default: general analysis
      return await this.analyze(context);
    } catch (error) {
      this.logger.error('Analyst agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Analysis failed'
      );
    }
  }

  private async troubleshoot(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('troubleshooting', {
      problem: context.task,
      context: context.projectContext,
      previousOutput: context.previousAgentOutput,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'coder', // Suggest coder to implement fix
    });
  }

  private async compareEmbeddings(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('embedding-comparison', {
      query: context.task,
      collection: context.chromaCollection,
    }, context);

    return this.success(result);
  }

  private async decomposeTask(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('task-decomposition', {
      task: context.task,
      context: context.projectContext,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'planner', // Suggest planner to create plan from tasks
    });
  }

  private async analyze(context: AgentContext): Promise<AgentResult> {
    // General analysis using knowledge ingestion patterns
    const result = await this.invokeSkill('knowledge-ingestion-patterns', {
      input: context.task,
      mode: 'analyze',
    }, context);

    return this.success(result);
  }
}
