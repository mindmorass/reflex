# Reflex MCP Servers

This document describes the MCP (Model Context Protocol) server integrations available in Reflex.

## Overview

Reflex integrates with external tools and services through MCP servers. These servers provide agents with capabilities beyond the base Claude Code functionality.

## Server Types

### stdio Servers

Local process-based servers that communicate via stdin/stdout:

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-name"],
  "env": {
    "API_KEY": "${API_KEY}"
  }
}
```

### HTTP Servers

Remote servers accessible via HTTP endpoints:

```json
{
  "type": "http",
  "url": "https://api.example.com/mcp"
}
```

## Available Servers

### atlassian

**Type:** stdio
**Purpose:** Jira and Confluence integration
**Used By:** planner

**Environment Variables:**
- `ATLASSIAN_URL` - Atlassian instance URL
- `ATLASSIAN_EMAIL` - User email
- `ATLASSIAN_API_TOKEN` - API token

**Capabilities:**
- Create and update Jira issues
- Search Jira with JQL
- Read/write Confluence pages
- Manage sprints and boards

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-atlassian"],
  "env": {
    "ATLASSIAN_URL": "${ATLASSIAN_URL}",
    "ATLASSIAN_EMAIL": "${ATLASSIAN_EMAIL}",
    "ATLASSIAN_API_TOKEN": "${ATLASSIAN_API_TOKEN}"
  }
}
```

---

### git

**Type:** stdio
**Purpose:** Local git repository operations
**Used By:** coder

**Capabilities:**
- Git status, diff, log
- Branch operations
- Commit operations
- Stash management

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-git"]
}
```

---

### github

**Type:** http
**Purpose:** GitHub API integration
**Used By:** coder, devops, reviewer

**Environment Variables:**
- `GITHUB_TOKEN` - Personal access token

**Capabilities:**
- Repository management
- Pull request operations
- Issue management
- Actions workflow control
- Code search

**Configuration:**
```json
{
  "type": "http",
  "url": "https://api.github.com/mcp",
  "headers": {
    "Authorization": "Bearer ${GITHUB_TOKEN}"
  }
}
```

---

### microsoft-docs

**Type:** http
**Purpose:** Microsoft Learn documentation search
**Used By:** researcher

**Capabilities:**
- Search Microsoft documentation
- Retrieve API references
- Access code samples

**Configuration:**
```json
{
  "type": "http",
  "url": "https://learn.microsoft.com/api/mcp"
}
```

---

### azure

**Type:** stdio
**Purpose:** Azure resource management
**Used By:** devops

**Environment Variables:**
- `AZURE_SUBSCRIPTION_ID` - Subscription ID
- `AZURE_TENANT_ID` - Tenant ID
- `AZURE_CLIENT_ID` - Service principal client ID
- `AZURE_CLIENT_SECRET` - Service principal secret

**Capabilities:**
- Resource group management
- VM operations
- Storage management
- Network configuration
- Azure Functions deployment

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@azure/mcp-server"],
  "env": {
    "AZURE_SUBSCRIPTION_ID": "${AZURE_SUBSCRIPTION_ID}",
    "AZURE_TENANT_ID": "${AZURE_TENANT_ID}",
    "AZURE_CLIENT_ID": "${AZURE_CLIENT_ID}",
    "AZURE_CLIENT_SECRET": "${AZURE_CLIENT_SECRET}"
  }
}
```

---

### azure-devops

**Type:** stdio
**Purpose:** Azure DevOps integration
**Used By:** devops, planner

**Environment Variables:**
- `AZURE_DEVOPS_ORG` - Organization name
- `AZURE_DEVOPS_PAT` - Personal access token

**Capabilities:**
- Pipeline management
- Repository operations
- Work item management
- Release management

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@azure/mcp-devops"],
  "env": {
    "AZURE_DEVOPS_ORG": "${AZURE_DEVOPS_ORG}",
    "AZURE_DEVOPS_PAT": "${AZURE_DEVOPS_PAT}"
  }
}
```

---

### markitdown

**Type:** stdio
**Purpose:** Document conversion to markdown
**Used By:** harvester

**Capabilities:**
- PDF to markdown
- Word documents to markdown
- HTML to markdown
- Spreadsheet extraction

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-markitdown"]
}
```

---

### sql-server

**Type:** stdio
**Purpose:** SQL Server database operations
**Used By:** analyst

**Environment Variables:**
- `SQL_SERVER` - Server hostname
- `SQL_DATABASE` - Database name
- `SQL_USER` - Username
- `SQL_PASSWORD` - Password

**Capabilities:**
- Execute queries
- Schema exploration
- Data export

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-sql-server"],
  "env": {
    "SQL_SERVER": "${SQL_SERVER}",
    "SQL_DATABASE": "${SQL_DATABASE}",
    "SQL_USER": "${SQL_USER}",
    "SQL_PASSWORD": "${SQL_PASSWORD}"
  }
}
```

---

### playwright

**Type:** stdio
**Purpose:** Browser automation and testing
**Used By:** tester

**Capabilities:**
- Browser automation
- Screenshot capture
- E2E test execution
- Page interaction

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-playwright"]
}
```

---

### devbox

**Type:** stdio
**Purpose:** Development environment management
**Used By:** devops

**Capabilities:**
- Environment provisioning
- Package management
- Shell environment setup

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-devbox"]
}
```

---

### azure-ai-foundry

**Type:** stdio
**Purpose:** Azure AI services integration
**Used By:** analyst

**Environment Variables:**
- `AZURE_AI_ENDPOINT` - AI Foundry endpoint
- `AZURE_AI_KEY` - API key

**Capabilities:**
- AI model deployment
- Inference operations
- Model management

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@azure/mcp-ai-foundry"],
  "env": {
    "AZURE_AI_ENDPOINT": "${AZURE_AI_ENDPOINT}",
    "AZURE_AI_KEY": "${AZURE_AI_KEY}"
  }
}
```

---

### m365-agents

**Type:** stdio
**Purpose:** Microsoft 365 integration
**Used By:** writer

**Environment Variables:**
- `M365_CLIENT_ID` - App registration client ID
- `M365_CLIENT_SECRET` - Client secret
- `M365_TENANT_ID` - Tenant ID

**Capabilities:**
- SharePoint operations
- Teams messaging
- OneDrive file management

**Configuration:**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@microsoft/mcp-m365"],
  "env": {
    "M365_CLIENT_ID": "${M365_CLIENT_ID}",
    "M365_CLIENT_SECRET": "${M365_CLIENT_SECRET}",
    "M365_TENANT_ID": "${M365_TENANT_ID}"
  }
}
```

## Configuration

### Project Configuration (`.mcp.json`)

MCP servers are configured in the project's `.mcp.json` file:

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.github.com/mcp"
    },
    "git": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-git"]
    }
  }
}
```

### Global Configuration (`~/.claude.json`)

When installed globally, servers are prefixed with `reflex-`:

```json
{
  "mcpServers": {
    "reflex-github": { ... },
    "reflex-git": { ... }
  }
}
```

### Environment Variables

Configure credentials in `.env`:

```bash
# Atlassian
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Azure
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret

# Azure DevOps
AZURE_DEVOPS_ORG=your-organization
AZURE_DEVOPS_PAT=your-personal-access-token
```

## Agent-Server Mapping

| Agent | MCP Servers |
|-------|-------------|
| analyst | sql-server, azure-ai-foundry |
| coder | github, git |
| devops | azure, azure-devops, github, devbox |
| harvester | markitdown |
| planner | atlassian, azure-devops |
| researcher | microsoft-docs |
| reviewer | github |
| tester | playwright |
| writer | m365-agents |

## Adding Custom Servers

### 1. Update Configuration

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "custom-server": {
      "type": "stdio",
      "command": "node",
      "args": ["./my-mcp-server.js"],
      "env": {
        "MY_CONFIG": "value"
      }
    }
  }
}
```

### 2. Update YAML Config

Add to `config/mcp-servers.yaml`:

```yaml
servers:
  custom-server:
    type: stdio
    command: node
    args:
      - ./my-mcp-server.js
    env:
      MY_CONFIG: "value"
    agents:
      - coder
      - analyst
```

### 3. Associate with Agents

Update agent's `mcpServers` property:

```typescript
class MyAgent extends BaseAgent {
  readonly mcpServers = ['custom-server', 'github'];
}
```

## Troubleshooting

### Server Not Starting

Check:
1. Required environment variables are set
2. NPM package can be installed
3. Command path is correct

### Authentication Errors

Verify:
1. API tokens are valid
2. Token has required scopes
3. Environment variables are loaded

### View Server Status

```
/reflex:mcp
```

Shows configured servers and their status.
