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

### 10 Specialized Agents

| Agent | Purpose |
|-------|---------|
| `analyst` | Data analysis, pattern recognition, troubleshooting |
| `coder` | Code development, refactoring, implementation |
| `devops` | Infrastructure, CI/CD, deployments |
| `harvester` | Data collection from web, APIs, documents, ChromaDB storage |
| `planner` | Task breakdown, project planning |
| `rag-proxy` | RAG wrapper for any agent, enriches with ChromaDB context |
| `researcher` | Investigation, documentation review, ChromaDB queries |
| `reviewer` | Code review, security review |
| `tester` | Test generation, coverage analysis |
| `writer` | Documentation, technical writing |

### 26 Skills

Skills provide reusable knowledge for agents. Run `/reflex:skills` to list all available skills.

Key skills include:
- `chroma-patterns` - ChromaDB storage and retrieval
- `rag-wrapper` - Wrap any agent with RAG context
- `mermaid-diagrams` - Create diagrams for documentation
- `docker-patterns` - Container best practices
- `microsoft-docs` - Microsoft documentation lookup

> **Note:** Code review, testing, security, and CI/CD patterns are available via official Claude Code plugins (testing-suite, security-pro, developer-essentials).

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
| chroma | ChromaDB vector storage |

## Project Structure

```
reflex/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── agents/              # 10 sub-agent definitions
├── commands/            # Slash commands
├── skills/              # 26 skill definitions
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
