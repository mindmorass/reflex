# Reflex - Claude Code Plugin

Reflex is a Claude Code plugin providing skills and RAG integration for application development, infrastructure, and data engineering workflows.

## Project Structure

```
plugins/reflex/
├── .claude-plugin/plugin.json   # Plugin manifest
├── agents/                      # 1 agent (rag-proxy)
├── commands/                    # Slash commands
├── skills/                      # 36 skill definitions
├── hooks/                       # Session hooks
├── scripts/                     # Helper scripts
├── .mcp.json                    # MCP server configurations
└── CLAUDE.md                    # These instructions
```

## Commands

| Command | Description |
|---------|-------------|
| `/reflex:agents` | List available agents |
| `/reflex:skills` | List available skills |
| `/reflex:mcp` | List MCP servers |
| `/reflex:gitconfig` | Display git configuration |
| `/reflex:certcollect` | Collect SSL certificates |

## Agents

| Agent | Purpose |
|-------|---------|
| rag-proxy | RAG wrapper for any agent, enriches with Qdrant context |

Most agent functionality is provided by official plugins (testing-suite, security-pro, documentation-generator, developer-essentials) and Reflex skills.

## Git Commits

When committing changes, use this format (no Co-Authored-By):

```
<summary line>

<optional body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

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

## Recommended Plugins

Reflex works best with these companion plugins. On session start, missing plugins will be detected and installation instructions provided.

### Official Claude Code Plugins

```bash
/install-plugin claude-code-templates   # testing-suite, security-pro, documentation-generator
/install-plugin claude-code-workflows   # developer-essentials, python-development, javascript-typescript
```

### Superpowers (TDD & Systematic Development)

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Provides: test-driven-development, systematic-debugging, brainstorming, subagent-driven-development, verification-before-completion, using-git-worktrees
