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
echo "## Active Guardrail Patterns"
echo ""
echo "### CRITICAL (Blocked Entirely)"
echo "| Pattern | Category | Description |"
echo "|---------|----------|-------------|"
echo "| rm_root | file_deletion | Recursive deletion of root/system directories |"
echo "| dd_device | disk_destruction | Direct disk write with dd |"
echo "| mkfs_device | disk_destruction | Filesystem creation |"
echo "| git_force_push_main | git_destructive | Force push to main/master |"
echo "| drop_database | database_destructive | DROP DATABASE/SCHEMA |"
echo "| truncate_table | database_destructive | TRUNCATE TABLE |"
echo "| chmod_777_recursive | security | chmod 777 on system paths |"
echo ""
echo "### HIGH (Require Confirmation)"
echo "| Pattern | Category | Description |"
echo "|---------|----------|-------------|"
echo "| rm_recursive | file_deletion | rm -rf or rm -r |"
echo "| rm_force | file_deletion | rm -f (forced) |"
echo "| git_reset_hard | git_destructive | git reset --hard |"
echo "| git_clean_force | git_destructive | git clean -f |"
echo "| git_force_push | git_destructive | git push --force (any branch) |"
echo "| terraform_destroy | cloud_destructive | terraform destroy |"
echo "| aws_terminate | cloud_destructive | AWS resource termination |"
echo "| kubectl_delete_namespace | cloud_destructive | K8s namespace deletion |"
echo "| docker_system_prune_all | container_destructive | docker system prune -a |"
echo ""
echo "### MEDIUM (Require Confirmation)"
echo "| Pattern | Category | Description |"
echo "|---------|----------|-------------|"
echo "| delete_sql | database_destructive | DELETE FROM statements |"
echo "| write_system_config | system_modification | Writing to /etc |"
echo "| write_ssh_config | system_modification | Writing to ~/.ssh |"
echo "| helm_uninstall | cloud_destructive | Helm release uninstall |"
echo "| docker_volume_rm | container_destructive | Docker volume removal |"
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
