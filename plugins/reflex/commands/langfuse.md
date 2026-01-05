---
description: Control LangFuse observability integration
allowed-tools: Bash(mkdir:*), Bash(rm:*), Bash(cat:*), Bash(echo:*)
argument-hint: <on|off|status>
---

# LangFuse Integration

Enable or disable LangFuse observability for tool calls and agent interactions.

## Instructions

The state file is stored at `~/.config/reflex/langfuse-enabled`.

### Arguments

- `on` - Enable LangFuse integration
- `off` - Disable LangFuse integration
- `status` - Show current status and configuration

### on

```bash
mkdir -p ~/.config/reflex
touch ~/.config/reflex/langfuse-enabled
echo "LangFuse integration enabled."
echo ""
echo "Ensure these environment variables are set:"
echo "  LANGFUSE_HOST (default: http://localhost:3000)"
echo "  LANGFUSE_PUBLIC_KEY"
echo "  LANGFUSE_SECRET_KEY"
```

### off

```bash
rm -f ~/.config/reflex/langfuse-enabled
echo "LangFuse integration disabled."
```

### status

```bash
if [ -f ~/.config/reflex/langfuse-enabled ]; then
    echo "**Status:** Enabled"
else
    echo "**Status:** Disabled"
fi
echo ""
echo "**Configuration:**"
echo "- Host: ${LANGFUSE_HOST:-http://localhost:3000}"
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
