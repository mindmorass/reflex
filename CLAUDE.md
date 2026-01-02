# Reflex - Claude Code Plugin

Reflex is a Claude Code plugin providing opinionated sub-agents and skills for application development, infrastructure, and data engineering workflows.

## Project Structure

```
reflex/
├── .claude-plugin/plugin.json   # Plugin manifest
├── agents/                      # 9 sub-agent definitions
├── commands/                    # Slash commands
├── skills/                      # 29 skill definitions
├── .mcp.json                    # MCP server configurations
└── docs/                        # Additional documentation
```

## Commands

| Command | Description |
|---------|-------------|
| `/reflex:agents` | List available agents |
| `/reflex:skills` | List available skills |
| `/reflex:task` | Route task to appropriate agent |
| `/reflex:gitconfig` | Display git configuration |
| `/reflex:certcollect` | Collect SSL certificates |
| `/reflex:audit` | Control audit logging |
| `/reflex:mcp` | List MCP servers |

## Agents

| Agent | Purpose |
|-------|---------|
| analyst | Data analysis, pattern recognition, troubleshooting |
| coder | Code development, refactoring, implementation |
| devops | Infrastructure, CI/CD, deployments |
| harvester | Data collection from web, APIs, documents |
| planner | Task breakdown, project planning |
| researcher | Investigation, documentation review |
| reviewer | Code review, security review |
| tester | Test generation, coverage analysis |
| writer | Documentation, technical writing |

## Installation

**From marketplace:**
```
/plugin marketplace add mindmorass/reflex
/plugin install reflex
```

**Local development:**
```bash
claude --plugin-dir /path/to/reflex
```
