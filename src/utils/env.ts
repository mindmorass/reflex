import { config } from 'dotenv';
import { homedir } from 'os';
import { resolve } from 'path';

// Load environment variables
config();

function expandPath(path: string): string {
  if (path.startsWith('~')) {
    return resolve(homedir(), path.slice(2));
  }
  return resolve(path);
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env = {
  // Paths
  skillsPath: expandPath(getEnvOrDefault('REFLEX_SKILLS_PATH', '~/.reflex/skills')),
  chromaDbPath: expandPath(getEnvOrDefault('REFLEX_CHROMADB_PATH', '~/.reflex/chromadb')),
  logPath: expandPath(getEnvOrDefault('REFLEX_LOG_PATH', '~/.reflex/logs')),

  // Project
  projectId: getEnvOrDefault('REFLEX_PROJECT_ID', 'default'),

  // Atlassian
  atlassianUrl: process.env.ATLASSIAN_URL,
  atlassianEmail: process.env.ATLASSIAN_EMAIL,
  atlassianApiToken: process.env.ATLASSIAN_API_TOKEN,

  // GitHub
  githubToken: process.env.GITHUB_TOKEN,

  // Azure
  azureSubscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  azureTenantId: process.env.AZURE_TENANT_ID,

  // Azure DevOps
  azureDevOpsOrg: process.env.AZURE_DEVOPS_ORG,
  azureDevOpsPat: process.env.AZURE_DEVOPS_PAT,

  // SQL Server
  sqlServerConnectionString: process.env.SQL_SERVER_CONNECTION_STRING,

  // Audit
  auditEnabled: getEnvOrDefault('REFLEX_AUDIT_ENABLED', 'false') === 'true',
  auditFormat: getEnvOrDefault('REFLEX_AUDIT_FORMAT', 'json') as 'json' | 'markdown' | 'text',
};

export function expandEnvVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    // Handle ${VAR:-default} syntax
    const match = expr.match(/^([^:]+)(?::-(.*))?$/);
    if (match) {
      const [, varName, defaultValue] = match;
      const value = process.env[varName];
      if (value !== undefined) {
        return value;
      }
      if (defaultValue !== undefined) {
        return expandPath(defaultValue);
      }
    }
    return '';
  });
}
