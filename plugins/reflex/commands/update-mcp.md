---
description: Check for and apply MCP server package updates
allowed-tools: Bash(cat:*), Bash(curl:*), Bash(jq:*), Bash(npm:*), Bash(echo:*), Bash(sed:*), Bash(kill:*), Read, Edit
argument-hint: <check|apply|clear-cache>
---

# Update MCP Packages

Check for updates to MCP server packages and optionally apply them.

## Instructions

### Arguments

- `check` - Check for available updates (default)
- `apply` - Apply all available updates to MCP server versions
- `clear-cache` - Clear npx and uvx caches to force fresh downloads

### check

Check npm and PyPI for newer versions of pinned packages:

```bash
echo "Checking MCP package versions..."
echo ""

CATALOG="${CLAUDE_PLUGIN_ROOT}/mcp-catalog.json"

# npm packages
echo "**npm packages:**"
for pkg in $(cat "$CATALOG" | jq -r '.servers | to_entries[] | select(.value.definition.command == "npx") | .value.definition.args[] | select(contains("@") and (startswith("-") | not) and (startswith("http") | not))' | sort -u); do
  # Extract package name (everything before last @) and version (after last @)
  name=$(echo "$pkg" | sed 's/@[^@]*$//')
  current=$(echo "$pkg" | grep -oE '[^@]+$')
  if [ -n "$name" ] && [ -n "$current" ]; then
    # Get latest from npm
    latest=$(npm view "$name" version 2>/dev/null)
    if [ -n "$latest" ]; then
      if [ "$current" != "$latest" ]; then
        echo "  ↑ $name: $current → $latest"
      else
        echo "  ✓ $name: $current (latest)"
      fi
    fi
  fi
done

echo ""
echo "**PyPI packages:**"
for pkg in $(cat "$CATALOG" | jq -r '.servers | to_entries[] | select(.value.definition.command == "uvx") | .value.definition.args[] | select(contains("=="))'); do
  # Extract package name and current version
  name="${pkg%%==*}"
  # Handle packages with repository suffix
  name="${name%%\[*}"
  current="${pkg##*==}"
  # Get latest from PyPI
  latest=$(curl -s "https://pypi.org/pypi/$name/json" 2>/dev/null | jq -r '.info.version // empty')
  if [ -n "$latest" ]; then
    if [ "$current" != "$latest" ]; then
      echo "  ↑ $name: $current → $latest"
    else
      echo "  ✓ $name: $current (latest)"
    fi
  fi
done

echo ""
echo "Run '/reflex:update-mcp apply' to update mcp-catalog.json with latest versions."
```

### apply

Apply updates - read the current mcp-catalog.json, update to latest versions, and show diff.

First, run the check logic but capture the updates, then use the Edit tool to update mcp-catalog.json with new versions.

The assistant should:
1. Read the mcp-catalog.json file
2. For each package, query npm/PyPI for latest version
3. Use Edit tool to update each version string in mcp-catalog.json
4. Run `${CLAUDE_PLUGIN_ROOT}/scripts/mcp-generate.sh` to sync updated servers with Claude Code
5. Show summary of changes

### clear-cache

Clear package manager caches to force fresh downloads on next MCP server start:

```bash
echo "Clearing package caches..."
echo ""

# Clear npx cache
echo "Clearing npx cache..."
if command -v npx &>/dev/null; then
  npm cache clean --force 2>/dev/null
  echo "  ✓ npm cache cleared"
else
  echo "  ⚠ npm/npx not found"
fi

echo ""

# Clear uvx cache
echo "Clearing uvx cache..."
if command -v uv &>/dev/null; then
  uv cache clean --force 2>/dev/null &
  UVPID=$!
  sleep 2
  if kill -0 $UVPID 2>/dev/null; then
    echo "  ⏳ uv cache clean running in background (PID: $UVPID)"
  else
    echo "  ✓ uv cache cleared"
  fi
else
  echo "  ⚠ uv/uvx not found"
fi

echo ""
echo "Cache cleared. MCP servers will download fresh packages on next start."
echo "Restart Claude Code to reconnect to MCP servers."
```

### No argument or help

If no argument provided, run check by default:

```
Usage: /reflex:update-mcp <check|apply|clear-cache>

Manage MCP server package versions.

Commands:
  check        Check for available updates (default)
  apply        Apply updates to MCP server versions
  clear-cache  Clear npx/uvx caches

Version Format:
  npm packages:  @package/name@1.2.3
  PyPI packages: package-name==1.2.3

Notes:
  - Remote MCP servers (https://) are not versioned locally
  - After applying updates, restart Claude Code to use new versions
  - Use clear-cache if packages seem stale despite version updates
```
