#!/usr/bin/env python3
"""
LangFuse trace sender for Claude Code tool calls.

Receives tool call data from stdin (JSON) and sends it to LangFuse.
Designed to be called from langfuse-hook.sh as a PostToolUse hook.

Environment variables:
  LANGFUSE_BASE_URL    - LangFuse server URL (default: http://localhost:3000)
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
    from langfuse import get_client, propagate_attributes
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


def debug_log(msg: str) -> None:
    """Write debug message to log file."""
    log_path = os.path.join(
        os.environ.get("CLAUDE_CONFIG_DIR", os.path.expanduser("~/.claude")),
        "reflex", "langfuse-debug.log"
    )
    with open(log_path, "a") as f:
        f.write(f"[PYTHON] {msg}\n")


def send_trace(tool_data: dict) -> None:
    """Send tool call trace to LangFuse using SDK v3 API."""
    host = os.environ.get("LANGFUSE_BASE_URL", "http://localhost:3000")
    public_key = os.environ.get("LANGFUSE_PUBLIC_KEY")
    secret_key = os.environ.get("LANGFUSE_SECRET_KEY")

    debug_log(f"host={host}")
    debug_log(f"public_key={'<set>' if public_key else '<not set>'}")
    debug_log(f"secret_key={'<set>' if secret_key else '<not set>'}")

    if not public_key or not secret_key:
        debug_log("Missing credentials, returning")
        return

    try:
        # Set environment variables for get_client() to use
        os.environ["LANGFUSE_HOST"] = host

        debug_log("Getting Langfuse client...")
        langfuse = get_client()
        debug_log("Langfuse client obtained")

        parsed = parse_tool_data(tool_data)
        # Use session_id from Claude Code or generate one
        session_id = parsed.get("session_id") or get_session_id()

        # SDK v3 uses start_as_current_observation with context manager
        # Use propagate_attributes for session_id and user_id
        user_id = os.environ.get("LANGFUSE_USER_ID", os.environ.get("HOME", "unknown"))
        debug_log(f"Creating span for tool:{parsed['tool_name']}")
        debug_log(f"user_id={user_id}")

        with propagate_attributes(session_id=session_id, user_id=user_id):
            with langfuse.start_as_current_observation(
                as_type="span",
                name=f"tool:{parsed['tool_name']}",
                input=parsed["tool_input"],
                metadata={
                    "source": "claude-code",
                    "plugin": "reflex",
                    "tool_name": parsed["tool_name"],
                    "tool_use_id": parsed.get("tool_use_id"),
                    "success": parsed["success"],
                },
            ) as span:
                # Update with output
                span.update(output=parsed["tool_response"])

                # Add error level if there was an error
                if parsed["error"]:
                    span.update(level="ERROR", status_message=str(parsed["error"]))

        debug_log(f"Span created: tool:{parsed['tool_name']}")

        # Flush to ensure data is sent
        debug_log("Flushing...")
        langfuse.flush()
        debug_log("Flush complete")

    except Exception as e:
        # Log error for debugging
        debug_log(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        debug_log(f"Traceback: {traceback.format_exc()}")


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
