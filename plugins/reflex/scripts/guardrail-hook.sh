#!/bin/bash
# Guardrail hook for Reflex - blocks or prompts for destructive operations
# Called by Claude Code PreToolUse hook
# Exit 0 + JSON on stdout = decision (allow/deny/ask)
# Non-zero exit = error (fail open)

set -euo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-${HOME}/.claude}"
STATE_FILE="${CLAUDE_DIR}/reflex/guardrail-enabled"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Exit silently (allow) if guardrails are disabled
if [ ! -f "$STATE_FILE" ]; then
    exit 0
fi

# Read tool data from stdin (JSON from Claude Code PreToolUse)
TOOL_DATA=$(cat)

# Call Python script for pattern matching
# Python outputs decision JSON to stdout, exits 0 for decisions, non-zero for errors
RESULT=$(python3 "$SCRIPT_DIR/guardrail.py" <<< "$TOOL_DATA") || {
    # Python error - fail open (allow) to avoid blocking legitimate operations
    exit 0
}

# Pass through Python's stdout (decision JSON or empty for allow)
if [ -n "$RESULT" ]; then
    echo "$RESULT"
fi

exit 0
