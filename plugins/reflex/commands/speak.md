---
description: Control spoken notifications for Claude Code events
allowed-tools: Bash(mkdir:*), Bash(rm:*), Bash(cat:*), Bash(echo:*), Bash(say:*)
argument-hint: <on|off|status|test>
---

# Spoken Notifications

Enable or disable spoken notifications for Claude Code events (agent completion, action needed, input required).

## Instructions

The state file is stored at `$CLAUDE_CONFIG_DIR/reflex/speak-enabled` (default: `~/.claude/reflex/speak-enabled`).

Set `REFLEX_USER_NAME` environment variable to personalize spoken notifications (e.g., "Hey John, the agent has finished").

### Arguments

- `on` - Enable spoken notifications
- `off` - Disable spoken notifications
- `status` - Show current status
- `test` - Speak a test message

### on

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
mkdir -p "$CLAUDE_DIR/reflex"
touch "$CLAUDE_DIR/reflex/speak-enabled"
echo "Spoken notifications enabled."
USER_NAME="${REFLEX_USER_NAME:-}"
if [ -n "$USER_NAME" ]; then
    say "Hey $USER_NAME, spoken notifications are now enabled"
else
    say "Spoken notifications are now enabled"
fi
```

### off

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
rm -f "$CLAUDE_DIR/reflex/speak-enabled"
echo "Spoken notifications disabled."
```

### status

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
if [ -f "$CLAUDE_DIR/reflex/speak-enabled" ]; then
    echo "**Status:** Enabled"
else
    echo "**Status:** Disabled"
fi
echo ""
echo "**User Name:** ${REFLEX_USER_NAME:-<not set>}"
echo ""
echo "Set REFLEX_USER_NAME to personalize spoken notifications."
```

### test

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
if [ -f "$CLAUDE_DIR/reflex/speak-enabled" ]; then
    USER_NAME="${REFLEX_USER_NAME:-}"
    if [ -n "$USER_NAME" ]; then
        say "Hey $USER_NAME, this is a test notification from Reflex"
    else
        say "This is a test notification from Reflex"
    fi
    echo "Test message spoken."
else
    echo "Spoken notifications are disabled. Enable with: /reflex:speak on"
fi
```

### No argument or invalid

If no argument or invalid argument provided, show usage:

```
Usage: /reflex:speak <on|off|status|test>

Control spoken notifications for Claude Code events.

Commands:
  on      Enable spoken notifications
  off     Disable spoken notifications
  status  Show current status
  test    Speak a test message

Environment Variables:
  REFLEX_USER_NAME  Personalize notifications (e.g., "Hey John, ...")

Events that trigger speech:
  - Agent task completed
  - User action needed
  - Input required

Example:
  export REFLEX_USER_NAME="John"
  /reflex:speak on
```
