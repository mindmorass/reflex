# Reflex Commands

This document describes the slash commands available in Reflex and their usage.

## Overview

Reflex provides several slash commands for interacting with the plugin within Claude Code. Commands are prefixed with `reflex:`.

## Command Reference

### `/reflex:gitconfig`

Display git configuration information.

**Syntax:**
```
/reflex:gitconfig [-v|--verbose]
```

**Options:**
- `-v, --verbose` - Show all configuration entries with sources

**Output:**
- User name and email
- Default editor
- Default branch
- Credential helper
- Include files and conditions
- (Verbose) All aliases
- (Verbose) All config entries with file sources

**Examples:**
```
/reflex:gitconfig
/reflex:gitconfig -v
```

**CLI Usage:**
```bash
npm start -- gitconfig
npm start -- gitconfig -v
```

---

### `/reflex:certcollect`

Collect SSL/TLS certificates from a website.

**Syntax:**
```
/reflex:certcollect <url> [-v|--verbose] [-c|--chain] [-o|--output <dir>] [-f|--format <fmt>]
```

**Arguments:**
- `url` - Website URL or hostname to collect certificates from

**Options:**
- `-v, --verbose` - Show detailed certificate information
- `-c, --chain` - Collect full certificate chain (intermediates)
- `-o, --output <dir>` - Output directory (default: ~/Desktop)
- `-f, --format <fmt>` - Output format: `pem`, `der`, or `both` (default: pem)

**Output:**
- Certificate subject and issuer
- Validity dates (verbose)
- SHA1 fingerprint (verbose)
- Subject Alternative Names (verbose)
- Saved certificate files

**Examples:**
```
/reflex:certcollect github.com
/reflex:certcollect https://example.com -v -c
/reflex:certcollect api.example.com -o ~/certs -f both
```

**CLI Usage:**
```bash
npm start -- certcollect github.com
npm start -- certcollect example.com -v -c
npm start -- certcollect api.example.com -o ~/certs -f both
```

---

### `/reflex:audit`

Control session audit logging.

**Syntax:**
```
/reflex:audit <command> [-o|--output <dir>] [-f|--format <fmt>]
```

**Commands:**
- `on` - Start audit logging
- `off` - Stop audit logging
- `status` - Show current audit status
- `export` - Export audit log to different format

**Options:**
- `-o, --output <dir>` - Log output directory
- `-f, --format <fmt>` - Log format: `json`, `markdown`, or `text` (default: json)

**Audit Log Contents:**
- Timestamp
- Action type
- Agent name (if applicable)
- Skill name (if applicable)
- Tool name (if applicable)
- Duration
- Success/failure status
- Error details (if applicable)

**Examples:**
```
/reflex:audit on
/reflex:audit status
/reflex:audit off
/reflex:audit on -f markdown -o ~/logs
/reflex:audit export -f text
```

**CLI Usage:**
```bash
npm start -- audit on
npm start -- audit status
npm start -- audit off
npm start -- audit on -f markdown -o ~/logs
```

---

### `/reflex:agents`

List available Reflex agents.

**Syntax:**
```
/reflex:agents
```

**Output:**
- Agent name
- Description
- Assigned skills
- Required MCP servers

**Example:**
```
/reflex:agents
```

**CLI Usage:**
```bash
npm start -- agents
```

---

### `/reflex:mcp`

List configured MCP servers.

**Syntax:**
```
/reflex:mcp
```

**Output:**
- Server name
- Server type (stdio/http)
- Command/URL
- Environment variables (masked)
- Associated agents

**Example:**
```
/reflex:mcp
```

**CLI Usage:**
```bash
npm start -- mcp
```

---

### `/reflex:task`

Route a task to the appropriate agent.

**Syntax:**
```
/reflex:task "<task description>" [-a|--agent <name>]
```

**Arguments:**
- `task` - Description of the task to perform

**Options:**
- `-a, --agent <name>` - Specify agent directly (skip auto-routing)

**Auto-Routing:**
The orchestrator analyzes the task and routes to the best agent:
- Code/implement → `coder`
- Review/audit → `reviewer`
- Test/coverage → `tester`
- Deploy/infrastructure → `devops`
- Analyze/debug → `analyst`
- Document/readme → `writer`
- Plan/sprint → `planner`
- Research/find → `researcher`
- Collect/scrape → `harvester`

**Examples:**
```
/reflex:task "Implement user authentication"
/reflex:task "Review the pull request" -a reviewer
/reflex:task "Deploy to staging environment"
/reflex:task "Write API documentation" -a writer
```

**CLI Usage:**
```bash
npm start -- task "Implement user authentication"
npm start -- task "Review PR" -a reviewer
```

## Command Files

Commands are defined in `.claude/commands/`:

```
.claude/commands/
├── reflex:gitconfig.md
├── reflex:certcollect.md
├── reflex:audit.md
├── reflex:agents.md
├── reflex:mcp.md
└── reflex:task.md
```

Each command file contains:
1. Description and usage
2. Argument definitions
3. Implementation instructions for Claude

## Creating Custom Commands

1. Create command file in `.claude/commands/`:

```markdown
# /reflex:mycommand

Description of what the command does.

## Usage

/reflex:mycommand <required-arg> [-o|--option <value>]

## Arguments

- `required-arg` - Description of argument

## Options

- `-o, --option` - Description of option

## Implementation

When this command is invoked:
1. Step 1
2. Step 2
3. Display results
```

2. Commands are auto-discovered by Claude Code when starting in the project directory

## Error Handling

All commands handle errors gracefully:

```
/reflex:certcollect nonexistent.invalid
```

Output:
```
Certificate Collection Results
==============================

Host: nonexistent.invalid:443
Certificates found: 0

Error: Failed to connect to nonexistent.invalid:443
```

## Environment Configuration

Some commands use environment variables:

| Variable | Command | Description |
|----------|---------|-------------|
| `REFLEX_LOG_PATH` | audit | Default audit log directory |
| `REFLEX_AUDIT_FORMAT` | audit | Default audit format |

Configure in `.env`:
```bash
# Paths default to $CLAUDE_CONFIG_DIR/reflex/* (or ~/.claude/reflex/*)
# REFLEX_LOG_PATH=~/.claude/reflex/logs
REFLEX_AUDIT_FORMAT=json
```
