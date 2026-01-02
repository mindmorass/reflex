import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('commands:gitconfig');

export interface GitConfigOptions {
  verbose?: boolean;
  simple?: boolean;
}

interface GitConfigEntry {
  key: string;
  value: string;
  source: string;
}

interface GitConfigResult {
  user: {
    name?: string;
    email?: string;
  };
  core: {
    editor?: string;
  };
  init: {
    defaultBranch?: string;
  };
  credential: {
    helper?: string;
  };
  aliases?: Record<string, string>;
  includes?: { path: string; condition?: string }[];
  allEntries?: GitConfigEntry[];
}

export async function gitconfig(options: GitConfigOptions = {}): Promise<GitConfigResult> {
  const { verbose = false } = options;

  logger.info('Executing gitconfig command', { verbose });

  const result: GitConfigResult = {
    user: {},
    core: {},
    init: {},
    credential: {},
  };

  // Determine which config file to use
  const configFile = findGitConfigFile();
  logger.debug(`Using config file: ${configFile}`);

  // Get essential config values
  result.user.name = getGitConfig('user.name');
  result.user.email = getGitConfig('user.email');
  result.core.editor = getGitConfig('core.editor');
  result.init.defaultBranch = getGitConfig('init.defaultBranch');
  result.credential.helper = getGitConfig('credential.helper');

  // Get includes
  result.includes = getIncludes(configFile);

  if (verbose) {
    // Get all config with sources
    result.allEntries = getAllConfigWithSources();
    result.aliases = getAliases();
  }

  return result;
}

function findGitConfigFile(): string {
  // Check environment variables in order
  const checks = [
    process.env.GIT_CONFIG_GLOBAL,
    process.env.XDG_CONFIG_HOME ? resolve(process.env.XDG_CONFIG_HOME, 'git/config') : null,
    resolve(homedir(), '.gitconfig'),
    resolve(homedir(), '.config/git/config'),
  ];

  for (const path of checks) {
    if (path && existsSync(path)) {
      return path;
    }
  }

  return resolve(homedir(), '.gitconfig');
}

function getGitConfig(key: string): string | undefined {
  try {
    const value = execSync(`git config --global --get ${key}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

function getAllConfigWithSources(): GitConfigEntry[] {
  const entries: GitConfigEntry[] = [];

  try {
    const output = execSync('git config --global --list --show-origin', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      // Format: file:/path/to/config\tkey=value
      const match = line.match(/^file:(.+?)\t(.+?)=(.*)$/);
      if (match) {
        entries.push({
          source: match[1],
          key: match[2],
          value: match[3],
        });
      }
    }
  } catch (error) {
    logger.warn('Failed to get all config with sources', error);
  }

  return entries;
}

function getAliases(): Record<string, string> {
  const aliases: Record<string, string> = {};

  try {
    const output = execSync('git config --global --get-regexp "^alias\\."', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      const match = line.match(/^alias\.(.+?)\s+(.+)$/);
      if (match) {
        aliases[match[1]] = match[2];
      }
    }
  } catch {
    // No aliases defined
  }

  return aliases;
}

function getIncludes(configFile: string): { path: string; condition?: string }[] {
  const includes: { path: string; condition?: string }[] = [];

  if (!existsSync(configFile)) {
    return includes;
  }

  try {
    const content = readFileSync(configFile, 'utf-8');
    const lines = content.split('\n');

    let currentSection = '';
    let currentCondition: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();

      // Section header
      const sectionMatch = trimmed.match(/^\[(.+?)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        currentCondition = undefined;

        // Check for includeIf condition
        const includeIfMatch = currentSection.match(/^includeIf\s+"(.+?)"$/);
        if (includeIfMatch) {
          currentCondition = includeIfMatch[1];
        }
      }

      // Include path
      if (currentSection.startsWith('include') && trimmed.startsWith('path')) {
        const pathMatch = trimmed.match(/^path\s*=\s*(.+)$/);
        if (pathMatch) {
          includes.push({
            path: pathMatch[1].trim(),
            condition: currentCondition,
          });
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to parse includes', error);
  }

  return includes;
}

export function formatGitConfigOutput(result: GitConfigResult, verbose: boolean): string {
  const lines: string[] = [];

  lines.push('Git Configuration');
  lines.push('=================');
  lines.push('');

  // User info
  lines.push('User:');
  lines.push(`  Name:  ${result.user.name || '(not set)'}`);
  lines.push(`  Email: ${result.user.email || '(not set)'}`);
  lines.push('');

  // Core settings
  lines.push('Core:');
  lines.push(`  Editor:         ${result.core.editor || '(not set)'}`);
  lines.push(`  Default Branch: ${result.init.defaultBranch || '(not set)'}`);
  lines.push('');

  // Credential helper
  lines.push('Credentials:');
  lines.push(`  Helper: ${result.credential.helper || '(not set)'}`);
  lines.push('');

  // Includes
  if (result.includes && result.includes.length > 0) {
    lines.push('Includes:');
    for (const include of result.includes) {
      if (include.condition) {
        lines.push(`  [if ${include.condition}]`);
        lines.push(`    Path: ${include.path}`);
      } else {
        lines.push(`  Path: ${include.path}`);
      }
    }
    lines.push('');
  }

  if (verbose) {
    // Aliases
    if (result.aliases && Object.keys(result.aliases).length > 0) {
      lines.push('Aliases:');
      for (const [alias, command] of Object.entries(result.aliases)) {
        lines.push(`  ${alias} = ${command}`);
      }
      lines.push('');
    }

    // All entries with sources
    if (result.allEntries && result.allEntries.length > 0) {
      lines.push('All Settings (with sources):');
      let currentSource = '';
      for (const entry of result.allEntries) {
        if (entry.source !== currentSource) {
          currentSource = entry.source;
          lines.push(`  [${entry.source}]`);
        }
        lines.push(`    ${entry.key} = ${entry.value}`);
      }
    }
  }

  return lines.join('\n');
}
