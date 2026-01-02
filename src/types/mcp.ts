import type { JSONSchema7 } from 'json-schema';

export type JSONSchema = JSONSchema7;

export interface MCPServerConfig {
  name: string;
  type: 'http' | 'stdio';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  toolsets?: string[];
  auth?: AuthConfig;
}

export interface AuthConfig {
  type: 'oauth' | 'token' | 'none';
  tokenEnvVar?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

export interface MCPServersConfig {
  servers: MCPServerConfig[];
}
