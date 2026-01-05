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
    return {
        "tool_name": data.get("tool_name", data.get("name", "unknown")),
        "tool_input": data.get("tool_input", data.get("input", {})),
        "tool_output": data.get("tool_output", data.get("output", "")),
        "tool_result": data.get("tool_result", data.get("result", {})),
        "duration_ms": data.get("duration_ms", 0),
        "success": data.get("success", True),
        "error": data.get("error"),
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
        session_id = get_session_id()
        output = parsed["tool_output"] or parsed["tool_result"]

        # Create an event for the tool call
        langfuse.create_event(
            name=f"tool:{parsed['tool_name']}",
            session_id=session_id,
            input=parsed["tool_input"],
            output=output,
            level="ERROR" if parsed["error"] else "DEFAULT",
            status_message=str(parsed["error"]) if parsed["error"] else None,
            metadata={
                "source": "claude-code",
                "plugin": "reflex",
                "tool_name": parsed["tool_name"],
                "success": parsed["success"],
            },
        )

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
