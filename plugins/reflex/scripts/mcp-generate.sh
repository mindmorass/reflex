#!/usr/bin/env bash
#
# mcp-generate.sh — Sync MCP servers to Claude Code via `claude mcp`
#
# Reads the MCP server catalog and user configuration, then uses
# `claude mcp add-json` and `claude mcp remove` to register/unregister
# servers in Claude Code's user-scope configuration.
#
# Usage:
#   mcp-generate.sh [options]
#
# Options:
#   --dry-run         Print what would be changed without applying
#   --migrate         First-run: create config from catalog defaults
#   --catalog <path>  Override catalog location
#   --config <path>   Override user config location
#

set -euo pipefail

# Resolve script directory (works even if symlinked)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Defaults
CATALOG_PATH="${PLUGIN_DIR}/mcp-catalog.json"
CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/reflex"
CONFIG_PATH="${CONFIG_DIR}/mcp-config.json"
DRY_RUN=false
MIGRATE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --migrate)
            MIGRATE=true
            shift
            ;;
        --catalog)
            CATALOG_PATH="$2"
            shift 2
            ;;
        --config)
            CONFIG_PATH="$2"
            shift 2
            ;;
        --output)
            # Ignored for backwards compatibility (callers may still pass this)
            shift 2
            ;;
        --help|-h)
            echo "Usage: mcp-generate.sh [--dry-run] [--migrate] [--catalog <path>] [--config <path>]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# Check dependencies
if ! command -v jq &>/dev/null; then
    echo "Error: jq is required but not installed." >&2
    echo "Install via: brew install jq (macOS) or apt install jq (Linux)" >&2
    exit 1
fi

if ! command -v claude &>/dev/null; then
    echo "Error: claude CLI is required but not found in PATH." >&2
    exit 1
fi

# Validate catalog exists
if [[ ! -f "$CATALOG_PATH" ]]; then
    echo "Error: Catalog not found at $CATALOG_PATH" >&2
    exit 1
fi

# Migration: create config from catalog defaults
if [[ "$MIGRATE" == true ]] || [[ ! -f "$CONFIG_PATH" ]]; then
    mkdir -p "$(dirname "$CONFIG_PATH")"

    echo "First run: creating config with all catalog servers..."
    CATALOG_SERVERS=$(jq -r '.servers | keys[]' "$CATALOG_PATH")
    CONFIG='{"version":1,"servers":{}}'
    for server in $CATALOG_SERVERS; do
        CONFIG=$(echo "$CONFIG" | jq --arg s "$server" '.servers[$s] = {"installed": true, "enabled": true}')
    done
    echo "$CONFIG" | jq '.' > "$CONFIG_PATH"
    echo "Created config with $(echo "$CONFIG" | jq '.servers | length') servers at $CONFIG_PATH"
fi

# Validate config exists
if [[ ! -f "$CONFIG_PATH" ]]; then
    echo "Error: Config not found at $CONFIG_PATH" >&2
    echo "Run with --migrate to create initial configuration." >&2
    exit 1
fi

# Get list of catalog server names (to identify reflex-managed servers)
CATALOG_SERVERS=$(jq -r '.servers | keys[]' "$CATALOG_PATH")

# Get list of servers that should be enabled
ENABLED_SERVERS=$(jq -r '.servers | to_entries[] | select(.value.installed == true and .value.enabled == true) | .key' "$CONFIG_PATH")

# Get list of servers that should NOT be enabled (disabled or uninstalled)
DISABLED_SERVERS=$(jq -r '.servers | to_entries[] | select(.value.installed != true or .value.enabled != true) | .key' "$CONFIG_PATH")

# Track counts
ADDED=0
REMOVED=0
SKIPPED=0
TOTAL=$(jq '.servers | length' "$CATALOG_PATH")

# Add enabled servers
for server in $ENABLED_SERVERS; do
    DEFINITION=$(jq -c ".servers[\"$server\"].definition // empty" "$CATALOG_PATH")
    if [[ -z "$DEFINITION" ]]; then
        echo "Warning: Server '$server' not found in catalog, skipping." >&2
        continue
    fi

    if [[ "$DRY_RUN" == true ]]; then
        echo "[dry-run] Would add: $server"
        ADDED=$((ADDED + 1))
    else
        # Remove first to ensure clean state (ignore errors if not present)
        claude mcp remove -s user "$server" 2>/dev/null || true
        if claude mcp add-json -s user "$server" "$DEFINITION" 2>/dev/null; then
            echo "Added: $server"
            ADDED=$((ADDED + 1))
        else
            echo "Error adding server '$server'" >&2
        fi
    fi
done

# Remove disabled/uninstalled servers that are catalog-managed
for server in $DISABLED_SERVERS; do
    # Only remove servers that exist in our catalog (don't touch user's own servers)
    if ! echo "$CATALOG_SERVERS" | grep -qx "$server"; then
        continue
    fi

    if [[ "$DRY_RUN" == true ]]; then
        echo "[dry-run] Would remove: $server"
        REMOVED=$((REMOVED + 1))
    else
        if claude mcp remove -s user "$server" 2>/dev/null; then
            echo "Removed: $server"
            REMOVED=$((REMOVED + 1))
        fi
    fi
done

# Also remove catalog servers not in config at all (fully uninstalled)
for server in $CATALOG_SERVERS; do
    if ! jq -e ".servers[\"$server\"]" "$CONFIG_PATH" &>/dev/null; then
        if [[ "$DRY_RUN" == true ]]; then
            echo "[dry-run] Would remove (not in config): $server"
            REMOVED=$((REMOVED + 1))
        else
            if claude mcp remove -s user "$server" 2>/dev/null; then
                echo "Removed: $server"
                REMOVED=$((REMOVED + 1))
            fi
        fi
    fi
done

ENABLED_COUNT=$(echo "$ENABLED_SERVERS" | grep -c . 2>/dev/null || echo "0")

if [[ "$DRY_RUN" == true ]]; then
    echo ""
    echo "=== Dry run summary ==="
    echo "Would add: $ADDED servers"
    echo "Would remove: $REMOVED servers"
    echo "Enabled: $ENABLED_COUNT/$TOTAL"
else
    echo "Synced MCP servers: $ENABLED_COUNT/$TOTAL enabled (added $ADDED, removed $REMOVED)."
    echo "Restart Claude Code to apply changes."
fi
