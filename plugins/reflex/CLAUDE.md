# Reflex - Claude Code Plugin

Reflex is a Claude Code plugin providing opinionated sub-agents and skills for application development, infrastructure, and data engineering workflows.

## Project Structure

```
plugins/reflex/
├── .claude-plugin/plugin.json   # Plugin manifest
├── agents/                      # 13 sub-agent definitions
├── commands/                    # Slash commands
├── skills/                      # 39 skill definitions
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
| content-publisher | Video uploads to YouTube/TikTok/Vimeo, metadata, scheduling |
| devops | Infrastructure, CI/CD, deployments |
| harvester | Data collection from web, APIs, documents, ChromaDB storage |
| planner | Task breakdown, project planning |
| rag-proxy | RAG wrapper for any agent, enriches with ChromaDB context |
| researcher | Investigation, documentation review, ChromaDB queries |
| reviewer | Code review, security review |
| streamer | Live streaming setup, RTMP, OBS automation, multi-platform |
| tester | Test generation, coverage analysis |
| video-editor | Video/audio editing, transcoding, FFmpeg operations |
| writer | Documentation, technical writing |

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
