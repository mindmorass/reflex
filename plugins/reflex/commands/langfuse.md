---
description: Control LangFuse observability integration
allowed-tools: Bash(mkdir:*), Bash(rm:*), Bash(cat:*), Bash(echo:*)
argument-hint: <on|off|status>
---

# LangFuse Integration

Enable or disable LangFuse observability for tool calls and agent interactions.

## Instructions

The state file is stored at `$CLAUDE_CONFIG_DIR/reflex/langfuse-enabled` (default: `~/.claude/reflex/langfuse-enabled`).

### Arguments

- `on` - Enable LangFuse integration
- `off` - Disable LangFuse integration
- `status` - Show current status and configuration

### on

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
mkdir -p "$CLAUDE_DIR/reflex"
touch "$CLAUDE_DIR/reflex/langfuse-enabled"
echo "LangFuse integration enabled."
echo ""
echo "Ensure these environment variables are set:"
echo "  LANGFUSE_BASE_URL (default: http://localhost:3000)"
echo "  LANGFUSE_PUBLIC_KEY"
echo "  LANGFUSE_SECRET_KEY"
```

### off

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
rm -f "$CLAUDE_DIR/reflex/langfuse-enabled"
echo "LangFuse integration disabled."
```

### status

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
if [ -f "$CLAUDE_DIR/reflex/langfuse-enabled" ]; then
    echo "**Status:** Enabled"
else
    echo "**Status:** Disabled"
fi
echo ""
echo "**Configuration:**"
echo "- Host: ${LANGFUSE_BASE_URL:-http://localhost:3000}"
echo "- Public Key: ${LANGFUSE_PUBLIC_KEY:-<not set>}"
echo "- Secret Key: ${LANGFUSE_SECRET_KEY:+<set>}${LANGFUSE_SECRET_KEY:-<not set>}"
```

### No argument or invalid

If no argument or invalid argument provided, show usage:

```
Usage: /reflex:langfuse <on|off|status>

Control LangFuse observability integration.

Commands:
  on      Enable LangFuse tracing for tool calls
  off     Disable LangFuse tracing (default)
  status  Show current status and configuration
```
