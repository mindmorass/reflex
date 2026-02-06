#!/bin/bash
# Reflex SessionStart hook
# - Sets up git user from config
# - Checks for recommended plugins

set -euo pipefail

# Read input from stdin (SessionStart provides session info)
read -r INPUT 2>/dev/null || INPUT="{}"

# =============================================================================
# Git Configuration Setup
# =============================================================================
# Priority: GIT_CONFIG_GLOBAL > ~/.gitconfig > /etc/gitconfig

get_git_config() {
  local key="$1"
  local value=""

  # Check GIT_CONFIG_GLOBAL first if set
  if [[ -n "${GIT_CONFIG_GLOBAL:-}" ]] && [[ -f "${GIT_CONFIG_GLOBAL}" ]]; then
    value=$(git config --file "${GIT_CONFIG_GLOBAL}" --get "$key" 2>/dev/null || true)
  fi

  # Fall back to default git config resolution
  if [[ -z "$value" ]]; then
    value=$(git config --global --get "$key" 2>/dev/null || true)
  fi

  echo "$value"
}

GIT_USER_NAME=$(get_git_config "user.name")
GIT_USER_EMAIL=$(get_git_config "user.email")

# Persist git user info to session environment if CLAUDE_ENV_FILE is available
if [[ -n "${CLAUDE_ENV_FILE:-}" ]] && [[ -n "$GIT_USER_NAME" ]]; then
  # Use double quotes with escaped inner quotes to handle names with apostrophes
  escaped_name="${GIT_USER_NAME//\\/\\\\}"
  escaped_name="${escaped_name//\"/\\\"}"
  {
    echo "export GIT_AUTHOR_NAME=\"${escaped_name}\""
    echo "export GIT_COMMITTER_NAME=\"${escaped_name}\""
    [[ -n "$GIT_USER_EMAIL" ]] && echo "export GIT_AUTHOR_EMAIL=\"${GIT_USER_EMAIL}\""
    [[ -n "$GIT_USER_EMAIL" ]] && echo "export GIT_COMMITTER_EMAIL=\"${GIT_USER_EMAIL}\""
  } >> "$CLAUDE_ENV_FILE"
fi

# =============================================================================
# Plugin Dependency Check
# =============================================================================
# Check if official plugins directory exists
# Plugins are installed to $CLAUDE_CONFIG_DIR/plugins/ (default: ~/.claude/plugins/)
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-${HOME}/.claude}"
PLUGINS_DIR="${CLAUDE_DIR}/plugins"

check_plugin() {
  local plugin_name="$1"
  local plugin_package="$2"

  # Check multiple possible locations
  if [[ -d "${PLUGINS_DIR}/${plugin_name}" ]] || \
     [[ -d "${PLUGINS_DIR}/${plugin_package}" ]] || \
     [[ -d "${CLAUDE_DIR}/marketplace/${plugin_package}" ]]; then
    return 0
  fi
  return 1
}

MISSING_PLUGINS=()
RECOMMENDATIONS=()

# Check for claude-code-templates (provides testing-suite, security-pro, etc.)
if ! check_plugin "claude-code-templates" "anthropics/claude-code-templates"; then
  MISSING_PLUGINS+=("claude-code-templates")
  RECOMMENDATIONS+=("testing-suite, security-pro, documentation-generator")
fi

# Check for claude-code-workflows (provides developer-essentials, etc.)
if ! check_plugin "claude-code-workflows" "anthropics/claude-code-workflows"; then
  MISSING_PLUGINS+=("claude-code-workflows")
  RECOMMENDATIONS+=("developer-essentials, python-development, javascript-typescript")
fi

# Check for superpowers (provides TDD workflows, systematic debugging, etc.)
if ! check_plugin "superpowers" "obra/superpowers-marketplace"; then
  MISSING_PLUGINS+=("superpowers@superpowers-marketplace")
  RECOMMENDATIONS+=("test-driven-development, systematic-debugging, brainstorming, subagent-driven-development")
fi

# =============================================================================
# Plugin Version Check (marketplace users)
# =============================================================================
# Compare installed version against latest on GitHub to notify users of updates.
INSTALLED_VERSION=$(jq -r '.version // empty' "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" 2>/dev/null || true)
LATEST_VERSION=$(curl -sf --max-time 3 \
  "https://raw.githubusercontent.com/mindmorass/reflex/main/plugins/reflex/.claude-plugin/plugin.json" \
  | jq -r '.version // empty' 2>/dev/null) || LATEST_VERSION=""

UPDATE_AVAILABLE=""
if [[ -n "$LATEST_VERSION" && -n "$INSTALLED_VERSION" && "$INSTALLED_VERSION" != "$LATEST_VERSION" ]]; then
  UPDATE_AVAILABLE="yes"
fi

# =============================================================================
# Guardrail Default Setup (enabled by default for safety)
# =============================================================================
GUARDRAIL_STATE="${CLAUDE_DIR}/reflex/guardrail-enabled"
GUARDRAIL_FIRST_RUN="${CLAUDE_DIR}/reflex/.guardrail-initialized"

if [ ! -f "$GUARDRAIL_FIRST_RUN" ]; then
  mkdir -p "${CLAUDE_DIR}/reflex"
  touch "$GUARDRAIL_STATE"
  touch "$GUARDRAIL_FIRST_RUN"
  GUARDRAIL_ENABLED="new"
elif [ -f "$GUARDRAIL_STATE" ]; then
  GUARDRAIL_ENABLED="yes"
else
  GUARDRAIL_ENABLED="no"
fi

# =============================================================================
# MCP Server Migration & Status
# =============================================================================
MCP_CONFIG="${CLAUDE_DIR}/reflex/mcp-config.json"
MCP_CATALOG="${CLAUDE_PLUGIN_ROOT}/mcp-catalog.json"
MCP_GENERATE="${CLAUDE_PLUGIN_ROOT}/scripts/mcp-generate.sh"

MCP_STATUS=""
if [[ -f "$MCP_CATALOG" ]]; then
  TOTAL_SERVERS=$(jq '.servers | length' "$MCP_CATALOG" 2>/dev/null || echo "0")

  if [[ ! -f "$MCP_CONFIG" ]] && [[ -x "$MCP_GENERATE" ]]; then
    # First run: migrate to create config with all servers installed+enabled
    "$MCP_GENERATE" --migrate --catalog "$MCP_CATALOG" --config "$MCP_CONFIG" >/dev/null 2>&1 || true
    MCP_STATUS="MCP servers migrated: all ${TOTAL_SERVERS} servers installed and enabled. Customize with /reflex:mcp select"
  elif [[ -f "$MCP_CONFIG" ]]; then
    INSTALLED=$(jq '[.servers | to_entries[] | select(.value.installed == true)] | length' "$MCP_CONFIG" 2>/dev/null || echo "0")
    ENABLED=$(jq '[.servers | to_entries[] | select(.value.installed == true and .value.enabled == true)] | length' "$MCP_CONFIG" 2>/dev/null || echo "0")
    MCP_STATUS="MCP servers: ${ENABLED}/${TOTAL_SERVERS} enabled (${INSTALLED} installed). Manage: /reflex:mcp"
  fi
fi

# =============================================================================
# Build Context Output
# =============================================================================
CONTEXT=""

# Add git user info to context
if [[ -n "$GIT_USER_NAME" ]]; then
  CONTEXT="Git user: ${GIT_USER_NAME}"
  [[ -n "$GIT_USER_EMAIL" ]] && CONTEXT="${CONTEXT} <${GIT_USER_EMAIL}>"
  CONTEXT="${CONTEXT}\n"
fi

# Add guardrail status to context (only on first run)
if [[ "$GUARDRAIL_ENABLED" == "new" ]]; then
  CONTEXT="${CONTEXT}\nGuardrails enabled: Destructive operations will be blocked or require confirmation."
  CONTEXT="${CONTEXT}\nManage with: /reflex:guardrail <on|off|status|patterns>\n"
fi

# Add update notification
if [[ "$UPDATE_AVAILABLE" == "yes" ]]; then
  CONTEXT="${CONTEXT}\nReflex update available: ${INSTALLED_VERSION} → ${LATEST_VERSION}"
  CONTEXT="${CONTEXT}\nRun: claude plugin update reflex@mindmorass-reflex\n"
fi

# Add MCP server status
if [[ -n "$MCP_STATUS" ]]; then
  CONTEXT="${CONTEXT}\n${MCP_STATUS}\n"
fi

# Add missing plugins warning
if [[ ${#MISSING_PLUGINS[@]} -gt 0 ]]; then
  CONTEXT="${CONTEXT}\nReflex recommends installing official Claude Code plugins:\n"

  for i in "${!MISSING_PLUGINS[@]}"; do
    CONTEXT="${CONTEXT}\n- ${MISSING_PLUGINS[$i]} (provides: ${RECOMMENDATIONS[$i]})"
  done

  CONTEXT="${CONTEXT}\n\nInstall official plugins: /install-plugin <plugin-name>"
  CONTEXT="${CONTEXT}\nInstall superpowers: /plugin marketplace add obra/superpowers-marketplace && /plugin install superpowers@superpowers-marketplace"
fi

# Output JSON for SessionStart hook (only if we have context)
if [[ -n "$CONTEXT" ]]; then
  # Use printf to expand \n sequences, then pipe through jq for safe JSON encoding
  printf '%b' "$CONTEXT" | jq -Rs '{
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: .
    }
  }'
fi

exit 0
