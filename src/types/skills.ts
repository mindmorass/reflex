import type { JSONSchema7 } from 'json-schema';

export type JSONSchema = JSONSchema7;

export interface Skill {
  name: string;
  description: string;
  version: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  cacheable: boolean;
  cacheTTL?: number;
  execute: (input: unknown, context: SkillContext) => Promise<unknown>;
}

export interface SkillContext {
  chromaCollection: string;
  sessionId: string;
  projectId: string;
  agent?: string;
}

export interface SkillInfo {
  name: string;
  description: string;
  version: string;
  cacheable: boolean;
}

export interface SkillConfig {
  name: string;
  path: string;
}

export interface SkillsConfig {
  skills_base_path: string;
  skills: SkillConfig[];
}
