#!/usr/bin/env python3
"""
LangFuse trace sender for Claude Code tool calls.

Receives tool call data from stdin (JSON) and sends it to LangFuse.
Designed to be called from langfuse-hook.sh as a PostToolUse hook.

Environment variables:
  LANGFUSE_HOST        - LangFuse server URL (default: http://localhost:3000)
  LANGFUSE_PUBLIC_KEY  - LangFuse public key (required)
  LANGFUSE_SECRET_KEY  - LangFuse secret key (required)
  LANGFUSE_SESSION_ID  - Optional session ID for grouping traces
"""

import json
import os
import sys
from datetime import datetime, timezone

# Check for langfuse package
try:
    from langfuse import Langfuse
except ImportError:
    # Silently exit if langfuse not installed
    sys.exit(0)


def get_session_id() -> str:
    """Get or generate a session ID for trace grouping."""
    # Use provided session ID or generate from timestamp
    return os.environ.get(
        "LANGFUSE_SESSION_ID",
        f"claude-code-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
    )


def parse_tool_data(data: dict) -> dict:
    """Extract relevant fields from Claude Code tool call data."""
    # Claude Code PostToolUse hook sends: tool_name, tool_input, tool_response
    tool_response = data.get("tool_response", {})

    # Determine if there was an error
    error = tool_response.get("stderr") if tool_response.get("stderr") else None

    return {
        "tool_name": data.get("tool_name", "unknown"),
        "tool_input": data.get("tool_input", {}),
        "tool_response": tool_response,
        "session_id": data.get("session_id"),
        "tool_use_id": data.get("tool_use_id"),
        "success": not bool(error),
        "error": error,
    }


def send_trace(tool_data: dict) -> None:
    """Send tool call trace to LangFuse."""
    host = os.environ.get("LANGFUSE_HOST", "http://localhost:3000")
    public_key = os.environ.get("LANGFUSE_PUBLIC_KEY")
    secret_key = os.environ.get("LANGFUSE_SECRET_KEY")

    if not public_key or not secret_key:
        return

    try:
        langfuse = Langfuse(
            host=host,
            public_key=public_key,
            secret_key=secret_key,
        )

        parsed = parse_tool_data(tool_data)
        # Use session_id from Claude Code or generate one
        session_id = parsed.get("session_id") or get_session_id()

        # Create a span for the tool call (creates visible trace)
        # Note: session_id is included in metadata since start_span doesn't support it directly
        span = langfuse.start_span(
            name=f"tool:{parsed['tool_name']}",
            input=parsed["tool_input"],
            output=parsed["tool_response"],
            level="ERROR" if parsed["error"] else "DEFAULT",
            status_message=str(parsed["error"]) if parsed["error"] else None,
            metadata={
                "source": "claude-code",
                "plugin": "reflex",
                "tool_name": parsed["tool_name"],
                "tool_use_id": parsed.get("tool_use_id"),
                "session_id": session_id,
                "success": parsed["success"],
            },
        )
        span.end()

        # Flush to ensure data is sent
        langfuse.flush()

    except Exception:
        # Silently fail - don't interrupt Claude Code
        pass


def main():
    """Read tool data from stdin and send trace."""
    try:
        raw_input = sys.stdin.read().strip()
        if not raw_input:
            return

        tool_data = json.loads(raw_input)
        send_trace(tool_data)

    except json.JSONDecodeError:
        # Invalid JSON - skip silently
        pass
    except Exception:
        # Any other error - skip silently
        pass


if __name__ == "__main__":
    main()
