#!/usr/bin/env node

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLAUDE_CONFIG_BASE = process.env.CLAUDE_CONFIG_DIR || resolve(homedir(), '.claude');
const CLAUDE_DIR = CLAUDE_CONFIG_BASE;
const CLAUDE_COMMANDS_DIR = resolve(CLAUDE_DIR, 'commands');
const CLAUDE_JSON = resolve(dirname(CLAUDE_CONFIG_BASE), basename(CLAUDE_CONFIG_BASE) + '.json');

const isAuto = process.argv.includes('--auto');
const isUninstall = process.argv.includes('--uninstall');

function log(msg) {
  console.log(`[reflex] ${msg}`);
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

function copyCommand(filename) {
  const src = resolve(__dirname, '.claude', 'commands', filename);
  const dest = resolve(CLAUDE_COMMANDS_DIR, filename);

  if (existsSync(src)) {
    copyFileSync(src, dest);
    log(`Installed command: ${filename}`);
  }
}

function mergeMcpServers() {
  const srcMcp = resolve(__dirname, '.mcp.json');

  if (!existsSync(srcMcp)) {
    log('No .mcp.json found in package');
    return;
  }

  const srcConfig = JSON.parse(readFileSync(srcMcp, 'utf-8'));

  let destConfig = { mcpServers: {} };
  if (existsSync(CLAUDE_JSON)) {
    try {
      destConfig = JSON.parse(readFileSync(CLAUDE_JSON, 'utf-8'));
      if (!destConfig.mcpServers) {
        destConfig.mcpServers = {};
      }
    } catch {
      // Invalid JSON, start fresh
      destConfig = { mcpServers: {} };
    }
  }

  // Merge MCP servers (reflex servers are prefixed)
  for (const [name, config] of Object.entries(srcConfig.mcpServers)) {
    const prefixedName = `reflex-${name}`;
    destConfig.mcpServers[prefixedName] = config;
    log(`Added MCP server: ${prefixedName}`);
  }

  writeFileSync(CLAUDE_JSON, JSON.stringify(destConfig, null, 2));
  log(`Updated ${CLAUDE_JSON}`);
}

function removeMcpServers() {
  if (!existsSync(CLAUDE_JSON)) return;

  try {
    const config = JSON.parse(readFileSync(CLAUDE_JSON, 'utf-8'));
    if (!config.mcpServers) return;

    let removed = 0;
    for (const name of Object.keys(config.mcpServers)) {
      if (name.startsWith('reflex-')) {
        delete config.mcpServers[name];
        removed++;
      }
    }

    if (removed > 0) {
      writeFileSync(CLAUDE_JSON, JSON.stringify(config, null, 2));
      log(`Removed ${removed} MCP servers from ${CLAUDE_JSON}`);
    }
  } catch {
    // Ignore errors
  }
}

function install() {
  log('Installing Reflex for Claude Code...');

  // Create directories
  ensureDir(CLAUDE_DIR);
  ensureDir(CLAUDE_COMMANDS_DIR);

  // Copy slash commands
  const commands = [
    'reflex:gitconfig.md',
    'reflex:certcollect.md',
    'reflex:audit.md',
    'reflex:agents.md',
    'reflex:mcp.md',
    'reflex:task.md',
  ];

  for (const cmd of commands) {
    copyCommand(cmd);
  }

  // Create reflex data directories
  const REFLEX_DIR = resolve(CLAUDE_DIR, 'reflex');
  ensureDir(REFLEX_DIR);
  ensureDir(resolve(REFLEX_DIR, 'skills'));
  ensureDir(resolve(REFLEX_DIR, 'logs'));

  // Merge MCP servers into claude config
  mergeMcpServers();

  log('');
  log('Installation complete!');
  log('');
  log('Available commands in Claude Code:');
  log('  /reflex:gitconfig  - Display git configuration');
  log('  /reflex:certcollect - Collect SSL certificates');
  log('  /reflex:audit      - Control audit logging');
  log('  /reflex:agents     - List available agents');
  log('  /reflex:mcp        - List MCP servers');
  log('  /reflex:task       - Route task to agent');
  log('');
  log('Run /mcp in Claude Code to see configured servers.');
}

function uninstall() {
  log('Uninstalling Reflex from Claude Code...');

  // Remove slash commands
  const commands = [
    'reflex:gitconfig.md',
    'reflex:certcollect.md',
    'reflex:audit.md',
    'reflex:agents.md',
    'reflex:mcp.md',
    'reflex:task.md',
  ];

  for (const cmd of commands) {
    const cmdPath = resolve(CLAUDE_COMMANDS_DIR, cmd);
    if (existsSync(cmdPath)) {
      unlinkSync(cmdPath);
      log(`Removed command: ${cmd}`);
    }
  }

  // Remove MCP servers
  removeMcpServers();

  log('Uninstallation complete!');
}

// Main
if (isUninstall) {
  uninstall();
} else {
  install();

  if (!isAuto) {
    log('');
    log('To uninstall: npx reflex-claude-plugin --uninstall');
  }
}
