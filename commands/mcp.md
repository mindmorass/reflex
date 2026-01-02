---
description: List configured MCP servers
allowed-tools: Bash(npm start -- mcp:*)
---

# MCP Servers

List all MCP servers configured in the Reflex plugin.

## Command

```bash
!npm start -- mcp 2>&1 | grep -v "DEP0040\|punycode\|node --trace\|INFO\|Loaded"
```

## Configured Servers

| Server | Type | Purpose |
|--------|------|---------|
| atlassian | stdio | Jira/Confluence integration |
| git | stdio | Local git operations |
| github | http | GitHub API (repos, issues, PRs) |
| microsoft-docs | http | Microsoft Learn documentation |
| azure | stdio | Azure resource management |
| azure-devops | stdio | Azure DevOps pipelines/repos |
| markitdown | stdio | Document conversion |
| sql-server | stdio | SQL Server queries |
| playwright | stdio | Browser automation/testing |
| devbox | stdio | Dev Box management |
| azure-ai-foundry | stdio | Azure AI services |
| m365-agents | stdio | Microsoft 365 integration |

## Usage

These servers are auto-configured via `.mcp.json`. Use `/mcp` in Claude Code to check connection status and authenticate.
