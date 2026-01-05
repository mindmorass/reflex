#!/bin/bash
# Reflex notification helper
# Usage: notify.sh <type> <message>
# Types: agent_complete, action_needed, input_required, info

set -euo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
NOTIFY_ENABLED="$CLAUDE_DIR/reflex/notify-enabled"
SPEAK_ENABLED="$CLAUDE_DIR/reflex/speak-enabled"
USER_NAME="${REFLEX_USER_NAME:-}"

TYPE="${1:-info}"
MESSAGE="${2:-Notification from Reflex}"

# Determine title and spoken prefix based on type
case "$TYPE" in
    agent_complete)
        TITLE="Agent Complete"
        SPOKEN_PREFIX="the agent has finished"
        ;;
    action_needed)
        TITLE="Action Needed"
        SPOKEN_PREFIX="action is needed"
        ;;
    input_required)
        TITLE="Input Required"
        SPOKEN_PREFIX="your input is required"
        ;;
    *)
        TITLE="Reflex"
        SPOKEN_PREFIX=""
        ;;
esac

# Send macOS notification if enabled
if [ -f "$NOTIFY_ENABLED" ]; then
    osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\" sound name \"Glass\"" 2>/dev/null || true
fi

# Speak notification if enabled
if [ -f "$SPEAK_ENABLED" ]; then
    if [ -n "$USER_NAME" ]; then
        if [ -n "$SPOKEN_PREFIX" ]; then
            say "Hey $USER_NAME, $SPOKEN_PREFIX. $MESSAGE" 2>/dev/null &
        else
            say "Hey $USER_NAME, $MESSAGE" 2>/dev/null &
        fi
    else
        if [ -n "$SPOKEN_PREFIX" ]; then
            say "$SPOKEN_PREFIX. $MESSAGE" 2>/dev/null &
        else
            say "$MESSAGE" 2>/dev/null &
        fi
    fi
fi

exit 0
