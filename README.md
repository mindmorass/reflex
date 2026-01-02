# Reflex

A comprehensive Claude Code plugin for orchestrating Application Development, Infrastructure as Code (IaC), and Data Engineering workflows.

## Features

- **9 Specialized Agents** - Analyst, Coder, DevOps, Harvester, Planner, Researcher, Reviewer, Tester, Writer
- **12 MCP Servers** - Pre-configured integrations for GitHub, Azure, Atlassian, and more
- **Intelligent Routing** - Automatic task routing to the appropriate agent
- **Vector Storage** - ChromaDB-based caching and context management
- **Audit Logging** - Session-level audit trails in JSON, Markdown, or text

## Installation

### Quick Install (recommended)

Install globally with a single command:

```bash
# Option 1: Using curl
curl -fsSL https://raw.githubusercontent.com/yourname/reflex/main/install.sh | bash

# Option 2: Using npx (from GitHub)
npx github:yourname/reflex

# Option 3: Using npm (when published)
npm install -g reflex-claude-plugin
```

This installs:
- Slash commands to `~/.claude/commands/`
- MCP servers to `~/.claude.json`
- Creates `~/.reflex/` for logs and skills

### Manual Install (for development)

```bash
# Clone the repository
git clone https://github.com/yourname/reflex.git
cd reflex

# Install dependencies and build
npm install
npm run build

# Start Claude Code in this directory - commands are auto-discovered
claude
```

### Uninstall

```bash
# Using curl
curl -fsSL https://raw.githubusercontent.com/yourname/reflex/main/uninstall.sh | bash

# Or using npx
npx github:yourname/reflex --uninstall
```

### Environment Setup

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

Required for full functionality:
- `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` - Jira/Confluence
- `GITHUB_TOKEN` - GitHub API access
- `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID` - Azure resources
- `AZURE_DEVOPS_ORG`, `AZURE_DEVOPS_PAT` - Azure DevOps

## Slash Commands

| Command | Description |
|---------|-------------|
| `/reflex:gitconfig [-v]` | Display git configuration |
| `/reflex:certcollect <url> [-v] [-c]` | Collect SSL certificates |
| `/reflex:audit <on\|off\|status>` | Control audit logging |
| `/reflex:agents` | List available agents |
| `/reflex:mcp` | List MCP servers |
| `/reflex:task "<task>" [-a agent]` | Route task to agent |

## Agents

| Agent | Purpose | MCP Servers |
|-------|---------|-------------|
| **analyst** | Data analysis, troubleshooting | - |
| **coder** | Code development, refactoring | github, git |
| **devops** | Infrastructure, CI/CD | azure, azure-devops, github |
| **harvester** | Data collection | markitdown |
| **planner** | Task breakdown, planning | atlassian, azure-devops |
| **researcher** | Investigation, docs review | microsoft-docs |
| **reviewer** | Code/security review | github |
| **tester** | Test generation, QA | playwright |
| **writer** | Documentation | - |

## MCP Servers

Pre-configured in `.mcp.json`:

| Server | Type | Purpose |
|--------|------|---------|
| atlassian | stdio | Jira/Confluence |
| git | stdio | Local git |
| github | http | GitHub API |
| microsoft-docs | http | MS Learn docs |
| azure | stdio | Azure resources |
| azure-devops | stdio | Azure DevOps |
| markitdown | stdio | Document conversion |
| sql-server | stdio | SQL queries |
| playwright | stdio | Browser testing |
| devbox | stdio | Dev environments |
| azure-ai-foundry | stdio | Azure AI |
| m365-agents | stdio | Microsoft 365 |

## CLI Usage

Can also be used as a standalone CLI:

```bash
# Display git config
npm start -- gitconfig -v

# List agents
npm start -- agents

# List MCP servers
npm start -- mcp

# Route a task
npm start -- task "implement user authentication"

# Collect certificates
npm start -- certcollect github.com -v -c

# Audit control
npm start -- audit on
npm start -- audit status
npm start -- audit off
```

## Project Structure

```
reflex/
├── .claude/
│   ├── commands/           # Slash command definitions
│   └── settings.json       # Hooks configuration
├── .mcp.json               # MCP server configurations
├── CLAUDE.md               # Project memory for Claude
├── config/
│   ├── agents.yaml         # Agent definitions
│   ├── skills.yaml         # Skill mappings
│   ├── hooks.yaml          # Hook handlers
│   └── mcp-servers.yaml    # MCP server configs
├── src/
│   ├── agents/             # 9 agent implementations
│   ├── commands/           # CLI commands
│   ├── hooks/              # Hook handlers
│   ├── mcp/                # MCP server manager
│   ├── skills/             # Skill registry & loader
│   ├── storage/            # ChromaDB integration
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilities
│   ├── orchestrator.ts     # Central orchestration
│   └── index.ts            # Entry point
└── dist/                   # Compiled output
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Slash     │  │    MCP      │  │       Hooks         │  │
│  │  Commands   │  │  Servers    │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Agent Router                      │    │
│  │  analyst│coder│devops│harvester│planner│researcher  │    │
│  │         reviewer│tester│writer                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌────────────┐  ┌────────┴────────┐  ┌─────────────────┐   │
│  │   Skills   │  │   Hook Manager  │  │    ChromaDB     │   │
│  │  Registry  │  │                 │  │  Vector Store   │   │
│  └────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT
