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
  {
    echo "export GIT_AUTHOR_NAME='${GIT_USER_NAME}'"
    echo "export GIT_COMMITTER_NAME='${GIT_USER_NAME}'"
    [[ -n "$GIT_USER_EMAIL" ]] && echo "export GIT_AUTHOR_EMAIL='${GIT_USER_EMAIL}'"
    [[ -n "$GIT_USER_EMAIL" ]] && echo "export GIT_COMMITTER_EMAIL='${GIT_USER_EMAIL}'"
  } >> "$CLAUDE_ENV_FILE"
fi

# =============================================================================
# Plugin Dependency Check
# =============================================================================
# Check if official plugins directory exists
# Plugins are installed to ~/.claude/plugins/ or similar
PLUGINS_DIR="${HOME}/.claude/plugins"

check_plugin() {
  local plugin_name="$1"
  local plugin_package="$2"

  # Check multiple possible locations
  if [[ -d "${PLUGINS_DIR}/${plugin_name}" ]] || \
     [[ -d "${PLUGINS_DIR}/${plugin_package}" ]] || \
     [[ -d "${HOME}/.claude/marketplace/${plugin_package}" ]]; then
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
# Build Context Output
# =============================================================================
CONTEXT=""

# Add git user info to context
if [[ -n "$GIT_USER_NAME" ]]; then
  CONTEXT="Git user: ${GIT_USER_NAME}"
  [[ -n "$GIT_USER_EMAIL" ]] && CONTEXT="${CONTEXT} <${GIT_USER_EMAIL}>"
  CONTEXT="${CONTEXT}\n"
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
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "${CONTEXT}"
  }
}
EOF
fi

exit 0
