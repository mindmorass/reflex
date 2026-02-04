---
description: Configure the Reflex status line for Claude Code
allowed-tools: Bash, Read, Write, Edit
argument-hint: <on|off|status|color>
---

# Reflex Status Line

Configure the Claude Code status line to show model, directory, git branch, sync status, context usage, and last user message.

## Instructions

Handle the argument provided:

### `on` (or no argument)

1. Determine the plugin scripts path. The statusline script is at:
   ```
   plugins/reflex/scripts/statusline.sh
   ```
   Find the absolute path by checking common locations:
   - Check if `~/.claude/plugins/reflex@mindmorass-reflex/plugins/reflex/scripts/statusline.sh` exists (marketplace install)
   - Check if the script exists relative to this command's location
   - As a fallback, search for it with: `find ~/.claude -name "statusline.sh" -path "*/reflex/scripts/*" 2>/dev/null | head -1`

2. Verify the script exists and is executable. If not executable, run `chmod +x` on it.

3. Check that `jq` is installed (required dependency):
   ```bash
   command -v jq >/dev/null 2>&1
   ```
   If not found, inform the user: "The status line requires `jq`. Install it with: `brew install jq` (macOS) or `apt-get install jq` (Linux)"

4. Configure Claude Code's status line by running:
   ```bash
   claude config set --global statusLine '{"type": "command", "command": "<absolute-path-to-statusline.sh>"}'
   ```

5. Confirm: "Status line enabled. Restart Claude Code to see it. Customize color with: `export REFLEX_STATUSLINE_COLOR=<color>`"

   Available colors: gray, orange, blue (default), teal, green, lavender, rose, gold, slate, cyan

### `off`

1. Remove the status line configuration:
   ```bash
   claude config set --global statusLine ''
   ```

2. Confirm: "Status line disabled. Restart Claude Code to apply."

### `status`

1. Read the current status line configuration:
   ```bash
   claude config get --global statusLine
   ```

2. Report whether it's enabled, disabled, and what script path is configured.
3. Show the current color setting: `echo $REFLEX_STATUSLINE_COLOR` (defaults to "blue" if unset).

### `color`

If the argument is a color name (gray, orange, blue, teal, green, lavender, rose, gold, slate, cyan):

1. Inform the user to set the environment variable:
   ```bash
   export REFLEX_STATUSLINE_COLOR="<color>"
   ```

2. Suggest adding it to their shell profile for persistence.

If the argument is literally "color" with no value, list available colors.

## Status Line Features

- **Model**: Current Claude model name
- **Directory**: Working directory name
- **Git branch**: Current branch with uncommitted file count
- **Sync status**: Ahead/behind upstream, time since last fetch
- **Context bar**: Visual progress bar showing token usage percentage
- **Last message**: Your most recent message (second line)
