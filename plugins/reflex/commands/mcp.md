---
description: List configured MCP servers
allowed-tools: Bash(jq:*), Bash(cat:*)
---

# MCP Servers

List all MCP servers configured in the Reflex plugin.

## Instructions

Read the `.mcp.json` file in the plugin directory and display the configured servers:

```bash
!cat plugins/reflex/.mcp.json | jq -r '.mcpServers | to_entries[] | "- **\(.key)**: \(.value.command) \(.value.args | join(" "))"'
```

## Usage

These servers are auto-configured via `.mcp.json`. Use `/mcp` in Claude Code to check connection status and authenticate.
