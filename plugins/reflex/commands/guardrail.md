---
description: Control guardrails that protect against destructive AI operations
allowed-tools: Bash(mkdir:*), Bash(rm:*), Bash(cat:*), Bash(echo:*), Bash(touch:*)
argument-hint: <on|off|status|patterns>
---

# Guardrails

Control the Reflex guardrail system that protects against destructive operations caused by AI hallucinations.

## Instructions

The state file is stored at `$CLAUDE_CONFIG_DIR/reflex/guardrail-enabled` (default: `~/.claude/reflex/guardrail-enabled`).

Guardrails are **enabled by default** for safety.

### Arguments

- `on` - Enable guardrails (default state)
- `off` - Temporarily disable guardrails (USE WITH CAUTION)
- `status` - Show current status
- `patterns` - List all active patterns by severity

### on

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
mkdir -p "$CLAUDE_DIR/reflex"
touch "$CLAUDE_DIR/reflex/guardrail-enabled"
echo "Guardrails enabled."
echo ""
echo "Destructive operations will now be blocked or require confirmation."
echo ""
echo "Protected categories:"
echo "  - File deletion (rm -rf, rm -r)"
echo "  - Git destructive (force push, hard reset)"
echo "  - Database destructive (DROP, TRUNCATE, DELETE)"
echo "  - Cloud termination (AWS, GCP, Azure, Kubernetes)"
echo "  - Container destructive (docker prune, volume rm)"
```

### off

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
if [ -f "$CLAUDE_DIR/reflex/guardrail-enabled" ]; then
    rm -f "$CLAUDE_DIR/reflex/guardrail-enabled"
    echo "WARNING: Guardrails disabled."
    echo ""
    echo "Destructive operations will NO LONGER be blocked."
    echo "Re-enable with: /reflex:guardrail on"
else
    echo "Guardrails are already disabled."
fi
```

### status

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
echo "## Guardrail Status"
echo ""
if [ -f "$CLAUDE_DIR/reflex/guardrail-enabled" ]; then
    echo "**Status:** ENABLED (protecting against destructive operations)"
else
    echo "**Status:** DISABLED (no protection active)"
    echo ""
    echo "Enable with: /reflex:guardrail on"
fi
echo ""
echo "**Configuration:**"
if [ -f "$CLAUDE_DIR/reflex/guardrail-config.json" ]; then
    echo "- Custom config: $CLAUDE_DIR/reflex/guardrail-config.json"
else
    echo "- Using default patterns (no custom config)"
fi
echo ""
echo "**Severity Levels:**"
echo "- CRITICAL: Blocked entirely (system destruction, force push to main)"
echo "- HIGH: Requires user confirmation (recursive delete, cloud termination)"
echo "- MEDIUM: Requires user confirmation (SQL DELETE, config overwrites)"
```

### patterns

```bash
# Use Python directly to list patterns — avoids triggering the guardrail
# hook on pattern description strings in echo statements
SCRIPT_DIR="$(dirname "$(readlink -f "${CLAUDE_PLUGIN_ROOT}/scripts/guardrail.py" 2>/dev/null || echo "${CLAUDE_PLUGIN_ROOT}/scripts/guardrail.py")")"
python3 "$SCRIPT_DIR/guardrail.py" --list-patterns
```

### No argument or invalid

If no argument or invalid argument provided, show usage:

```
Usage: /reflex:guardrail <on|off|status|patterns>

Control guardrails that protect against destructive AI operations.

Commands:
  on        Enable guardrails (default state)
  off       Temporarily disable guardrails (DANGEROUS)
  status    Show current status and configuration
  patterns  List all active patterns by severity

Protected Categories:
  - File deletion (rm -rf, rm -r, rm -f)
  - Git destructive (force push, hard reset, clean -f)
  - Database destructive (DROP, TRUNCATE, DELETE)
  - Cloud termination (AWS, GCP, Azure, Kubernetes, Terraform)
  - Container destructive (docker prune, volume/image removal)
  - System modification (writing to /etc, ~/.ssh)

Severity Levels:
  CRITICAL - Blocked entirely, no bypass
  HIGH     - Requires user confirmation
  MEDIUM   - Requires user confirmation

Custom Configuration:
  Create ${CLAUDE_CONFIG_DIR:-$HOME/.claude}/reflex/guardrail-config.json to:
  - Disable specific patterns: {"disabled_patterns": ["pattern_name"]}
  - Override severity: {"severity_overrides": {"pattern": "medium"}}
  - Add custom patterns: {"additional_patterns": [...]}
```
