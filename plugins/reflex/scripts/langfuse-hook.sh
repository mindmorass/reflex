#!/bin/bash
# LangFuse integration hook for Reflex
# Called by Claude Code PostToolUse hook
# Only traces if state file exists

set -euo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-${HOME}/.claude}"
STATE_FILE="${CLAUDE_DIR}/reflex/langfuse-enabled"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEBUG_LOG="${CLAUDE_DIR}/reflex/langfuse-debug.log"
mkdir -p "$(dirname "$DEBUG_LOG")" 2>/dev/null || true

# Debug function
debug() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$DEBUG_LOG"
}

# Determine user_id from WORKSPACE_PROFILE or fallback to HOME
LANGFUSE_USER_ID="${WORKSPACE_PROFILE:-$HOME}"
export LANGFUSE_USER_ID

debug "Hook started"
debug "STATE_FILE=$STATE_FILE"
debug "LANGFUSE_BASE_URL=${LANGFUSE_BASE_URL:-<not set>}"
debug "LANGFUSE_PUBLIC_KEY=${LANGFUSE_PUBLIC_KEY:+<set>}"
debug "LANGFUSE_SECRET_KEY=${LANGFUSE_SECRET_KEY:+<set>}"
debug "LANGFUSE_USER_ID=$LANGFUSE_USER_ID"

# Exit silently if LangFuse is disabled
if [ ! -f "$STATE_FILE" ]; then
    debug "State file not found, exiting"
    exit 0
fi

# Check required environment variables
if [ -z "${LANGFUSE_PUBLIC_KEY:-}" ] || [ -z "${LANGFUSE_SECRET_KEY:-}" ]; then
    debug "Missing credentials, exiting"
    exit 0
fi

# Read tool data from stdin (JSON from Claude Code hook)
TOOL_DATA=$(cat)
debug "Tool data received: ${TOOL_DATA:0:200}..."

# Call Python script to send trace using uvx (ensures langfuse is available)
# Prefer Python 3.12 for langfuse/pydantic compatibility, fall back to system default
PYTHON_FLAG="--python 3.12"
if ! uvx --quiet --python 3.12 python -c "pass" 2>/dev/null; then
    debug "Python 3.12 not available, using system default"
    PYTHON_FLAG=""
fi
debug "Calling uvx python langfuse-trace.py ($PYTHON_FLAG)"
uvx --quiet $PYTHON_FLAG --with langfuse python "$SCRIPT_DIR/langfuse-trace.py" <<< "$TOOL_DATA" 2>>"$DEBUG_LOG"
EXIT_CODE=$?
debug "uvx exit code: $EXIT_CODE"
exit $EXIT_CODE
