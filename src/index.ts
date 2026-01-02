import { Command } from 'commander';
import { createLogger, logger } from './utils/logger.js';
import { loadAllConfigs, loadSkillsConfig, loadMCPServersConfig } from './utils/config.js';
import { env } from './utils/env.js';
import { createOrchestrator, Orchestrator } from './orchestrator.js';
import { HookManager } from './hooks/index.js';
import { sessionStartHook } from './hooks/session-start.js';
import { sessionEndHook } from './hooks/session-end.js';
import { preAgentHandoffHook } from './hooks/pre-agent-handoff.js';
import { postToolCallHook } from './hooks/post-tool-call.js';
import { errorHook } from './hooks/error.js';
import { fileUploadHook } from './hooks/file-upload.js';
import { createSkillLoader } from './skills/loader.js';
import { getMCPServerManager } from './mcp/config.js';
import {
  gitconfig,
  formatGitConfigOutput,
  certcollect,
  formatCertCollectOutput,
  audit,
  auditHookHandler,
} from './commands/index.js';

// Re-export all modules for external use
export * from './types/index.js';
export * from './agents/index.js';
export * from './hooks/index.js';
export * from './skills/index.js';
export * from './storage/index.js';
export * from './mcp/index.js';
export * from './orchestrator.js';
export * from './commands/index.js';
export { env, logger };

const log = createLogger('main');

export interface ReflexPlugin {
  orchestrator: Orchestrator;
  hookManager: HookManager;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  executeCommand(command: string, args?: string[]): Promise<unknown>;
  routeTask(task: string, preferredAgent?: string): Promise<unknown>;
}

export async function createReflexPlugin(): Promise<ReflexPlugin> {
  log.info('Creating Reflex plugin...');

  // Load configurations
  const configs = loadAllConfigs();

  // Create orchestrator
  const orchestrator = createOrchestrator({
    defaultAgent: configs.agents.orchestrator.default_agent,
    maxHandoffDepth: configs.agents.orchestrator.max_handoff_depth,
    timeoutMs: configs.agents.orchestrator.timeout_ms,
  });

  const hookManager = orchestrator.getHookManager();

  // Register built-in hooks
  hookManager.register('session_start', sessionStartHook);
  hookManager.register('session_end', sessionEndHook);
  hookManager.register('pre_agent_handoff', preAgentHandoffHook);
  hookManager.register('post_tool_call', postToolCallHook);
  hookManager.register('error', errorHook);
  hookManager.register('file_upload', fileUploadHook);

  // Register audit hook for all events (will only log if audit is active)
  hookManager.register('session_start', auditHookHandler);
  hookManager.register('session_end', auditHookHandler);
  hookManager.register('pre_agent_handoff', auditHookHandler);
  hookManager.register('post_tool_call', auditHookHandler);
  hookManager.register('error', auditHookHandler);

  // Load skills
  const skillLoader = createSkillLoader(configs.skills.skills_base_path);
  await skillLoader.loadSkills(configs.skills);

  // Load MCP server configurations
  const mcpManager = getMCPServerManager();
  mcpManager.loadConfigs(configs.mcpServers);

  const plugin: ReflexPlugin = {
    orchestrator,
    hookManager,

    async initialize(): Promise<void> {
      log.info('Initializing Reflex plugin...');
      await orchestrator.initialize();
      log.info('Reflex plugin initialized');
    },

    async shutdown(): Promise<void> {
      log.info('Shutting down Reflex plugin...');
      await orchestrator.shutdown();
      log.info('Reflex plugin shut down');
    },

    async executeCommand(command: string, args: string[] = []): Promise<unknown> {
      log.debug(`Executing command: ${command}`, { args });

      switch (command) {
        case 'gitconfig':
        case 'gc': {
          const verbose = args.includes('-v') || args.includes('--verbose');
          const result = await gitconfig({ verbose });
          return formatGitConfigOutput(result, verbose);
        }

        case 'certcollect': {
          const verbose = args.includes('-v') || args.includes('--verbose');
          const chain = args.includes('-c') || args.includes('--chain');

          // Find URL argument (first non-flag argument)
          const url = args.find((a) => !a.startsWith('-'));
          if (!url) {
            return 'Error: URL required. Usage: certcollect <url> [-v] [-c]';
          }

          // Find output directory
          const outputIdx = args.findIndex((a) => a === '-o' || a === '--output');
          const output = outputIdx !== -1 && args[outputIdx + 1] ? args[outputIdx + 1] : undefined;

          // Find format
          const formatIdx = args.findIndex((a) => a === '-f' || a === '--format');
          const format = formatIdx !== -1 && args[formatIdx + 1]
            ? (args[formatIdx + 1] as 'pem' | 'der' | 'both')
            : undefined;

          const result = await certcollect({ url }, { verbose, chain, output, format });
          return formatCertCollectOutput(result, verbose);
        }

        case 'audit': {
          const subcommand = args[0] as 'on' | 'off' | 'status' | 'export' | undefined;
          if (!subcommand || !['on', 'off', 'status', 'export'].includes(subcommand)) {
            return 'Error: Subcommand required. Usage: audit <on|off|status|export> [-v] [-o path] [-f format]';
          }

          const verbose = args.includes('-v') || args.includes('--verbose');

          const outputIdx = args.findIndex((a) => a === '-o' || a === '--output');
          const output = outputIdx !== -1 && args[outputIdx + 1] ? args[outputIdx + 1] : undefined;

          const formatIdx = args.findIndex((a) => a === '-f' || a === '--format');
          const format = formatIdx !== -1 && args[formatIdx + 1]
            ? (args[formatIdx + 1] as 'json' | 'markdown' | 'text')
            : undefined;

          const result = await audit(subcommand, { verbose, output, format });
          return result.message;
        }

        default:
          return `Unknown command: ${command}`;
      }
    },

    async routeTask(task: string, preferredAgent?: string): Promise<unknown> {
      const result = await orchestrator.routeTask(task, preferredAgent);
      return result;
    },
  };

  return plugin;
}

// CLI entry point
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('reflex')
    .description('Reflex - Claude Code Plugin for Application Development, IaC, and Data Engineering')
    .version('0.1.0');

  program
    .command('gitconfig')
    .alias('gc')
    .description('Display git configuration information')
    .option('-v, --verbose', 'Show all configuration with sources')
    .option('-s, --simple', 'Show essential info only (default)')
    .action(async (options) => {
      const result = await gitconfig(options);
      console.log(formatGitConfigOutput(result, options.verbose));
    });

  program
    .command('certcollect <url>')
    .description('Collect SSL/TLS certificates from websites')
    .option('-v, --verbose', 'Show certificate details')
    .option('-s, --simple', 'Just save files (default)')
    .option('-o, --output <path>', 'Output directory')
    .option('-c, --chain', 'Include full certificate chain')
    .option('-f, --format <format>', 'Output format (pem, der, both)')
    .action(async (url, options) => {
      const result = await certcollect({ url }, options);
      console.log(formatCertCollectOutput(result, options.verbose));
    });

  program
    .command('audit <command>')
    .description('Enable/disable session auditing')
    .option('-v, --verbose', 'Log all details including tool outputs')
    .option('-s, --simple', 'Log actions only (default)')
    .option('-o, --output <path>', 'Custom log file path')
    .option('-f, --format <format>', 'Log format (json, markdown, text)')
    .action(async (command, options) => {
      const result = await audit(command, options);
      console.log(result.message);
    });

  program
    .command('task <task>')
    .description('Route a task to the appropriate agent')
    .option('-a, --agent <name>', 'Specify preferred agent')
    .action(async (task, options) => {
      const plugin = await createReflexPlugin();
      await plugin.initialize();

      try {
        const result = await plugin.routeTask(task, options.agent);
        console.log(JSON.stringify(result, null, 2));
      } finally {
        await plugin.shutdown();
      }
    });

  program
    .command('agents')
    .description('List available agents')
    .action(async () => {
      const plugin = await createReflexPlugin();
      const agents = plugin.orchestrator.listAgents();

      console.log('Available Agents:');
      console.log('=================\n');

      for (const agent of agents) {
        console.log(`${agent.name}`);
        console.log(`  ${agent.description}`);
        console.log(`  Skills: ${agent.skills.join(', ')}`);
        console.log('');
      }
    });

  program
    .command('mcp')
    .description('List configured MCP servers')
    .action(async () => {
      const configs = loadAllConfigs();
      const mcpManager = getMCPServerManager();
      mcpManager.loadConfigs(configs.mcpServers);

      const servers = mcpManager.listServers();

      console.log('Configured MCP Servers:');
      console.log('=======================\n');

      for (const server of servers) {
        const config = mcpManager.getServerConfig(server.name);
        console.log(`${server.name}`);
        console.log(`  Type: ${server.type}`);
        if (config?.command) {
          console.log(`  Command: ${config.command} ${config.args?.join(' ') || ''}`);
        }
        if (config?.url) {
          console.log(`  URL: ${config.url}`);
        }
        console.log('');
      }
    });

  await program.parseAsync(process.argv);
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
