# Doc Sync Skill

> Keep documentation aligned with implementation through systematic drift detection and updates.

## Overview

Documentation drift is inevitable: code changes faster than docs update. This skill provides:
- Drift detection between code and docs
- Systematic update procedures
- Validation that docs match implementation

## Core Principle

From the project vision: *"Docs update as implementation diverges from spec."*

## Drift Detection Patterns

### Pattern 1: API Documentation Drift

**When to use**: REST APIs, function signatures, class interfaces

```python
#!/usr/bin/env python3
"""Detect drift between API implementation and documentation."""

import ast
import re
from pathlib import Path
from typing import Dict, List, Set

def extract_api_signatures(code_path: str) -> Dict[str, Dict]:
    """Extract function signatures from Python code."""
    with open(code_path) as f:
        tree = ast.parse(f.read())

    signatures = {}

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            # Skip private functions
            if node.name.startswith('_'):
                continue

            params = []
            for arg in node.args.args:
                param = {"name": arg.arg}
                if arg.annotation:
                    param["type"] = ast.unparse(arg.annotation)
                params.append(param)

            # Extract return type
            return_type = None
            if node.returns:
                return_type = ast.unparse(node.returns)

            signatures[node.name] = {
                "params": params,
                "return_type": return_type,
                "docstring": ast.get_docstring(node),
                "line": node.lineno
            }

    return signatures


def extract_documented_signatures(doc_path: str) -> Dict[str, Dict]:
    """Extract function signatures from markdown documentation."""
    with open(doc_path) as f:
        content = f.read()

    # Pattern: ### function_name or ## function_name
    # Followed by parameter table or description

    signatures = {}

    # Find function sections
    pattern = r'#{2,3}\s+`?(\w+)`?\s*\n([\s\S]*?)(?=\n#{2,3}|\Z)'

    for match in re.finditer(pattern, content):
        func_name = match.group(1)
        section = match.group(2)

        # Extract parameters from section
        params = []
        param_pattern = r'\|\s*`?(\w+)`?\s*\|\s*`?([^|]+)`?\s*\|'
        for param_match in re.finditer(param_pattern, section):
            params.append({
                "name": param_match.group(1),
                "type": param_match.group(2).strip()
            })

        signatures[func_name] = {
            "params": params,
            "section_content": section[:200]  # First 200 chars
        }

    return signatures


def detect_api_drift(code_path: str, doc_path: str) -> Dict:
    """Compare code signatures with documentation."""
    code_sigs = extract_api_signatures(code_path)
    doc_sigs = extract_documented_signatures(doc_path)

    drift = {
        "missing_in_docs": [],      # In code but not docs
        "missing_in_code": [],      # In docs but not code
        "param_mismatches": [],     # Different parameters
        "type_mismatches": []       # Different types
    }

    code_funcs = set(code_sigs.keys())
    doc_funcs = set(doc_sigs.keys())

    # Missing functions
    drift["missing_in_docs"] = list(code_funcs - doc_funcs)
    drift["missing_in_code"] = list(doc_funcs - code_funcs)

    # Check matching functions for param differences
    for func in code_funcs & doc_funcs:
        code_params = {p["name"] for p in code_sigs[func]["params"]}
        doc_params = {p["name"] for p in doc_sigs[func]["params"]}

        if code_params != doc_params:
            drift["param_mismatches"].append({
                "function": func,
                "code_params": list(code_params),
                "doc_params": list(doc_params)
            })

    return drift
```

### Pattern 2: Configuration Drift

**When to use**: Environment variables, config files, feature flags

```python
import os
import re
from pathlib import Path
from typing import Set, Dict

def extract_env_vars_from_code(code_dir: str) -> Set[str]:
    """Find all environment variables used in code."""
    env_vars = set()

    patterns = [
        r'os\.environ\.get\(["\'](\w+)["\']',
        r'os\.environ\[["\'](\w+)["\']\]',
        r'os\.getenv\(["\'](\w+)["\']',
        r'\$\{(\w+)\}',  # Shell-style
    ]

    for py_file in Path(code_dir).rglob("*.py"):
        with open(py_file) as f:
            content = f.read()

        for pattern in patterns:
            for match in re.finditer(pattern, content):
                env_vars.add(match.group(1))

    return env_vars


def extract_documented_env_vars(doc_path: str) -> Set[str]:
    """Extract environment variables documented in markdown."""
    with open(doc_path) as f:
        content = f.read()

    env_vars = set()

    # Look for | VAR_NAME | pattern (tables)
    table_pattern = r'\|\s*`?([A-Z][A-Z0-9_]+)`?\s*\|'
    for match in re.finditer(table_pattern, content):
        env_vars.add(match.group(1))

    # Look for VAR_NAME= pattern (code blocks)
    code_pattern = r'^([A-Z][A-Z0-9_]+)='
    for match in re.finditer(code_pattern, content, re.MULTILINE):
        env_vars.add(match.group(1))

    return env_vars


def detect_config_drift(code_dir: str, doc_path: str) -> Dict:
    """Detect configuration drift."""
    code_vars = extract_env_vars_from_code(code_dir)
    doc_vars = extract_documented_env_vars(doc_path)

    return {
        "undocumented": list(code_vars - doc_vars),
        "obsolete_docs": list(doc_vars - code_vars)
    }
```

### Pattern 3: Feature Drift

**When to use**: Feature lists, capability documentation, CLI help

```python
from typing import Dict, List
import subprocess
import re

def extract_cli_commands(entry_point: str) -> Dict[str, str]:
    """Extract CLI commands from help output."""
    result = subprocess.run(
        [entry_point, "--help"],
        capture_output=True,
        text=True
    )

    commands = {}

    # Parse help output for commands
    # Pattern depends on CLI framework (click, argparse, etc.)
    pattern = r'^\s+(\w+)\s+(.+)$'

    for line in result.stdout.split('\n'):
        match = re.match(pattern, line)
        if match:
            commands[match.group(1)] = match.group(2).strip()

    return commands


def extract_documented_commands(doc_path: str) -> Dict[str, str]:
    """Extract commands from documentation."""
    with open(doc_path) as f:
        content = f.read()

    commands = {}

    # Look for command sections: ### command-name or `command-name`
    pattern = r'#{2,3}\s+`?(\w+)`?\s*\n([^\n#]+)'

    for match in re.finditer(pattern, content):
        commands[match.group(1)] = match.group(2).strip()

    return commands
```

## Update Procedures

### Procedure 1: Generate Documentation Update

```python
def generate_doc_update(drift: Dict, doc_path: str) -> str:
    """Generate markdown additions for missing documentation."""
    updates = []

    if drift.get("missing_in_docs"):
        updates.append("## New Functions to Document\n")
        for func in drift["missing_in_docs"]:
            updates.append(f"""
### `{func}`

**Description**: TODO

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| TODO | TODO | TODO |

**Returns**: TODO

**Example**:
```python
# TODO: Add example
```
""")

    if drift.get("undocumented"):
        updates.append("\n## Environment Variables to Document\n")
        updates.append("| Variable | Required | Default | Description |")
        updates.append("|----------|----------|---------|-------------|")
        for var in drift["undocumented"]:
            updates.append(f"| `{var}` | TODO | TODO | TODO |")

    return "\n".join(updates)
```

### Procedure 2: Automated Doc Sync Script

```bash
#!/bin/bash
# scripts/sync-docs.sh

set -e

echo "🔍 Checking for documentation drift..."

# Run drift detection
python scripts/detect_drift.py > /tmp/drift_report.json

# Check if there's drift
if jq -e '.missing_in_docs | length > 0' /tmp/drift_report.json > /dev/null; then
    echo "⚠️  Found undocumented code:"
    jq -r '.missing_in_docs[]' /tmp/drift_report.json

    # Generate update template
    python scripts/generate_doc_update.py /tmp/drift_report.json >> docs/API.md
    echo "📝 Added documentation stubs to docs/API.md"
fi

if jq -e '.missing_in_code | length > 0' /tmp/drift_report.json > /dev/null; then
    echo "⚠️  Found obsolete documentation:"
    jq -r '.missing_in_code[]' /tmp/drift_report.json
    echo "Please review and remove if no longer needed"
fi

if jq -e '.undocumented | length > 0' /tmp/drift_report.json > /dev/null; then
    echo "⚠️  Found undocumented config:"
    jq -r '.undocumented[]' /tmp/drift_report.json
fi

echo "✅ Drift check complete"
```

### Procedure 3: Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit (or via pre-commit framework)

# Only run on docs or source changes
if git diff --cached --name-only | grep -qE '\.(py|md)$'; then
    echo "Checking documentation sync..."

    python scripts/detect_drift.py --quick

    if [ $? -ne 0 ]; then
        echo "❌ Documentation drift detected"
        echo "Run: ./scripts/sync-docs.sh"
        exit 1
    fi
fi
```

## Validation

### Validate Documentation Accuracy

```python
def validate_code_examples(doc_path: str) -> List[Dict]:
    """Extract and test code examples from documentation."""
    import doctest

    with open(doc_path) as f:
        content = f.read()

    errors = []

    # Find Python code blocks
    pattern = r'```python\n([\s\S]*?)```'

    for i, match in enumerate(re.finditer(pattern, content)):
        code = match.group(1)

        try:
            # Compile to check syntax
            compile(code, f"<doc-example-{i}>", "exec")
        except SyntaxError as e:
            errors.append({
                "example": i,
                "error": str(e),
                "code": code[:100]
            })

    return errors


def validate_links(doc_path: str) -> List[str]:
    """Check for broken internal links."""
    with open(doc_path) as f:
        content = f.read()

    broken = []
    doc_dir = Path(doc_path).parent

    # Find markdown links
    pattern = r'\[([^\]]+)\]\(([^)]+)\)'

    for match in re.finditer(pattern, content):
        link_text, link_url = match.groups()

        # Skip external links
        if link_url.startswith(('http://', 'https://', '#')):
            continue

        # Check if file exists
        target = doc_dir / link_url
        if not target.exists():
            broken.append(f"{link_text} -> {link_url}")

    return broken
```

## Integration with Workflow

### Daily Doc Sync Check

```yaml
# workflows/definitions/doc-sync-check.yaml
name: doc-sync-check
description: Daily documentation drift detection

triggers:
  - schedule: "0 9 * * *"  # 9am daily

steps:
  - name: detect_drift
    agent: analyst
    action: |
      Run documentation drift detection across all projects.
      Generate report of any misalignment.

  - name: create_issues
    agent: writer
    condition: "drift_found"
    action: |
      For each significant drift, create a GitHub issue
      with specific remediation steps.

  - name: notify
    action: notify
    params:
      channel: "#docs"
      template: "doc_drift_report"
```

### On-Demand Sync

```bash
# Slash command: /sync-docs
# Check and fix documentation drift for current project

PROJECT=$(basename $(pwd))

echo "Syncing docs for $PROJECT..."

# Detect drift
python scripts/detect_drift.py \
    --code "code/$PROJECT" \
    --docs "docs/$PROJECT" \
    --output /tmp/drift.json

# Display findings
if [ -s /tmp/drift.json ]; then
    echo "Found drift:"
    cat /tmp/drift.json | jq .

    read -p "Generate update stubs? (y/n) " -n 1 -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python scripts/generate_doc_update.py /tmp/drift.json
    fi
else
    echo "✅ Documentation is in sync!"
fi
```

## Metrics

Track doc health over time:

```python
def compute_doc_health(code_dir: str, doc_dir: str) -> Dict:
    """Compute documentation health score."""
    drift = detect_all_drift(code_dir, doc_dir)

    total_items = (
        len(drift["documented"]) +
        len(drift["missing_in_docs"])
    )

    if total_items == 0:
        coverage = 1.0
    else:
        coverage = len(drift["documented"]) / total_items

    return {
        "coverage": round(coverage * 100, 1),
        "documented": len(drift["documented"]),
        "undocumented": len(drift["missing_in_docs"]),
        "obsolete": len(drift["missing_in_code"]),
        "health_score": "good" if coverage > 0.9 else "fair" if coverage > 0.7 else "poor"
    }
```

## Refinement Notes

> Track improvements as you use this skill.

- [ ] Drift detection validated
- [ ] Update generation working
- [ ] Pre-commit hook tested
- [ ] Metrics tracking useful
- [ ] Integrated with CI/CD
