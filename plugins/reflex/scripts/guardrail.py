#!/usr/bin/env python3
"""
Guardrail pattern matcher for Claude Code PreToolUse hook.

Receives tool call data from stdin (JSON) and evaluates against
destructive operation patterns. Returns decision via exit code
and stderr output.

Exit codes:
  0 = Allow operation
  2 = Block operation (output JSON with deny/ask decision)
"""

import json
import os
import re
import sys
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple


# =============================================================================
# Types and Configuration
# =============================================================================

class Severity(Enum):
    """Severity levels for destructive patterns."""
    CRITICAL = "critical"      # Block entirely, no bypass
    HIGH = "high"              # Require user confirmation
    MEDIUM = "medium"          # Require user confirmation
    LOW = "low"                # Log warning only (future use)


class Decision(Enum):
    """Hook decision types."""
    ALLOW = "allow"
    DENY = "deny"              # Block entirely
    ASK = "ask"                # Require user confirmation


@dataclass
class Pattern:
    """A destructive operation pattern."""
    name: str
    severity: Severity
    category: str
    pattern: str               # Regex pattern
    description: str
    tool: str                  # Which tool this applies to: Bash, Write, Edit, *
    field: str                 # Which field to match: command, file_path, content


@dataclass
class Match:
    """Result of pattern matching."""
    pattern: Pattern
    matched_text: str
    context: str


# =============================================================================
# Default Patterns
# =============================================================================

DEFAULT_PATTERNS: List[Dict] = [
    # =========================================================================
    # CRITICAL - Block entirely (system destruction)
    # =========================================================================
    {
        "name": "rm_root",
        "severity": "critical",
        "category": "file_deletion",
        "pattern": r"rm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)*(/|/\*|/bin|/boot|/dev|/etc|/home|/lib|/lib64|/opt|/proc|/root|/sbin|/srv|/sys|/tmp|/usr|/var)(\s|$|/\*)",
        "description": "Recursive deletion of root or system directories",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "dd_device",
        "severity": "critical",
        "category": "disk_destruction",
        "pattern": r"dd\s+.*if=.*(of=/dev/(sd[a-z]|nvme|hd[a-z]|vd[a-z]|disk|rdisk))",
        "description": "Direct disk write with dd (can destroy partitions)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "mkfs_device",
        "severity": "critical",
        "category": "disk_destruction",
        "pattern": r"mkfs(\.[a-z0-9]+)?\s+.*(/dev/|LABEL=|UUID=)",
        "description": "Filesystem creation (destroys existing data)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "git_force_push_main",
        "severity": "critical",
        "category": "git_destructive",
        "pattern": r"git\s+push\s+.*(-f|--force|--force-with-lease).*\s+(origin\s+)?(main|master)(\s|$|:)",
        "description": "Force push to main/master branch",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "drop_database",
        "severity": "critical",
        "category": "database_destructive",
        "pattern": r"DROP\s+(DATABASE|SCHEMA)\s+",
        "description": "Database drop operation",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "truncate_table",
        "severity": "critical",
        "category": "database_destructive",
        "pattern": r"TRUNCATE\s+(TABLE\s+)?[a-zA-Z_]",
        "description": "Table truncation (deletes all data)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "chmod_777_recursive",
        "severity": "critical",
        "category": "security",
        "pattern": r"chmod\s+(-R\s+)?777\s+/",
        "description": "Setting world-writable permissions on system paths",
        "tool": "Bash",
        "field": "command"
    },

    # =========================================================================
    # HIGH - Require confirmation
    # =========================================================================
    {
        "name": "rm_recursive",
        "severity": "high",
        "category": "file_deletion",
        "pattern": r"rm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)+",
        "description": "Recursive file deletion",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "rm_force",
        "severity": "high",
        "category": "file_deletion",
        "pattern": r"rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)+",
        "description": "Forced file deletion (no confirmation)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "git_reset_hard",
        "severity": "high",
        "category": "git_destructive",
        "pattern": r"git\s+reset\s+--hard",
        "description": "Git hard reset (discards uncommitted changes)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "git_clean_force",
        "severity": "high",
        "category": "git_destructive",
        "pattern": r"git\s+clean\s+(-[a-zA-Z]*f[a-zA-Z]*)",
        "description": "Git clean with force (removes untracked files)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "git_force_push",
        "severity": "high",
        "category": "git_destructive",
        "pattern": r"git\s+push\s+.*(-f|--force|--force-with-lease)",
        "description": "Git force push (can overwrite remote history)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "git_rebase_remote",
        "severity": "high",
        "category": "git_destructive",
        "pattern": r"git\s+rebase\s+.*origin/",
        "description": "Git rebase on remote branch (rewrites history)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "aws_terminate",
        "severity": "high",
        "category": "cloud_destructive",
        "pattern": r"aws\s+(ec2\s+terminate-instances|rds\s+delete-db|s3\s+rb|ecs\s+delete-cluster|lambda\s+delete-function)",
        "description": "AWS resource termination/deletion",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "gcloud_delete",
        "severity": "high",
        "category": "cloud_destructive",
        "pattern": r"gcloud\s+.*(delete|destroy)\s+",
        "description": "GCP resource deletion",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "az_delete",
        "severity": "high",
        "category": "cloud_destructive",
        "pattern": r"az\s+.*(delete|destroy)\s+",
        "description": "Azure resource deletion",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "kubectl_delete_namespace",
        "severity": "high",
        "category": "cloud_destructive",
        "pattern": r"kubectl\s+delete\s+(namespace|ns)\s+",
        "description": "Kubernetes namespace deletion",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "kubectl_delete_all",
        "severity": "high",
        "category": "cloud_destructive",
        "pattern": r"kubectl\s+delete\s+.*--all(\s|$)",
        "description": "Kubernetes delete all resources",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "terraform_destroy",
        "severity": "high",
        "category": "cloud_destructive",
        "pattern": r"terraform\s+destroy",
        "description": "Terraform destroy (removes all managed resources)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "docker_system_prune_all",
        "severity": "high",
        "category": "container_destructive",
        "pattern": r"docker\s+system\s+prune\s+(-a|--all)",
        "description": "Docker system prune all (removes all unused data)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "docker_rm_force",
        "severity": "high",
        "category": "container_destructive",
        "pattern": r"docker\s+(rm|rmi)\s+.*(-f|--force)",
        "description": "Forced Docker container/image removal",
        "tool": "Bash",
        "field": "command"
    },

    # =========================================================================
    # MEDIUM - Require confirmation (less severe but still destructive)
    # =========================================================================
    {
        "name": "delete_sql",
        "severity": "medium",
        "category": "database_destructive",
        "pattern": r"DELETE\s+FROM\s+\w+",
        "description": "SQL DELETE statement",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "write_system_config",
        "severity": "medium",
        "category": "system_modification",
        "pattern": r"^(/etc/|/usr/local/etc/|/opt/homebrew/etc/)",
        "description": "Writing to system configuration directories",
        "tool": "Write",
        "field": "file_path"
    },
    {
        "name": "write_ssh_config",
        "severity": "medium",
        "category": "system_modification",
        "pattern": r"\.ssh/(config|authorized_keys|known_hosts)",
        "description": "Writing to SSH configuration files",
        "tool": "Write",
        "field": "file_path"
    },
    {
        "name": "kubectl_apply_force",
        "severity": "medium",
        "category": "cloud_destructive",
        "pattern": r"kubectl\s+apply\s+.*--force",
        "description": "Kubernetes force apply (may replace resources)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "helm_uninstall",
        "severity": "medium",
        "category": "cloud_destructive",
        "pattern": r"helm\s+(uninstall|delete)\s+",
        "description": "Helm release uninstall",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "docker_volume_rm",
        "severity": "medium",
        "category": "container_destructive",
        "pattern": r"docker\s+volume\s+rm",
        "description": "Docker volume removal (data loss)",
        "tool": "Bash",
        "field": "command"
    },
    {
        "name": "docker_image_prune",
        "severity": "medium",
        "category": "container_destructive",
        "pattern": r"docker\s+image\s+prune",
        "description": "Docker image pruning",
        "tool": "Bash",
        "field": "command"
    },
]


# =============================================================================
# Configuration Loading
# =============================================================================

def get_config_dir() -> Path:
    """Get the Claude config directory."""
    claude_dir = os.environ.get("CLAUDE_CONFIG_DIR", os.path.expanduser("~/.claude"))
    return Path(claude_dir) / "reflex"


def load_patterns() -> List[Pattern]:
    """Load patterns from default + user config."""
    patterns = []

    # Load default patterns
    for p in DEFAULT_PATTERNS:
        patterns.append(Pattern(
            name=p["name"],
            severity=Severity(p["severity"]),
            category=p["category"],
            pattern=p["pattern"],
            description=p["description"],
            tool=p["tool"],
            field=p["field"],
        ))

    # Load user customizations if present
    config_path = get_config_dir() / "guardrail-config.json"
    if config_path.exists():
        try:
            with open(config_path) as f:
                user_config = json.load(f)

            # Handle disabled patterns
            disabled = set(user_config.get("disabled_patterns", []))
            patterns = [p for p in patterns if p.name not in disabled]

            # Handle severity overrides
            overrides = user_config.get("severity_overrides", {})
            for p in patterns:
                if p.name in overrides:
                    p.severity = Severity(overrides[p.name])

            # Handle additional patterns
            for p in user_config.get("additional_patterns", []):
                patterns.append(Pattern(
                    name=p["name"],
                    severity=Severity(p["severity"]),
                    category=p["category"],
                    pattern=p["pattern"],
                    description=p["description"],
                    tool=p["tool"],
                    field=p["field"],
                ))
        except (json.JSONDecodeError, KeyError):
            # Invalid config - use defaults only
            pass

    return patterns


# =============================================================================
# Pattern Matching
# =============================================================================

def extract_field(tool_name: str, tool_input: Dict, field: str) -> Optional[str]:
    """Extract the field to match from tool input."""
    if field == "command" and tool_name == "Bash":
        return tool_input.get("command", "")
    elif field == "file_path":
        return tool_input.get("file_path", "")
    elif field == "content":
        return tool_input.get("content", "")
    return None


def match_patterns(
    tool_name: str,
    tool_input: Dict,
    patterns: List[Pattern]
) -> List[Match]:
    """Match tool input against patterns."""
    matches = []

    for pattern in patterns:
        # Check tool type matches
        if pattern.tool != "*" and pattern.tool != tool_name:
            continue

        # Extract field to match
        text = extract_field(tool_name, tool_input, pattern.field)
        if not text:
            continue

        # Try regex match (case insensitive for SQL)
        flags = re.IGNORECASE if pattern.category == "database_destructive" else 0
        if re.search(pattern.pattern, text, flags):
            # Extract context (up to 100 chars around match)
            match_obj = re.search(pattern.pattern, text, flags)
            if match_obj:
                start = max(0, match_obj.start() - 20)
                end = min(len(text), match_obj.end() + 20)
                context = text[start:end]
                if start > 0:
                    context = "..." + context
                if end < len(text):
                    context = context + "..."

                matches.append(Match(
                    pattern=pattern,
                    matched_text=match_obj.group(),
                    context=context,
                ))

    return matches


def determine_decision(matches: List[Match]) -> Tuple[Decision, Optional[Match]]:
    """Determine the overall decision based on matches."""
    if not matches:
        return Decision.ALLOW, None

    # Find highest severity match
    severity_order = [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]

    for severity in severity_order:
        for match in matches:
            if match.pattern.severity == severity:
                if severity == Severity.CRITICAL:
                    return Decision.DENY, match
                elif severity in (Severity.HIGH, Severity.MEDIUM):
                    return Decision.ASK, match

    return Decision.ALLOW, None


# =============================================================================
# Output Generation
# =============================================================================

def format_output(decision: Decision, match: Optional[Match]) -> str:
    """Format the hook output JSON."""
    if decision == Decision.ALLOW:
        return ""

    if match is None:
        return ""

    # Build human-readable message
    severity_emoji = {
        Severity.CRITICAL: "[BLOCKED]",
        Severity.HIGH: "[CONFIRM REQUIRED]",
        Severity.MEDIUM: "[CONFIRM REQUIRED]",
        Severity.LOW: "[WARNING]",
    }

    message_parts = [
        f"{severity_emoji[match.pattern.severity]} {match.pattern.description}",
        f"Pattern: {match.pattern.name} ({match.pattern.category})",
        f"Matched: {match.context}",
    ]

    if decision == Decision.DENY:
        message_parts.append("")
        message_parts.append("This operation is blocked by Reflex guardrails.")
        message_parts.append("Temporarily disable with: /reflex:guardrail off")
    else:
        message_parts.append("")
        message_parts.append("User confirmation required to proceed.")

    output = {
        "hookSpecificOutput": {
            "permissionDecision": decision.value,
        },
        "systemMessage": "\n".join(message_parts),
    }

    return json.dumps(output)


# =============================================================================
# Main
# =============================================================================

def main():
    """Main entry point."""
    try:
        # Read tool data from stdin
        raw_input = sys.stdin.read().strip()
        if not raw_input:
            sys.exit(0)  # Allow if no input

        tool_data = json.loads(raw_input)
        tool_name = tool_data.get("tool_name", "")
        tool_input = tool_data.get("tool_input", {})

        # Load patterns
        patterns = load_patterns()

        # Match patterns
        matches = match_patterns(tool_name, tool_input, patterns)

        # Determine decision
        decision, match = determine_decision(matches)

        # Output and exit
        if decision == Decision.ALLOW:
            sys.exit(0)
        else:
            output = format_output(decision, match)
            print(output, file=sys.stderr)
            sys.exit(2)

    except json.JSONDecodeError:
        # Invalid JSON - allow (fail open)
        sys.exit(0)
    except Exception:
        # Unexpected error - allow (fail open)
        sys.exit(0)


if __name__ == "__main__":
    main()
