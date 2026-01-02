import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { expandEnvVars } from './env.js';
import { createLogger } from './logger.js';
import type { AgentConfig } from '../types/agents.js';
import type { SkillsConfig } from '../types/skills.js';
import type { HooksConfig } from '../types/hooks.js';
import type { MCPServersConfig } from '../types/mcp.js';

const logger = createLogger('config');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configDir = resolve(__dirname, '../../config');

function loadYamlConfig<T>(filename: string): T {
  const filePath = resolve(configDir, filename);

  if (!existsSync(filePath)) {
    throw new Error(`Configuration file not found: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const expanded = expandEnvVars(content);
    return parseYaml(expanded) as T;
  } catch (error) {
    logger.error(`Failed to load config: ${filename}`, error);
    throw error;
  }
}

interface AgentsYamlConfig {
  orchestrator: {
    default_agent: string;
    max_handoff_depth: number;
    timeout_ms: number;
  };
  agents: Record<string, {
    description: string;
    skills: string[];
    mcp_servers: string[];
  }>;
}

export function loadAgentsConfig(): { orchestrator: AgentsYamlConfig['orchestrator']; agents: AgentConfig[] } {
  const config = loadYamlConfig<AgentsYamlConfig>('agents.yaml');

  const agents: AgentConfig[] = Object.entries(config.agents).map(([name, cfg]) => ({
    name,
    description: cfg.description,
    skills: cfg.skills,
    mcpServers: cfg.mcp_servers,
  }));

  return {
    orchestrator: config.orchestrator,
    agents,
  };
}

export function loadSkillsConfig(): SkillsConfig {
  return loadYamlConfig<SkillsConfig>('skills.yaml');
}

export function loadHooksConfig(): HooksConfig {
  return loadYamlConfig<HooksConfig>('hooks.yaml');
}

export function loadMCPServersConfig(): MCPServersConfig {
  return loadYamlConfig<MCPServersConfig>('mcp-servers.yaml');
}

export function loadAllConfigs() {
  return {
    agents: loadAgentsConfig(),
    skills: loadSkillsConfig(),
    hooks: loadHooksConfig(),
    mcpServers: loadMCPServersConfig(),
  };
}
