#!/bin/bash
# LangFuse integration hook for Reflex
# Called by Claude Code PostToolUse hook
# Only traces if ~/.config/reflex/langfuse-enabled exists

set -euo pipefail

STATE_FILE="$HOME/.config/reflex/langfuse-enabled"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Exit silently if LangFuse is disabled
if [ ! -f "$STATE_FILE" ]; then
    exit 0
fi

# Check required environment variables
if [ -z "${LANGFUSE_PUBLIC_KEY:-}" ] || [ -z "${LANGFUSE_SECRET_KEY:-}" ]; then
    # Missing credentials - exit silently to avoid noise
    exit 0
fi

# Read tool data from stdin (JSON from Claude Code hook)
TOOL_DATA=$(cat)

# Call Python script to send trace using uvx (ensures langfuse is available)
# Uses Python 3.12 for compatibility with langfuse/pydantic
exec uvx --quiet --python 3.12 --with langfuse python "$SCRIPT_DIR/langfuse-trace.py" <<< "$TOOL_DATA"
