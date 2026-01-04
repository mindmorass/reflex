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

### Recommended Companion Plugins

Reflex works best with these plugins (checked on session start):

```bash
# Official Claude Code plugins
/install-plugin claude-code-templates   # testing-suite, security-pro, documentation-generator
/install-plugin claude-code-workflows   # developer-essentials, python-development, javascript-typescript

# Superpowers - TDD & systematic development workflows
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

## Features

### 10 Specialized Agents

| Agent | Purpose |
|-------|---------|
| `analyst` | Data analysis, pattern recognition, troubleshooting |
| `coder` | Code development, refactoring, implementation |
| `devops` | Infrastructure, CI/CD, deployments |
| `harvester` | Data collection from web, APIs, documents, Qdrant storage |
| `planner` | Task breakdown, project planning |
| `rag-proxy` | RAG wrapper for any agent, enriches with Qdrant context |
| `researcher` | Investigation, documentation review, Qdrant queries |
| `reviewer` | Code review, security review |
| `tester` | Test generation, coverage analysis |
| `writer` | Documentation, technical writing |

### 26 Skills

Skills provide reusable knowledge for agents. Run `/reflex:skills` to list all available skills.

Key skills include:
- `qdrant-patterns` - Qdrant vector storage and retrieval
- `rag-wrapper` - Wrap any agent with RAG context
- `mermaid-diagrams` - Create diagrams for documentation
- `docker-patterns` - Container best practices
- `microsoft-docs` - Microsoft documentation lookup

> **Note:** Code review, testing, security, and CI/CD patterns are provided by companion plugins. See [Recommended Companion Plugins](#recommended-companion-plugins).

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
| qdrant | Qdrant vector storage |

## Project Structure

```
plugins/reflex/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── agents/              # 10 sub-agent definitions
├── commands/            # Slash commands
├── skills/              # 26 skill definitions
├── hooks/               # Session hooks
├── scripts/             # Helper scripts
├── .mcp.json            # MCP server configurations
└── CLAUDE.md            # Claude Code instructions
```

## How It Works

Reflex agents are Claude Code sub-agents with bound skills and tool access. When you use `/reflex:task`, the task router analyzes your request and delegates to the most appropriate agent.

Each agent has:
- **Tools**: Specific Claude Code tools they can use (Read, Write, Bash, etc.)
- **Skills**: Knowledge domains they can reference
- **Handoff guidance**: Suggestions for which agent should handle the next step

## License

MIT
