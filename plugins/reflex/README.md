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

### 42 Skills

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
| `/reflex:mcp` | Manage MCP servers (list/install/uninstall/enable/disable/select) |
| `/reflex:gitconfig` | Display git configuration |
| `/reflex:certcollect <hostname>` | Collect SSL certificates |
| `/reflex:notify <on\|off\|status\|test>` | macOS popup notifications |
| `/reflex:speak <on\|off\|status\|test>` | Spoken notifications via `say` |
| `/reflex:qdrant <on\|off\|status>` | Control Qdrant MCP connection |
| `/reflex:langfuse <on\|off\|status>` | Enable/disable LangFuse tracing |
| `/reflex:guardrail <on\|off\|status>` | Control destructive operation guardrails |
| `/reflex:ingest <path>` | Ingest files into Qdrant |
| `/reflex:update-mcp <check\|apply>` | Check/apply MCP package updates |
| `/reflex:init <service\|workflow>` | Initialize MCP server credentials or project workflows |
| `/reflex:handoff [path]` | Generate handoff document for session continuation |
| `/reflex:statusline <on\|off\|status\|color>` | Configure the Reflex status line |
| `/reflex:summarize-transcript <source>` | Summarize meeting transcript to structured notes |
| `/reflex:azure-discover <resource-name>` | Trace Azure resource dependencies and topology |

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

Reflex includes a catalog of 15 MCP servers. Use `/reflex:mcp select` to choose which to install, or `/reflex:mcp install <name>` for individual servers.

| Server | Category | Purpose |
|--------|----------|---------|
| qdrant | data | Vector database storage |
| atlassian | collaboration | Jira/Confluence |
| git | development | Local git operations |
| github | development | GitHub API |
| microsoft-docs | docs | MS Learn documentation |
| azure | cloud | Azure resource management |
| azure-devops | cloud | Azure DevOps |
| markitdown | docs | Document conversion |
| sql-server | database | SQL Server queries |
| playwright | development | Browser automation |
| devbox | cloud | Microsoft Dev Box |
| azure-ai-foundry | cloud | Azure AI Foundry |
| kubernetes | cloud | Kubernetes cluster management |
| spacelift | cloud | Spacelift IaC management and deployment |
| google-workspace | collaboration | Gmail, Calendar, Drive, Docs |

Configure credentials with `/reflex:init <service>`. See `/reflex:mcp status` for current state.

## Project Structure

```
plugins/reflex/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── agents/              # 2 agents
├── commands/            # Slash commands
├── skills/              # 42 skill definitions
├── hooks/               # Session hooks
├── scripts/             # Helper scripts
├── mcp-catalog.json     # MCP server catalog (registry)
└── CLAUDE.md            # Claude Code instructions
```

## How It Works

Reflex provides skills (reusable knowledge patterns) and RAG integration via Qdrant.

- **Skills**: Invoke with the Skill tool for domain-specific guidance
- **RAG**: Use `/reflex:task --rag` to enrich tasks with stored knowledge
- **Agents**: Use official plugin agents (python-pro, security-auditor, etc.) for implementation

## License

MIT
