import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/agents.js';

export class WriterAgent extends BaseAgent {
  readonly name = 'writer';
  readonly description = 'Documentation, technical writing, READMEs, and knowledge base articles';
  readonly skills = [
    'doc-sync',
    'joplin-publisher',
    'obsidian-publisher',
    'mermaid-diagrams',
    'graphviz-diagrams',
    'prompt-template',
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info(`Writer agent executing task: ${context.task}`);

    try {
      const taskLower = context.task.toLowerCase();

      if (taskLower.includes('diagram') || taskLower.includes('flowchart') || taskLower.includes('visual')) {
        return await this.createDiagram(context);
      }

      if (taskLower.includes('joplin')) {
        return await this.publishToJoplin(context);
      }

      if (taskLower.includes('obsidian')) {
        return await this.publishToObsidian(context);
      }

      if (taskLower.includes('prompt') || taskLower.includes('template')) {
        return await this.createPromptTemplate(context);
      }

      if (taskLower.includes('sync') || taskLower.includes('update doc')) {
        return await this.syncDocs(context);
      }

      // Default: general documentation
      return await this.writeDocumentation(context);
    } catch (error) {
      this.logger.error('Writer agent failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Writing failed'
      );
    }
  }

  private async createDiagram(context: AgentContext): Promise<AgentResult> {
    const taskLower = context.task.toLowerCase();
    const useMermaid = !taskLower.includes('graphviz') && !taskLower.includes('dot');

    const skillName = useMermaid ? 'mermaid-diagrams' : 'graphviz-diagrams';
    const result = await this.invokeSkill(skillName, {
      task: context.task,
      context: context.previousAgentOutput,
    }, context);

    return this.success(result, {
      artifacts: [{
        type: 'diagram',
        name: useMermaid ? 'diagram.mmd' : 'diagram.dot',
        content: typeof result === 'object' && result !== null && 'diagram' in result
          ? String((result as { diagram: unknown }).diagram)
          : '',
      }],
    });
  }

  private async publishToJoplin(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('joplin-publisher', {
      task: context.task,
      content: context.previousAgentOutput,
    }, context);

    return this.success(result);
  }

  private async publishToObsidian(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('obsidian-publisher', {
      task: context.task,
      content: context.previousAgentOutput,
    }, context);

    return this.success(result);
  }

  private async createPromptTemplate(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('prompt-template', {
      task: context.task,
      context: context.projectContext,
    }, context);

    return this.success(result, {
      artifacts: [{
        type: 'file',
        name: 'prompt-template.md',
        content: typeof result === 'object' && result !== null && 'template' in result
          ? String((result as { template: unknown }).template)
          : '',
      }],
    });
  }

  private async syncDocs(context: AgentContext): Promise<AgentResult> {
    const result = await this.invokeSkill('doc-sync', {
      task: context.task,
      projectContext: context.projectContext,
    }, context);

    return this.success(result);
  }

  private async writeDocumentation(context: AgentContext): Promise<AgentResult> {
    // Use doc-sync for general documentation
    const result = await this.invokeSkill('doc-sync', {
      task: context.task,
      mode: 'write',
      context: context.previousAgentOutput,
      projectContext: context.projectContext,
    }, context);

    return this.success(result, {
      suggestedNextAgent: 'reviewer', // Review the documentation
      artifacts: [{
        type: 'file',
        name: 'documentation.md',
        content: typeof result === 'object' && result !== null && 'document' in result
          ? String((result as { document: unknown }).document)
          : '',
      }],
    });
  }
}
