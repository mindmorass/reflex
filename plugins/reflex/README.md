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

### RAG Integration

| Agent | Purpose |
|-------|---------|
| `rag-proxy` | RAG wrapper for any agent, enriches with Qdrant context |

Use `/reflex:task "your task" --rag` to enrich tasks with stored knowledge before delegating to official plugin agents.

### 36 Skills

Skills provide reusable knowledge patterns. Run `/reflex:skills` to list all.

Key skills include:
- `qdrant-patterns` - Vector storage and retrieval
- `analysis-patterns` - Data analysis and troubleshooting
- `research-patterns` - Knowledge retrieval workflows
- `task-decomposition` - Breaking down complex tasks
- `docker-patterns` - Container best practices
- `ffmpeg-patterns` - Video/audio processing
- `streaming-patterns` - Live streaming setup

> **Note:** Code review, testing, security, and CI/CD are provided by companion plugins. See [Recommended Companion Plugins](#recommended-companion-plugins).

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
├── agents/              # 1 agent (rag-proxy)
├── commands/            # Slash commands
├── skills/              # 36 skill definitions
├── hooks/               # Session hooks
├── scripts/             # Helper scripts
├── .mcp.json            # MCP server configurations
└── CLAUDE.md            # Claude Code instructions
```

## How It Works

Reflex provides skills (reusable knowledge patterns) and RAG integration via Qdrant.

- **Skills**: Invoke with the Skill tool for domain-specific guidance
- **RAG**: Use `/reflex:task --rag` to enrich tasks with stored knowledge
- **Agents**: Use official plugin agents (python-pro, security-auditor, etc.) for implementation

## License

MIT
