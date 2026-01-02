import { existsSync, mkdirSync, appendFileSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { createLogger } from '../utils/logger.js';
import { env } from '../utils/env.js';
import type { HookHandler, HookContext } from '../types/hooks.js';

const logger = createLogger('commands:audit');

export interface AuditOptions {
  verbose?: boolean;
  simple?: boolean;
  output?: string;
  format?: 'json' | 'markdown' | 'text';
}

export type AuditCommand = 'on' | 'off' | 'status' | 'export';

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  agent?: string;
  skill?: string;
  tool?: string;
  input?: unknown;
  output?: unknown;
  duration_ms?: number;
  success: boolean;
  error?: string;
}

interface AuditState {
  active: boolean;
  logFile: string | null;
  startTime: Date | null;
  entriesCount: number;
  format: 'json' | 'markdown' | 'text';
}

// Global audit state
const auditState: AuditState = {
  active: false,
  logFile: null,
  startTime: null,
  entriesCount: 0,
  format: 'json',
};

export async function audit(
  command: AuditCommand,
  options: AuditOptions = {}
): Promise<{ success: boolean; message: string; state?: AuditState }> {
  const {
    verbose = false,
    output = env.logPath,
    format = env.auditFormat || 'json',
  } = options;

  logger.info(`Executing audit command: ${command}`, { verbose, format });

  switch (command) {
    case 'on':
      return startAudit(output, format);
    case 'off':
      return stopAudit();
    case 'status':
      return getStatus();
    case 'export':
      return exportAudit(output, format);
    default:
      return { success: false, message: `Unknown audit command: ${command}` };
  }
}

function startAudit(
  outputDir: string,
  format: 'json' | 'markdown' | 'text'
): { success: boolean; message: string; state?: AuditState } {
  if (auditState.active) {
    return {
      success: false,
      message: 'Audit logging is already active',
      state: { ...auditState },
    };
  }

  // Create output directory if needed
  if (!existsSync(outputDir)) {
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      return {
        success: false,
        message: `Failed to create log directory: ${outputDir}`,
      };
    }
  }

  // Create timestamped log file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt';
  const logFile = resolve(outputDir, `audit-${timestamp}.${extension}`);

  // Initialize log file
  try {
    if (format === 'json') {
      writeFileSync(logFile, '[\n');
    } else if (format === 'markdown') {
      writeFileSync(logFile, `# Audit Log\n\nStarted: ${new Date().toISOString()}\n\n---\n\n`);
    } else {
      writeFileSync(logFile, `Audit Log - Started: ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`);
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to create log file: ${logFile}`,
    };
  }

  auditState.active = true;
  auditState.logFile = logFile;
  auditState.startTime = new Date();
  auditState.entriesCount = 0;
  auditState.format = format;

  logger.info('Audit logging started', { logFile });

  return {
    success: true,
    message: `Audit logging started. Log file: ${logFile}`,
    state: { ...auditState },
  };
}

function stopAudit(): { success: boolean; message: string; state?: AuditState } {
  if (!auditState.active) {
    return {
      success: false,
      message: 'Audit logging is not active',
    };
  }

  // Finalize log file
  if (auditState.logFile) {
    try {
      if (auditState.format === 'json') {
        // Close JSON array
        appendFileSync(auditState.logFile, '\n]');
      } else if (auditState.format === 'markdown') {
        appendFileSync(auditState.logFile, `\n---\n\nEnded: ${new Date().toISOString()}\n`);
        appendFileSync(auditState.logFile, `\nTotal entries: ${auditState.entriesCount}\n`);
      } else {
        appendFileSync(auditState.logFile, `\n${'='.repeat(60)}\n`);
        appendFileSync(auditState.logFile, `Ended: ${new Date().toISOString()}\n`);
        appendFileSync(auditState.logFile, `Total entries: ${auditState.entriesCount}\n`);
      }
    } catch (error) {
      logger.warn('Failed to finalize log file', error);
    }
  }

  const summary = {
    logFile: auditState.logFile,
    entriesCount: auditState.entriesCount,
    duration: auditState.startTime
      ? Math.round((Date.now() - auditState.startTime.getTime()) / 1000)
      : 0,
  };

  const previousState = { ...auditState };

  auditState.active = false;
  auditState.logFile = null;
  auditState.startTime = null;
  auditState.entriesCount = 0;

  logger.info('Audit logging stopped', summary);

  return {
    success: true,
    message: `Audit logging stopped. ${summary.entriesCount} entries logged in ${summary.duration}s`,
    state: previousState,
  };
}

function getStatus(): { success: boolean; message: string; state?: AuditState } {
  const state = { ...auditState };

  let message: string;
  if (state.active) {
    const duration = state.startTime
      ? Math.round((Date.now() - state.startTime.getTime()) / 1000)
      : 0;
    message = `Audit logging is active.\nLog file: ${state.logFile}\nEntries: ${state.entriesCount}\nDuration: ${duration}s`;
  } else {
    message = 'Audit logging is not active';
  }

  return {
    success: true,
    message,
    state,
  };
}

function exportAudit(
  outputDir: string,
  format: 'json' | 'markdown' | 'text'
): { success: boolean; message: string } {
  if (!auditState.active || !auditState.logFile) {
    return {
      success: false,
      message: 'No active audit session to export',
    };
  }

  // If format matches current, just return current file
  if (format === auditState.format) {
    return {
      success: true,
      message: `Current log file: ${auditState.logFile}`,
    };
  }

  // Read current log and convert
  try {
    const content = readFileSync(auditState.logFile, 'utf-8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt';
    const exportFile = resolve(outputDir, `audit-export-${timestamp}.${extension}`);

    // Parse entries from current format
    let entries: AuditLogEntry[] = [];

    if (auditState.format === 'json') {
      try {
        // Handle incomplete JSON array
        const jsonContent = content.endsWith(']') ? content : content + ']';
        entries = JSON.parse(jsonContent);
      } catch {
        // Fall back to line-by-line parsing
      }
    }

    // Write in new format
    if (format === 'json') {
      writeFileSync(exportFile, JSON.stringify(entries, null, 2));
    } else if (format === 'markdown') {
      const md = entriesToMarkdown(entries);
      writeFileSync(exportFile, md);
    } else {
      const text = entriesToText(entries);
      writeFileSync(exportFile, text);
    }

    return {
      success: true,
      message: `Exported to: ${exportFile}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function entriesToMarkdown(entries: AuditLogEntry[]): string {
  const lines: string[] = ['# Audit Log Export\n'];

  for (const entry of entries) {
    lines.push(`## ${entry.timestamp}\n`);
    lines.push(`**Action:** ${entry.action}`);
    lines.push(`**Success:** ${entry.success ? 'Yes' : 'No'}`);

    if (entry.agent) lines.push(`**Agent:** ${entry.agent}`);
    if (entry.skill) lines.push(`**Skill:** ${entry.skill}`);
    if (entry.tool) lines.push(`**Tool:** ${entry.tool}`);
    if (entry.duration_ms) lines.push(`**Duration:** ${entry.duration_ms}ms`);
    if (entry.error) lines.push(`**Error:** ${entry.error}`);

    lines.push('');
  }

  return lines.join('\n');
}

function entriesToText(entries: AuditLogEntry[]): string {
  const lines: string[] = ['Audit Log Export\n' + '='.repeat(40) + '\n'];

  for (const entry of entries) {
    lines.push(`[${entry.timestamp}] ${entry.action}`);
    lines.push(`  Success: ${entry.success}`);

    if (entry.agent) lines.push(`  Agent: ${entry.agent}`);
    if (entry.skill) lines.push(`  Skill: ${entry.skill}`);
    if (entry.tool) lines.push(`  Tool: ${entry.tool}`);
    if (entry.duration_ms) lines.push(`  Duration: ${entry.duration_ms}ms`);
    if (entry.error) lines.push(`  Error: ${entry.error}`);

    lines.push('');
  }

  return lines.join('\n');
}

// Function to log an audit entry
export function logAuditEntry(entry: AuditLogEntry): void {
  if (!auditState.active || !auditState.logFile) {
    return;
  }

  try {
    const isFirst = auditState.entriesCount === 0;

    if (auditState.format === 'json') {
      const prefix = isFirst ? '' : ',\n';
      appendFileSync(auditState.logFile, prefix + JSON.stringify(entry, null, 2));
    } else if (auditState.format === 'markdown') {
      const md = `### ${entry.timestamp}\n` +
        `- **Action:** ${entry.action}\n` +
        `- **Success:** ${entry.success}\n` +
        (entry.agent ? `- **Agent:** ${entry.agent}\n` : '') +
        (entry.skill ? `- **Skill:** ${entry.skill}\n` : '') +
        (entry.tool ? `- **Tool:** ${entry.tool}\n` : '') +
        (entry.duration_ms ? `- **Duration:** ${entry.duration_ms}ms\n` : '') +
        (entry.error ? `- **Error:** ${entry.error}\n` : '') +
        '\n';
      appendFileSync(auditState.logFile, md);
    } else {
      const text = `[${entry.timestamp}] ${entry.action} - ${entry.success ? 'OK' : 'FAIL'}` +
        (entry.agent ? ` [Agent: ${entry.agent}]` : '') +
        (entry.skill ? ` [Skill: ${entry.skill}]` : '') +
        (entry.duration_ms ? ` [${entry.duration_ms}ms]` : '') +
        (entry.error ? ` Error: ${entry.error}` : '') +
        '\n';
      appendFileSync(auditState.logFile, text);
    }

    auditState.entriesCount++;
  } catch (error) {
    logger.warn('Failed to write audit entry', error);
  }
}

// Hook handler for audit logging
export const auditHookHandler: HookHandler = async (context: HookContext) => {
  if (!auditState.active) return;

  const entry: AuditLogEntry = {
    timestamp: context.timestamp.toISOString(),
    action: context.event,
    success: true,
  };

  // Extract additional info from hook data
  const data = context.data as Record<string, unknown> | undefined;
  if (data) {
    if (data.agent) entry.agent = String(data.agent);
    if (data.skill) entry.skill = String(data.skill);
    if (data.toolName) entry.tool = String(data.toolName);
    if (data.duration_ms) entry.duration_ms = Number(data.duration_ms);
    if (data.success !== undefined) entry.success = Boolean(data.success);
    if (data.error) entry.error = String(data.error);
    if (data.input) entry.input = data.input;
    if (data.output) entry.output = data.output;
  }

  logAuditEntry(entry);
};

export function isAuditActive(): boolean {
  return auditState.active;
}
