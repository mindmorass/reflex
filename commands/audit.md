---
description: Control session audit logging
allowed-tools: Bash(npm start -- audit:*)
argument-hint: <on|off|status|export> [-v] [-o path] [-f json|markdown|text]
---

# Audit Logging

Enable, disable, or check status of session audit logging.

## Command

```bash
!npm start -- audit $ARGUMENTS 2>&1 | grep -v "DEP0040\|punycode\|node --trace"
```

## Subcommands

- `on` - Start audit logging (creates timestamped log file)
- `off` - Stop audit logging (finalizes log with summary)
- `status` - Show current audit state
- `export` - Export current session log to different format

## Options

- `-v, --verbose` - Log all details including tool inputs/outputs
- `-o, --output <path>` - Custom log directory
- `-f, --format <format>` - Log format: json, markdown, or text

## Examples

- `/reflex:audit on` - Start logging
- `/reflex:audit status` - Check if logging is active
- `/reflex:audit off` - Stop and finalize log
