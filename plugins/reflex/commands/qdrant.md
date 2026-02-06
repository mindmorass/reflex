---
description: Control Qdrant vector database connection (on/off)
allowed-tools: Bash(touch:*), Bash(rm:*), Bash(cat:*), Bash(curl:*), Bash(echo:*)
argument-hint: <on|off|status>
---

# Qdrant Connection Control

Enable or disable Qdrant tool calls within the current session. When disabled, a PreToolUse hook blocks all qdrant MCP tool calls. This assumes you have Qdrant running and accessible (self-managed, Docker, or hosted).

## Instructions

### Arguments

- `on` - Enable Qdrant connection
- `off` - Disable Qdrant connection
- `status` - Show connection status and health

### on

```bash
mkdir -p "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/reflex"
touch "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/reflex/qdrant-enabled"
echo "Qdrant connection enabled."
echo ""
echo "**Checking connectivity...**"
QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"
if curl -s "${QDRANT_URL}/readyz" >/dev/null 2>&1; then
    echo "✓ Qdrant is reachable at ${QDRANT_URL}"
else
    echo "⚠ Qdrant is not responding at ${QDRANT_URL}"
    echo "  Set QDRANT_URL environment variable if using a different endpoint."
fi
```

### off

```bash
rm -f "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/reflex/qdrant-enabled"
echo "Qdrant connection disabled."
```

### status

```bash
QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"
echo "**Connection Status:**"
if [ -f "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/reflex/qdrant-enabled" ]; then
    echo "  Enabled: yes"
else
    echo "  Enabled: no"
fi
echo "  Endpoint: ${QDRANT_URL}"
echo ""
echo "**Health Check:**"
if curl -s "${QDRANT_URL}/readyz" >/dev/null 2>&1; then
    echo "  ✓ Qdrant is healthy and ready"
    # Get collections count
    COLLECTIONS=$(curl -s "${QDRANT_URL}/collections" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
    if [ -n "$COLLECTIONS" ]; then
        echo "  Collections: ${COLLECTIONS}"
    fi
else
    echo "  ✗ Qdrant is not responding"
fi
```

### No argument or invalid

If no argument or invalid argument provided, show usage:

```
Usage: /reflex:qdrant <on|off|status>

Control Qdrant vector database connection.

Commands:
  on      Enable Qdrant connection
  off     Disable Qdrant connection
  status  Show connection status and health

Configuration:
  Set QDRANT_URL environment variable to specify endpoint.
  Default: http://localhost:6333

Example:
  export QDRANT_URL="http://localhost:6333"
  export QDRANT_URL="https://my-cluster.qdrant.io"
```
