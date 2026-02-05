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
   - Check if `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/reflex@mindmorass-reflex/plugins/reflex/scripts/statusline.sh` exists (marketplace install)
   - Check if the script exists relative to this command's location
   - As a fallback, search for it with: `find "${CLAUDE_CONFIG_DIR:-$HOME/.claude}" -name "statusline.sh" -path "*/reflex/scripts/*" 2>/dev/null | head -1`

2. Verify the script exists and is executable. If not executable, run `chmod +x` on it.

3. Check that `jq` is installed (required dependency):
   ```bash
   command -v jq >/dev/null 2>&1
   ```
   If not found, inform the user: "The status line requires `jq`. Install it with: `brew install jq` (macOS) or `apt-get install jq` (Linux)"

4. Configure Claude Code's status line by writing directly to the settings file:
   ```bash
   SETTINGS_FILE="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
   ```
   - If the file exists, use `jq` to set the `statusLine` key
   - If not, create it with the statusLine entry
   ```bash
   jq '.statusLine = {"type": "command", "command": "<absolute-path-to-statusline.sh>"}' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
   ```
   If the file doesn't exist yet:
   ```bash
   mkdir -p "$(dirname "$SETTINGS_FILE")"
   echo '{"statusLine": {"type": "command", "command": "<absolute-path-to-statusline.sh>"}}' > "$SETTINGS_FILE"
   ```

5. Confirm: "Status line enabled. Restart Claude Code to see it. Customize color with: `export REFLEX_STATUSLINE_COLOR=<color>`"

   Available colors: gray, orange, blue (default), teal, green, lavender, rose, gold, slate, cyan

### `off`

1. Remove the status line configuration:
   ```bash
   SETTINGS_FILE="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
   jq 'del(.statusLine)' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
   ```

2. Confirm: "Status line disabled. Restart Claude Code to apply."

### `status`

1. Read the current status line configuration:
   ```bash
   SETTINGS_FILE="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
   jq '.statusLine // empty' "$SETTINGS_FILE" 2>/dev/null
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
