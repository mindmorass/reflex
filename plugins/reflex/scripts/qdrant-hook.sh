#!/bin/bash
# Qdrant gate hook for Reflex - blocks qdrant tool calls when disabled
# Called by Claude Code PreToolUse hook
# Exit 0 = allow, Exit 2 = block

set -euo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-${HOME}/.claude}"
STATE_FILE="${CLAUDE_DIR}/reflex/qdrant-enabled"

# Allow if qdrant is enabled
if [ -f "$STATE_FILE" ]; then
    exit 0
fi

# Block - qdrant is disabled
echo '{"hookSpecificOutput":{"permissionDecision":"deny"},"systemMessage":"Qdrant is currently disabled. Run /reflex:qdrant on to enable it."}' >&2
exit 2
