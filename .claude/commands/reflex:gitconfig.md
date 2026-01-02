---
description: Display git configuration information
allowed-tools: Bash(npm start -- gitconfig:*)
argument-hint: [-v|--verbose]
---

# Git Configuration

Run the Reflex gitconfig command to display git configuration.

## Command

```bash
!npm start -- gitconfig $ARGUMENTS 2>&1 | grep -v "DEP0040\|punycode\|node --trace"
```

## Output

The command above shows your git configuration including:
- User name and email
- Core editor and default branch
- Credential helper
- With `-v`: aliases and all settings with sources
