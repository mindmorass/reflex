export type HookEvent =
  | 'session_start'
  | 'session_end'
  | 'pre_agent_handoff'
  | 'post_tool_call'
  | 'error'
  | 'file_upload';

export interface HookContext {
  sessionId: string;
  projectId: string;
  timestamp: Date;
  event: HookEvent;
  data: unknown;
}

export type HookHandler = (context: HookContext) => Promise<void>;

export interface HookConfig {
  enabled: boolean;
  handlers: string[];
}

export interface HooksConfig {
  hooks: Record<HookEvent, HookConfig>;
}
