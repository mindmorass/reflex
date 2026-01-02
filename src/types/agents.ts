export interface AgentContext {
  task: string;
  projectContext: ProjectContext;
  previousAgentOutput?: unknown;
  chromaCollection: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectContext {
  projectId: string;
  workingDirectory: string;
  gitBranch?: string;
  files?: FileInfo[];
  recentActions?: ActionHistory[];
}

export interface FileInfo {
  path: string;
  type: string;
  size?: number;
  modified?: Date;
}

export interface ActionHistory {
  timestamp: Date;
  action: string;
  agent?: string;
  result?: unknown;
}

export interface AgentResult {
  success: boolean;
  output: unknown;
  artifacts?: Artifact[];
  suggestedNextAgent?: string;
  handoffContext?: unknown;
  tokensUsed?: number;
  duration_ms?: number;
}

export interface Artifact {
  type: 'file' | 'code' | 'diagram' | 'report';
  name: string;
  content: string | Buffer;
  metadata?: Record<string, unknown>;
}

export interface HandoffRequest {
  targetAgent: string;
  reason: string;
  context: unknown;
  priority?: 'low' | 'normal' | 'high';
}

export interface AgentConfig {
  name: string;
  description: string;
  skills: string[];
  mcpServers: string[];
}
