import { spawn, ChildProcess } from 'child_process';
import { createLogger } from '../utils/logger.js';
import { expandEnvVars } from '../utils/env.js';
import type { MCPServerConfig, MCPServersConfig } from '../types/mcp.js';

const logger = createLogger('mcp:config');

interface MCPServerState {
  config: MCPServerConfig;
  process?: ChildProcess;
  status: 'stopped' | 'starting' | 'running' | 'error';
  error?: Error;
}

export class MCPServerManager {
  private servers: Map<string, MCPServerState>;

  constructor() {
    this.servers = new Map();
  }

  loadConfigs(config: MCPServersConfig): void {
    for (const serverConfig of config.servers) {
      this.servers.set(serverConfig.name, {
        config: this.expandConfig(serverConfig),
        status: 'stopped',
      });
    }
    logger.info(`Loaded ${config.servers.length} MCP server configurations`);
  }

  private expandConfig(config: MCPServerConfig): MCPServerConfig {
    const expanded: MCPServerConfig = { ...config };

    if (expanded.url) {
      expanded.url = expandEnvVars(expanded.url);
    }

    if (expanded.env) {
      const expandedEnv: Record<string, string> = {};
      for (const [key, value] of Object.entries(expanded.env)) {
        expandedEnv[key] = expandEnvVars(value);
      }
      expanded.env = expandedEnv;
    }

    return expanded;
  }

  getServerConfig(name: string): MCPServerConfig | undefined {
    return this.servers.get(name)?.config;
  }

  getServerStatus(name: string): MCPServerState['status'] | undefined {
    return this.servers.get(name)?.status;
  }

  listServers(): { name: string; type: string; status: MCPServerState['status'] }[] {
    return Array.from(this.servers.entries()).map(([name, state]) => ({
      name,
      type: state.config.type,
      status: state.status,
    }));
  }

  async startServer(name: string): Promise<boolean> {
    const state = this.servers.get(name);

    if (!state) {
      logger.error(`Server not found: ${name}`);
      return false;
    }

    if (state.status === 'running') {
      logger.debug(`Server ${name} already running`);
      return true;
    }

    const { config } = state;

    if (config.type === 'http') {
      // HTTP servers don't need to be started - they're remote
      state.status = 'running';
      logger.info(`HTTP server ${name} marked as running`);
      return true;
    }

    if (config.type === 'stdio' && config.command) {
      try {
        state.status = 'starting';
        let hasError = false;

        const env = {
          ...process.env,
          ...config.env,
        };

        state.process = spawn(config.command, config.args || [], {
          env,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        state.process.on('error', (error) => {
          logger.error(`Server ${name} process error`, error);
          state.status = 'error';
          state.error = error;
          hasError = true;
        });

        state.process.on('exit', (code) => {
          logger.debug(`Server ${name} exited with code ${code}`);
          state.status = 'stopped';
          state.process = undefined;
        });

        // Give it a moment to start
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!hasError) {
          state.status = 'running';
          logger.info(`Started stdio server: ${name}`);
          return true;
        }
      } catch (error) {
        logger.error(`Failed to start server ${name}`, error);
        state.status = 'error';
        state.error = error instanceof Error ? error : new Error(String(error));
      }
    }

    return false;
  }

  async stopServer(name: string): Promise<boolean> {
    const state = this.servers.get(name);

    if (!state) {
      logger.error(`Server not found: ${name}`);
      return false;
    }

    if (state.status === 'stopped') {
      return true;
    }

    if (state.config.type === 'http') {
      state.status = 'stopped';
      return true;
    }

    if (state.process) {
      state.process.kill();
      state.process = undefined;
      state.status = 'stopped';
      logger.info(`Stopped server: ${name}`);
      return true;
    }

    return false;
  }

  async startServers(names: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const name of names) {
      const success = await this.startServer(name);
      results.set(name, success);
    }

    return results;
  }

  async stopAllServers(): Promise<void> {
    const promises: Promise<boolean>[] = [];

    for (const [name, state] of this.servers) {
      if (state.status === 'running') {
        promises.push(this.stopServer(name));
      }
    }

    await Promise.all(promises);
    logger.info('Stopped all MCP servers');
  }

  getServersForAgent(agentMcpServers: string[]): MCPServerConfig[] {
    return agentMcpServers
      .map((name) => this.servers.get(name)?.config)
      .filter((config): config is MCPServerConfig => config !== undefined);
  }
}

// Singleton instance
let mcpManager: MCPServerManager | null = null;

export function getMCPServerManager(): MCPServerManager {
  if (!mcpManager) {
    mcpManager = new MCPServerManager();
  }
  return mcpManager;
}
