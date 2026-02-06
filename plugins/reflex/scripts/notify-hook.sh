#!/bin/bash
# Reflex notification hook
# Called by PostToolUse to notify on agent completion and other events

set -euo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
NOTIFY_ENABLED="$CLAUDE_DIR/reflex/notify-enabled"
SPEAK_ENABLED="$CLAUDE_DIR/reflex/speak-enabled"

# Exit silently if neither notification type is enabled
if [ ! -f "$NOTIFY_ENABLED" ] && [ ! -f "$SPEAK_ENABLED" ]; then
    exit 0
fi

# Read tool data from stdin (JSON from Claude Code hook)
TOOL_DATA=$(cat)

# Extract tool name
TOOL_NAME=$(echo "$TOOL_DATA" | jq -r '.tool_name // empty' 2>/dev/null || echo "")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$TOOL_NAME" in
    Task)
        # Agent/subagent completed
        "$SCRIPT_DIR/notify.sh" "agent_complete" "A background task has completed"
        ;;
    AskUserQuestion)
        # Input required from user
        "$SCRIPT_DIR/notify.sh" "input_required" "Claude is waiting for your response"
        ;;
    *)
        # Don't notify for other tools
        ;;
esac

exit 0
