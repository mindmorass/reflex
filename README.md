# Reflex

A Claude Code plugin providing opinionated sub-agents and skills for application development, infrastructure, and data engineering workflows.

## Installation

### From GitHub (recommended)

```
/plugin marketplace add mindmorass/reflex
/plugin install reflex
```

### Local Development

```bash
git clone https://github.com/mindmorass/reflex.git
claude --plugin-dir /path/to/reflex
```

## Features

### 9 Specialized Agents

| Agent | Purpose |
|-------|---------|
| `analyst` | Data analysis, pattern recognition, troubleshooting |
| `coder` | Code development, refactoring, implementation |
| `devops` | Infrastructure, CI/CD, deployments |
| `harvester` | Data collection from web, APIs, documents |
| `planner` | Task breakdown, project planning |
| `researcher` | Investigation, documentation review |
| `reviewer` | Code review, security review |
| `tester` | Test generation, coverage analysis |
| `writer` | Documentation, technical writing |

### 29 Skills

Skills provide reusable knowledge for agents. Run `/reflex:skills` to list all available skills.

Key skills include:
- `mermaid-diagrams` - Create diagrams for documentation
- `docker-patterns` - Container best practices
- `ci-cd-patterns` - Pipeline configurations
- `test-patterns` - Testing strategies
- `security-review` - Security analysis
- `microsoft-docs` - Microsoft documentation lookup

### Commands

| Command | Description |
|---------|-------------|
| `/reflex:agents` | List available agents |
| `/reflex:skills` | List available skills |
| `/reflex:task "<task>"` | Route task to appropriate agent |
| `/reflex:gitconfig` | Display git configuration |
| `/reflex:certcollect <url>` | Collect SSL certificates |
| `/reflex:audit <on\|off\|status>` | Control audit logging |
| `/reflex:mcp` | List MCP servers |

### MCP Servers

Pre-configured in `.mcp.json`:

| Server | Purpose |
|--------|---------|
| atlassian | Jira/Confluence |
| git | Local git operations |
| github | GitHub API |
| microsoft-docs | MS Learn documentation |
| azure | Azure resources |
| azure-devops | Azure DevOps |
| markitdown | Document conversion |
| sql-server | SQL queries |
| playwright | Browser testing |
| azure-ai-foundry | Azure AI |
| m365-agents | Microsoft 365 |

## Project Structure

```
reflex/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── agents/              # 9 sub-agent definitions
├── commands/            # Slash commands
├── skills/              # 29 skill definitions
├── .mcp.json            # MCP server configurations
└── docs/                # Additional documentation
```

## How It Works

Reflex agents are Claude Code sub-agents with bound skills and tool access. When you use `/reflex:task`, the task router analyzes your request and delegates to the most appropriate agent.

Each agent has:
- **Tools**: Specific Claude Code tools they can use (Read, Write, Bash, etc.)
- **Skills**: Knowledge domains they can reference
- **Handoff guidance**: Suggestions for which agent should handle the next step

## License

MIT
