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

### Agents

| Agent | Purpose |
|-------|---------|
| `rag-proxy` | RAG wrapper for any agent, enriches with Qdrant context |
| `workflow-orchestrator` | Orchestrates multi-step workflows across specialized subagents |

Use `/reflex:task "your task" --rag` to enrich tasks with stored knowledge before delegating to official plugin agents.

### 40 Skills

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
| `/reflex:mcp` | List MCP servers |
| `/reflex:gitconfig` | Display git configuration |
| `/reflex:certcollect <hostname>` | Collect SSL certificates |
| `/reflex:notify <on\|off\|status\|test>` | macOS popup notifications |
| `/reflex:speak <on\|off\|status\|test>` | Spoken notifications via `say` |
| `/reflex:qdrant <on\|off\|status>` | Control Qdrant MCP connection |
| `/reflex:langfuse <on\|off\|status>` | Enable/disable LangFuse tracing |
| `/reflex:guardrail <on\|off\|status>` | Control destructive operation guardrails |
| `/reflex:ingest <path>` | Ingest files into Qdrant |
| `/reflex:update-mcp <check\|apply>` | Check/apply MCP package updates |
| `/reflex:init <service>` | Initialize MCP server credentials |

### Notifications

Reflex can notify you when agents complete tasks or input is required:

```bash
# Enable macOS popup notifications
/reflex:notify on

# Enable spoken notifications
/reflex:speak on

# Personalize speech with your name
export REFLEX_USER_NAME="YourName"
```

Notifications auto-trigger on:
- Agent/Task completion
- AskUserQuestion (input required)

### Docker Services

Docker compose files are stored at `~/.claude/docker/`:

```bash
# Start Qdrant vector database
/reflex:qdrant start

# Start LangFuse observability stack
/reflex:langfuse-docker start
```

### MCP Servers

Pre-configured in `.mcp.json`:

| Server | Package | Purpose |
|--------|---------|---------|
| qdrant | `mcp-server-qdrant` | Vector database storage |
| atlassian | `mcp-atlassian` | Jira/Confluence |
| git | `mcp-server-git` | Local git operations |
| github | `ghcr.io/github/github-mcp-server` | GitHub API |
| microsoft-docs | `mcp-remote` (MS Learn) | MS Learn documentation |
| azure | `@azure/mcp` | Azure resource management |
| azure-devops | `@azure-devops/mcp` | Azure DevOps |
| markitdown | `markitdown-mcp-npx` | Document conversion |
| sql-server | `mssql-mcp` | SQL Server queries |
| playwright | `@playwright/mcp` | Browser automation |
| devbox | `@microsoft/devbox-mcp` | Microsoft Dev Box |
| azure-ai-foundry | `mcp-remote` (Azure AI) | Azure AI Foundry |
| kubernetes | `kubernetes-mcp-server` | Kubernetes cluster management |
| google-workspace | `workspace-mcp` | Gmail, Calendar, Drive, Docs |

Configure credentials with `/reflex:init <service>`. See `/reflex:init status` for current state.

## Project Structure

```
plugins/reflex/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── agents/              # 2 agents
├── commands/            # Slash commands
├── skills/              # 40 skill definitions
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
