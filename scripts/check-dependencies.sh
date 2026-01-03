#!/bin/bash
# Check for recommended Claude Code plugins
# This runs on SessionStart to remind users about dependencies

set -euo pipefail

# Read input from stdin (SessionStart provides session info)
read -r INPUT 2>/dev/null || INPUT="{}"

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

# Output result
if [[ ${#MISSING_PLUGINS[@]} -gt 0 ]]; then
  CONTEXT="Reflex recommends installing official Claude Code plugins for full functionality:\n"

  for i in "${!MISSING_PLUGINS[@]}"; do
    CONTEXT="${CONTEXT}\n- ${MISSING_PLUGINS[$i]} (provides: ${RECOMMENDATIONS[$i]})"
  done

  CONTEXT="${CONTEXT}\n\nInstall with: /install-plugin <plugin-name>"

  # Output JSON for SessionStart hook
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
