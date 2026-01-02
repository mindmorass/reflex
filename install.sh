#!/bin/bash
set -e

# Reflex Claude Code Plugin Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/mindmorass/reflex/main/install.sh | bash

REPO="mindmorass/reflex"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
COMMANDS_DIR="$CLAUDE_DIR/commands"
CLAUDE_JSON="${CLAUDE_DIR}.json"
REFLEX_DIR="$CLAUDE_DIR/reflex"

log() {
  echo "[reflex] $1"
}

# Create directories
mkdir -p "$COMMANDS_DIR"
mkdir -p "$REFLEX_DIR/skills"
mkdir -p "$REFLEX_DIR/logs"

log "Installing Reflex for Claude Code..."

# Download slash commands
COMMANDS=(
  "reflex:gitconfig.md"
  "reflex:certcollect.md"
  "reflex:audit.md"
  "reflex:agents.md"
  "reflex:mcp.md"
  "reflex:task.md"
  "reflex:skills.md"
)

for cmd in "${COMMANDS[@]}"; do
  curl -fsSL "${BASE_URL}/.claude/commands/${cmd}" -o "${COMMANDS_DIR}/${cmd}"
  log "Installed command: ${cmd}"
done

# Download and merge MCP servers
log "Configuring MCP servers..."

MCP_CONFIG=$(curl -fsSL "${BASE_URL}/.mcp.json")

if [ -f "$CLAUDE_JSON" ]; then
  # Merge with existing config
  EXISTING=$(cat "$CLAUDE_JSON")

  # Use node to merge JSON if available, otherwise use jq, otherwise just warn
  if command -v node &> /dev/null; then
    node -e "
      const existing = $EXISTING;
      const newServers = ${MCP_CONFIG}.mcpServers;
      existing.mcpServers = existing.mcpServers || {};
      for (const [name, config] of Object.entries(newServers)) {
        existing.mcpServers['reflex-' + name] = config;
      }
      console.log(JSON.stringify(existing, null, 2));
    " > "$CLAUDE_JSON.tmp" && mv "$CLAUDE_JSON.tmp" "$CLAUDE_JSON"
  elif command -v jq &> /dev/null; then
    echo "$MCP_CONFIG" | jq '.mcpServers | to_entries | map({("reflex-" + .key): .value}) | add' > /tmp/reflex-mcp.json
    jq -s '.[0].mcpServers = (.[0].mcpServers // {}) + .[1] | .[0]' "$CLAUDE_JSON" /tmp/reflex-mcp.json > "$CLAUDE_JSON.tmp"
    mv "$CLAUDE_JSON.tmp" "$CLAUDE_JSON"
    rm /tmp/reflex-mcp.json
  else
    log "Warning: Could not merge MCP servers (install node or jq)"
    log "Manual setup required - see .mcp.json in repo"
  fi
else
  # Create new config with prefixed server names
  if command -v node &> /dev/null; then
    node -e "
      const config = ${MCP_CONFIG};
      const result = { mcpServers: {} };
      for (const [name, cfg] of Object.entries(config.mcpServers)) {
        result.mcpServers['reflex-' + name] = cfg;
      }
      console.log(JSON.stringify(result, null, 2));
    " > "$CLAUDE_JSON"
  else
    echo "$MCP_CONFIG" > "$CLAUDE_JSON"
    log "Warning: MCP servers not prefixed (install node for proper setup)"
  fi
fi

log "MCP servers configured in $CLAUDE_JSON"

# Download CLAUDE.md as reference
curl -fsSL "${BASE_URL}/CLAUDE.md" -o "${REFLEX_DIR}/CLAUDE.md"
log "Downloaded reference docs to ${REFLEX_DIR}/CLAUDE.md"

# Download skills
SKILLS=(
  "agent-builder"
  "ci-cd-patterns"
  "code-review-patterns"
  "collection-migration"
  "doc-sync"
  "docker-patterns"
  "embedding-comparison"
  "github-harvester"
  "graphviz-diagrams"
  "joplin-publisher"
  "knowledge-ingestion-patterns"
  "mcp-server-builder"
  "mermaid-diagrams"
  "microsoft-code-reference"
  "microsoft-docs"
  "obsidian-publisher"
  "pdf-harvester"
  "project-onboarding"
  "prompt-template"
  "rag-builder"
  "router-builder"
  "security-review"
  "site-crawler"
  "task-decomposition"
  "test-patterns"
  "troubleshooting"
  "workflow-builder"
  "workspace-builder"
  "youtube-harvester"
)

log "Downloading skills..."
for skill in "${SKILLS[@]}"; do
  mkdir -p "$REFLEX_DIR/skills/$skill"
  curl -fsSL "${BASE_URL}/config/skills/${skill}/SKILL.md" -o "$REFLEX_DIR/skills/$skill/SKILL.md" 2>/dev/null || true
done
log "Installed ${#SKILLS[@]} skills"

log ""
log "Installation complete!"
log ""
log "Available commands in Claude Code:"
log "  /reflex:gitconfig  - Display git configuration"
log "  /reflex:certcollect - Collect SSL certificates"
log "  /reflex:audit      - Control audit logging"
log "  /reflex:agents     - List available agents"
log "  /reflex:mcp        - List MCP servers"
log "  /reflex:task       - Route task to agent"
log ""
log "Run /mcp in Claude Code to see configured servers."
log ""
log "To uninstall: curl -fsSL ${BASE_URL}/uninstall.sh | bash"
