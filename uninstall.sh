#!/bin/bash
set -e

# Reflex Claude Code Plugin Uninstaller

# Respect CLAUDE_CONFIG_DIR, fallback to ~/.claude
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
COMMANDS_DIR="$CLAUDE_DIR/commands"
CLAUDE_JSON="${CLAUDE_DIR}.json"
REFLEX_DIR="$CLAUDE_DIR/reflex"

log() {
  echo "[reflex] $1"
}

log "Uninstalling Reflex from Claude Code..."

# Remove slash commands
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
  if [ -f "${COMMANDS_DIR}/${cmd}" ]; then
    rm "${COMMANDS_DIR}/${cmd}"
    log "Removed command: ${cmd}"
  fi
done

# Remove MCP servers (those prefixed with reflex-)
if [ -f "$CLAUDE_JSON" ]; then
  if command -v node &> /dev/null; then
    node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('$CLAUDE_JSON', 'utf-8'));
      if (config.mcpServers) {
        let removed = 0;
        for (const name of Object.keys(config.mcpServers)) {
          if (name.startsWith('reflex-')) {
            delete config.mcpServers[name];
            removed++;
          }
        }
        fs.writeFileSync('$CLAUDE_JSON', JSON.stringify(config, null, 2));
        console.log('Removed ' + removed + ' MCP servers');
      }
    "
  elif command -v jq &> /dev/null; then
    jq 'if .mcpServers then .mcpServers |= with_entries(select(.key | startswith("reflex-") | not)) else . end' "$CLAUDE_JSON" > "$CLAUDE_JSON.tmp"
    mv "$CLAUDE_JSON.tmp" "$CLAUDE_JSON"
    log "Removed reflex MCP servers"
  else
    log "Warning: Could not remove MCP servers (install node or jq)"
    log "Manual removal required from $CLAUDE_JSON"
  fi
fi

# Remove skills from ~/.claude/skills/
SKILLS_DIR="$CLAUDE_DIR/skills"
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

removed_count=0
for skill in "${SKILLS[@]}"; do
  if [ -d "$SKILLS_DIR/$skill" ]; then
    rm -rf "$SKILLS_DIR/$skill"
    ((removed_count++))
  fi
done
if [ $removed_count -gt 0 ]; then
  log "Removed $removed_count skills from $SKILLS_DIR"
fi

# Remove agents from ~/.claude/agents/
AGENTS_DIR="$CLAUDE_DIR/agents"
AGENTS=(
  "analyst"
  "coder"
  "devops"
  "harvester"
  "planner"
  "researcher"
  "reviewer"
  "tester"
  "writer"
)

removed_agents=0
for agent in "${AGENTS[@]}"; do
  if [ -f "$AGENTS_DIR/${agent}.md" ]; then
    rm "$AGENTS_DIR/${agent}.md"
    ((removed_agents++))
  fi
done
if [ $removed_agents -gt 0 ]; then
  log "Removed $removed_agents agents from $AGENTS_DIR"
fi

# Optionally remove reflex directory
read -p "Remove reflex data directory ($REFLEX_DIR)? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf "$REFLEX_DIR"
  log "Removed $REFLEX_DIR"
fi

log ""
log "Uninstallation complete!"
