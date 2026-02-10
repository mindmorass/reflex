# Reflex - Claude Code Plugin

Reflex is a Claude Code plugin providing skills and RAG integration for application development, infrastructure, and data engineering workflows.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution
- Run independent subagents in parallel (multiple Task tool calls in one message)
- Use `model: "haiku"` for quick, straightforward subtasks to minimize cost/latency
- Use background subagents (`run_in_background: true`) for long-running tasks while continuing other work

### 3. Self-Improvement Loop
- After ANY correction from the user, update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff your behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Lateness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Respect CLAUDE_CONFIG_DIR**: NEVER hardcode `~/.claude` or `$HOME/.claude`. Always use `${CLAUDE_CONFIG_DIR:-$HOME/.claude}` to resolve the Claude config directory. This applies to all bash commands, scripts, and file path references. Users may have a custom config directory set and hardcoded paths will break their setup.

## Context Management

- **Monitor context usage**: When context feels heavy (~85% through a long session), proactively suggest `/reflex:handoff` to generate a continuation document
- **Handoff docs**: Use `/reflex:handoff` to create a structured summary for seamless session continuation
- **Periodic CLAUDE.md review**: At the start of complex tasks, re-read project CLAUDE.md to ensure alignment with project conventions
- **Offload to subagents**: Heavy exploration and research should happen in subagents to preserve main context for decision-making

## MCP Server Management

MCP servers are managed separately from the plugin. The plugin provides a **catalog** of available servers; users install and enable the ones they need.

- **Catalog**: `plugins/reflex/mcp-catalog.json` — registry of all available servers
- **User config**: `${CLAUDE_CONFIG_DIR}/reflex/mcp-config.json` — tracks installed/enabled state
- **Registration**: Servers are registered via `claude mcp add-json --scope user` (stored in `.claude.json`)
- **Tool names**: `mcp__<server>__<tool>` (e.g., `mcp__atlassian__jira_search`)

Key commands:
- `/reflex:mcp select` — interactive selection to install/uninstall servers
- `/reflex:mcp enable` — interactive selection to enable/disable installed servers
- `/reflex:mcp install <server>` / `uninstall` / `enable` / `disable` — non-interactive management
- `/reflex:mcp status` — show credential readiness per server

## Performance

- **Enable tool search**: For faster startup with many MCP servers, users should enable lazy tool loading:
  ```bash
  claude config set --global toolSearchEnabled true
  ```
  This loads tool definitions on demand instead of all at once, reducing startup time when Reflex's MCP servers are active.

## Project Structure

```
plugins/reflex/
├── .claude-plugin/plugin.json   # Plugin manifest
├── agents/                      # 2 agents
├── commands/                    # Slash commands
├── skills/                      # 42 skill definitions
├── hooks/                       # Session hooks
├── scripts/                     # Helper scripts (mcp-generate.sh)
├── mcp-catalog.json             # MCP server catalog (registry)
└── CLAUDE.md                    # These instructions
```

## Commands

| Command | Description |
|---------|-------------|
| `/reflex:agents` | List available agents |
| `/reflex:skills` | List available skills |
| `/reflex:mcp` | Manage MCP servers (list/install/uninstall/enable/disable/select) |
| `/reflex:gitconfig` | Display git configuration |
| `/reflex:certcollect` | Collect SSL certificates |
| `/reflex:notify` | macOS popup notifications (on/off/status/test) |
| `/reflex:speak` | Spoken notifications (on/off/status/test) |
| `/reflex:qdrant` | Control Qdrant MCP connection (on/off/status) |
| `/reflex:langfuse` | Control LangFuse observability (on/off/status) |
| `/reflex:guardrail` | Control destructive operation guardrails (on/off/status) |
| `/reflex:ingest` | Ingest files into Qdrant |
| `/reflex:update-mcp` | Check/apply MCP package updates |
| `/reflex:workflow` | Manage workflow templates (apply/list/create/sync/compose/status) |
| `/reflex:init` | Initialize MCP server credentials or project workflows |
| `/reflex:handoff` | Generate handoff document for session continuation |
| `/reflex:statusline` | Configure the Reflex status line (on/off/status/color) |
| `/reflex:summarize-transcript` | Summarize meeting transcript to structured notes |
| `/reflex:azure-discover` | Trace Azure resource dependencies and generate topology diagrams |

## Agents

| Agent | Purpose |
|-------|---------|
| rag-proxy | RAG wrapper for any agent, enriches with Qdrant context |
| workflow-orchestrator | Orchestrates multi-step workflows across specialized subagents |

Most agent functionality is provided by official plugins (testing-suite, security-pro, documentation-generator, developer-essentials) and Reflex skills.

## Web Search Storage

**IMPORTANT:** After every WebSearch, store valuable results in Qdrant with rich metadata:

```
Tool: qdrant-store
Information: "<synthesized summary with key findings>"
Metadata:
  # Required
  source: "web_search"
  content_type: "text"           # text, code, image, diagram
  harvested_at: "<ISO 8601>"

  # Search context
  query: "<original query>"
  urls: ["url1", "url2"]
  domain: "<primary domain>"

  # Classification (for filtering)
  category: "<technology|business|science|design|security|devops>"
  subcategory: "<databases|frontend|ml|networking|...>"
  type: "<documentation|tutorial|troubleshooting|reference|comparison>"

  # Technical (when applicable)
  language: "<python|typescript|rust|go|...>"
  framework: "<framework name>"

  # Quality
  confidence: "<high|medium|low>"
  freshness: "<current|recent|dated>"

  # Relationships
  related_topics: ["topic1", "topic2"]
  project: "<project name or null>"
```

**Images:** Store URL references only (no download). Use `content_type: "image"`, `image_url`, `image_type`

**Skip storing:** Trivial lookups, ephemeral info, duplicates

## Git Commits

When committing changes, use this format:

```
<summary line>

<optional body>
```

**No AI attribution.** Do NOT add Co-Authored-By lines, "Generated with" footers, or any other AI tool branding to commits.

**Before pushing**, always sync with the remote to avoid rejected pushes:

```bash
git pull --rebase
```

If the rebase has conflicts, stop and inform the user. Do NOT resolve conflicts automatically — let the user decide the strategy.

## LangFuse Observability

Reflex includes optional LangFuse integration for tracing tool calls and agent interactions.

**Enable/Disable:**
```bash
/reflex:langfuse on      # Enable tracing
/reflex:langfuse off     # Disable tracing (default)
/reflex:langfuse status  # Show current status
```

**Required environment variables:**
```bash
export LANGFUSE_BASE_URL="http://localhost:3000"  # Optional, defaults to localhost
export LANGFUSE_PUBLIC_KEY="pk-..."
export LANGFUSE_SECRET_KEY="sk-..."
```

When enabled, tool calls are automatically traced to LangFuse via the PostToolUse hook.

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
