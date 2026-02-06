#!/usr/bin/env bash
#
# mcp-generate.sh — Generate .mcp.json from catalog + user config
#
# Reads the MCP server catalog and user configuration to produce
# a .mcp.json file containing only installed+enabled servers.
#
# Usage:
#   mcp-generate.sh [options]
#
# Options:
#   --dry-run         Print what would be generated without writing
#   --migrate         First-run: create config from existing .mcp.json or catalog defaults
#   --output <path>   Override output location (default: ${WORKSPACE_HOME:-$HOME}/.mcp.json)
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
OUTPUT_PATH="${WORKSPACE_HOME:-$HOME}/.mcp.json"
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
        --output)
            OUTPUT_PATH="$2"
            shift 2
            ;;
        --catalog)
            CATALOG_PATH="$2"
            shift 2
            ;;
        --config)
            CONFIG_PATH="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: mcp-generate.sh [--dry-run] [--migrate] [--output <path>] [--catalog <path>] [--config <path>]"
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

# Validate catalog exists
if [[ ! -f "$CATALOG_PATH" ]]; then
    echo "Error: Catalog not found at $CATALOG_PATH" >&2
    exit 1
fi

# Migration: create config from existing .mcp.json or catalog defaults
if [[ "$MIGRATE" == true ]] || [[ ! -f "$CONFIG_PATH" ]]; then
    mkdir -p "$(dirname "$CONFIG_PATH")"

    if [[ -f "$OUTPUT_PATH" ]] && jq -e '.mcpServers' "$OUTPUT_PATH" &>/dev/null; then
        # Existing .mcp.json found — migrate: mark all present servers as installed+enabled
        echo "Migrating from existing $OUTPUT_PATH..."
        EXISTING_SERVERS=$(jq -r '.mcpServers | keys[]' "$OUTPUT_PATH")
        CONFIG='{"version":1,"servers":{}}'
        for server in $EXISTING_SERVERS; do
            # Only include servers that exist in the catalog
            if jq -e ".servers[\"$server\"]" "$CATALOG_PATH" &>/dev/null; then
                CONFIG=$(echo "$CONFIG" | jq --arg s "$server" '.servers[$s] = {"installed": true, "enabled": true}')
            fi
        done
        echo "$CONFIG" | jq '.' > "$CONFIG_PATH"
        echo "Migrated $(echo "$CONFIG" | jq '.servers | length') servers to $CONFIG_PATH"
    else
        # No existing .mcp.json — use catalog defaults (all servers installed+enabled)
        echo "First run: creating config with all servers installed+enabled..."
        CATALOG_SERVERS=$(jq -r '.servers | keys[]' "$CATALOG_PATH")
        CONFIG='{"version":1,"servers":{}}'
        for server in $CATALOG_SERVERS; do
            CONFIG=$(echo "$CONFIG" | jq --arg s "$server" '.servers[$s] = {"installed": true, "enabled": true}')
        done
        echo "$CONFIG" | jq '.' > "$CONFIG_PATH"
        echo "Created config with $(echo "$CONFIG" | jq '.servers | length') servers at $CONFIG_PATH"
    fi
fi

# Validate config exists (should exist after migration or was pre-existing)
if [[ ! -f "$CONFIG_PATH" ]]; then
    echo "Error: Config not found at $CONFIG_PATH" >&2
    echo "Run with --migrate to create initial configuration." >&2
    exit 1
fi

# Build .mcp.json from catalog + config
# Get list of servers that are installed AND enabled
ENABLED_SERVERS=$(jq -r '.servers | to_entries[] | select(.value.installed == true and .value.enabled == true) | .key' "$CONFIG_PATH")

if [[ -z "$ENABLED_SERVERS" ]]; then
    OUTPUT='{"_generated":"by reflex mcp-generate.sh -- do not edit manually","mcpServers":{}}'
else
    OUTPUT='{"_generated":"by reflex mcp-generate.sh -- do not edit manually","mcpServers":{}}'
    for server in $ENABLED_SERVERS; do
        DEFINITION=$(jq -c ".servers[\"$server\"].definition // empty" "$CATALOG_PATH")
        if [[ -n "$DEFINITION" ]]; then
            OUTPUT=$(echo "$OUTPUT" | jq --arg s "$server" --argjson d "$DEFINITION" '.mcpServers[$s] = $d')
        else
            echo "Warning: Server '$server' not found in catalog, skipping." >&2
        fi
    done
fi

# Format output
FORMATTED=$(echo "$OUTPUT" | jq '.')

# Count enabled servers
TOTAL=$(jq '.servers | length' "$CATALOG_PATH")
ENABLED_COUNT=$(echo "$FORMATTED" | jq '.mcpServers | length')

if [[ "$DRY_RUN" == true ]]; then
    echo "=== Dry run: would write to $OUTPUT_PATH ==="
    echo "$FORMATTED"
    echo ""
    echo "Servers: $ENABLED_COUNT/$TOTAL enabled"
else
    # Atomic write
    TEMP_FILE=$(mktemp)
    echo "$FORMATTED" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$OUTPUT_PATH"
    echo "Generated $OUTPUT_PATH with $ENABLED_COUNT/$TOTAL servers enabled."
fi
