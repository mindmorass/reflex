#!/bin/bash
# Guardrail hook for Reflex - blocks or prompts for destructive operations
# Called by Claude Code PreToolUse hook
# Exit 0 = allow, Exit 2 = block (with deny/ask in output)

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
# Uses Python 3 from the environment (no external dependencies beyond stdlib)
RESULT=$(python3 "$SCRIPT_DIR/guardrail.py" <<< "$TOOL_DATA" 2>&1) || {
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 2 ]; then
        # Python script returned block decision
        echo "$RESULT" >&2
        exit 2
    fi
    # Other errors - fail open (allow) to avoid blocking legitimate operations
    exit 0
}

# Python returned allow decision
exit 0
