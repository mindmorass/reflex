---
description: Manage MCP servers (list, install, uninstall, enable, disable, select)
allowed-tools: Bash(jq:*), Bash(cat:*), Bash(mkdir:*), Bash(claude:*), AskUserQuestion, Read, Write
argument-hint: [list|select|install|uninstall|enable|disable|status|generate] [server...]
---

# MCP Server Management

Manage MCP servers for your workspace. Servers are installed from the Reflex catalog and registered with Claude Code via `claude mcp add-json` (user scope).

## Paths

```bash
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
CATALOG="${PLUGIN_ROOT}/mcp-catalog.json"
CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/reflex"
CONFIG="${CONFIG_DIR}/mcp-config.json"
GENERATE="${PLUGIN_ROOT}/scripts/mcp-generate.sh"
```

## Subcommands

### `/reflex:mcp` or `/reflex:mcp list`

Show all catalog servers with their install/enable status.

**Instructions:**

1. Read `${CATALOG}` for the full server registry
2. Read `${CONFIG}` for user state (if it exists; if not, all servers are shown as "not installed")
3. Display a table:

```
## MCP Servers ({enabled}/{total} enabled)

| Server | Status | Category | Description |
|--------|--------|----------|-------------|
| git | installed, enabled | development | Git repository operations |
| atlassian | installed, disabled | collaboration | Jira and Confluence integration |
| kubernetes | not installed | cloud | Kubernetes cluster operations |
```

4. Show hint: `Manage: /reflex:mcp select | /reflex:mcp install <name> | /reflex:mcp enable <name>`

---

### `/reflex:mcp select`

Interactive server selection for installing/uninstalling servers.

**Instructions:**

1. Ensure config directory exists: `mkdir -p ${CONFIG_DIR}`
2. If `${CONFIG}` doesn't exist, run: `${GENERATE} --migrate --catalog ${CATALOG} --config ${CONFIG}`
3. Read `${CATALOG}` and `${CONFIG}`
4. Build a list of all catalog servers grouped by category, showing current install state
5. Use `AskUserQuestion` with `multiSelect: true` to present the servers. Pre-select servers that are currently installed and enabled. Group options by category in the labels.

**AskUserQuestion format — split by category groups (use up to 4 questions, one per group):**

- Question 1: "Which Development & Data servers to install?" — options: `git`, `github`, `playwright`, `qdrant`
- Question 2: "Which Cloud & Infrastructure servers to install?" — options: `azure`, `azure-devops`, `azure-ai-foundry`, `devbox`, `kubernetes`, `spacelift`
- Question 3: "Which Collaboration & Docs servers to install?" — options: `atlassian`, `google-workspace`, `markitdown`, `microsoft-docs`
- Question 4: "Which Database servers to install?" — options: `sql-server`

Each option label should include the server description (e.g., `git - Git repository operations`).

6. After selection, update `${CONFIG}`:
   - Selected servers: set `{"installed": true, "enabled": true}`
   - Unselected servers that were previously installed: remove from config
7. Run: `${GENERATE} --catalog ${CATALOG} --config ${CONFIG}`
8. Output: "Updated MCP servers. Restart Claude Code to apply changes."

---

### `/reflex:mcp enable` (no args)

Interactive enable/disable for installed servers.

**Instructions:**

1. Read `${CATALOG}` and `${CONFIG}`
2. Filter to only installed servers
3. Use `AskUserQuestion` with `multiSelect: true`:
   - Question: "Which installed servers should be enabled?"
   - Options: list of installed servers with descriptions
   - Pre-select currently enabled servers
4. Update `${CONFIG}`:
   - Selected servers: set `"enabled": true`
   - Unselected servers: set `"enabled": false` (keep installed)
5. Run: `${GENERATE} --catalog ${CATALOG} --config ${CONFIG}`
6. Output: "Updated MCP servers. Restart Claude Code to apply changes."

---

### `/reflex:mcp install <server...>`

Install and auto-enable one or more servers by name (non-interactive).

**Instructions:**

1. Read `${CATALOG}` and `${CONFIG}` (create config if missing via `${GENERATE} --migrate`)
2. For each server name in the arguments:
   - Verify it exists in the catalog
   - Set `{"installed": true, "enabled": true}` in config
3. Write updated config to `${CONFIG}`
4. Run: `${GENERATE} --catalog ${CATALOG} --config ${CONFIG}`
5. Output: "Installed {names}. Restart Claude Code to load."

If a server name is not found in the catalog, warn and skip it.

---

### `/reflex:mcp uninstall <server...>`

Remove one or more servers (non-interactive).

**Instructions:**

1. Read `${CONFIG}`
2. For each server name: remove it from the config servers object
3. Write updated config to `${CONFIG}`
4. Run: `${GENERATE} --catalog ${CATALOG} --config ${CONFIG}`
5. Output: "Uninstalled {names}. Restart Claude Code to apply."

---

### `/reflex:mcp enable <server...>`

Enable one or more installed servers by name (non-interactive).

**Instructions:**

1. Read `${CONFIG}`
2. For each server name:
   - If not installed, warn: "{name} is not installed. Run `/reflex:mcp install {name}` first."
   - If installed, set `"enabled": true`
3. Write updated config and run `${GENERATE}`
4. Output: "Enabled {names}. Restart Claude Code to apply."

---

### `/reflex:mcp disable <server...>`

Disable one or more servers without uninstalling (non-interactive).

**Instructions:**

1. Read `${CONFIG}`
2. For each server name: set `"enabled": false` (keep installed)
3. Write updated config and run `${GENERATE}`
4. Output: "Disabled {names}. Restart Claude Code to apply."

---

### `/reflex:mcp status`

Show detailed status for installed servers including credential readiness and live health.

**Instructions:**

1. Read `${CATALOG}` and `${CONFIG}`
2. Run `claude mcp list` to get live health data for currently loaded servers
3. For each installed server, check if required env vars are set:
   - Read `requires` from the catalog entry
   - Check each env var: `[[ -n "${!VAR}" ]]`
4. Display:

```
## MCP Server Status

| Server | Enabled | Health | Credentials | Missing |
|--------|---------|--------|-------------|---------|
| git | yes | connected | ready | - |
| atlassian | yes | failed | missing | JIRA_URL, JIRA_API_TOKEN |
| azure | no | - | partial | AZURE_CLIENT_SECRET |
```

5. Show hint: `Configure credentials: /reflex:init <service>`

---

### `/reflex:mcp generate`

Explicitly re-sync MCP servers with Claude Code from current config.

**Instructions:**

1. Run: `${GENERATE} --catalog ${CATALOG} --config ${CONFIG}`
2. Show the script output (server count summary)
