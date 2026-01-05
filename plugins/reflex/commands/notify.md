---
description: Control macOS popup notifications for Claude Code events
allowed-tools: Bash(mkdir:*), Bash(rm:*), Bash(cat:*), Bash(echo:*), Bash(osascript:*)
argument-hint: <on|off|status|test>
---

# macOS Notifications

Enable or disable macOS popup notifications for Claude Code events (agent completion, action needed, input required).

## Instructions

The state file is stored at `$CLAUDE_CONFIG_DIR/reflex/notify-enabled` (default: `~/.claude/reflex/notify-enabled`).

### Arguments

- `on` - Enable macOS notifications
- `off` - Disable macOS notifications
- `status` - Show current status
- `test` - Send a test notification

### on

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
mkdir -p "$CLAUDE_DIR/reflex"
touch "$CLAUDE_DIR/reflex/notify-enabled"
echo "macOS notifications enabled."
osascript -e 'display notification "Notifications are now enabled" with title "Reflex" sound name "Glass"'
```

### off

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
rm -f "$CLAUDE_DIR/reflex/notify-enabled"
echo "macOS notifications disabled."
```

### status

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
if [ -f "$CLAUDE_DIR/reflex/notify-enabled" ]; then
    echo "**Status:** Enabled"
else
    echo "**Status:** Disabled"
fi
```

### test

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
if [ -f "$CLAUDE_DIR/reflex/notify-enabled" ]; then
    osascript -e 'display notification "This is a test notification from Reflex" with title "Reflex Test" sound name "Glass"'
    echo "Test notification sent."
else
    echo "Notifications are disabled. Enable with: /reflex:notify on"
fi
```

### No argument or invalid

If no argument or invalid argument provided, show usage:

```
Usage: /reflex:notify <on|off|status|test>

Control macOS popup notifications for Claude Code events.

Commands:
  on      Enable macOS notifications
  off     Disable macOS notifications
  status  Show current status
  test    Send a test notification

Events that trigger notifications:
  - Agent task completed
  - User action needed
  - Input required
```
