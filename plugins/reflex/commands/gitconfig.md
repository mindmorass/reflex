---
description: Display git configuration information
allowed-tools: Bash(git config:*)
argument-hint: [-v|--verbose]
---

# Git Configuration

Display git configuration for the current environment.

## Instructions

Run git config commands to show configuration:

```bash
echo "## Git User"
echo "- **Name**: $(git config user.name)"
echo "- **Email**: $(git config user.email)"
echo ""
echo "## Core Settings"
echo "- **Default branch**: $(git config init.defaultBranch || echo 'not set')"
echo "- **Editor**: $(git config core.editor || echo 'not set')"
```

If the user passes `-v` or `--verbose`, also show:
- All aliases: `git config --get-regexp alias`
- Credential helper: `git config credential.helper`
- Remote URLs: `git remote -v`
