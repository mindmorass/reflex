# Reflex - Claude Code Plugin

Reflex is a comprehensive Claude Code plugin for orchestrating Application Development, Infrastructure as Code (IaC), and Data Engineering workflows.

## Project Structure

- `src/` - TypeScript source code
- `config/` - YAML configuration files (agents, skills, hooks, MCP servers)
- `dist/` - Compiled JavaScript output
- `.claude/commands/` - Slash commands for Claude Code

## Available Commands

Run these slash commands in Claude Code:

- `/reflex:gitconfig` - Display git configuration (use `-v` for verbose)
- `/reflex:certcollect <url>` - Collect SSL certificates from a website
- `/reflex:audit <on|off|status>` - Control session audit logging
- `/reflex:agents` - List available Reflex agents
- `/reflex:mcp` - List configured MCP servers

## Agents

Reflex provides 9 specialized agents:

| Agent | Purpose |
|-------|---------|
| analyst | Data analysis, pattern recognition, troubleshooting |
| coder | Code development, refactoring, implementation |
| devops | Infrastructure, CI/CD, deployments |
| harvester | Data collection from web, APIs, documents |
| planner | Task breakdown, project planning |
| researcher | Investigation, documentation review |
| reviewer | Code review, security review |
| tester | Test generation, coverage analysis |
| writer | Documentation, technical writing |

## Development

```bash
npm install      # Install dependencies
npm run build    # Compile TypeScript
npm run dev      # Watch mode
npm test         # Run tests
```

## CLI Usage

The plugin can also be used as a standalone CLI:

```bash
npm start -- gitconfig -v
npm start -- agents
npm start -- mcp
npm start -- task "your task here"
```

## Configuration

Copy `.env.example` to `.env` and configure:
- Atlassian credentials (for Jira/Confluence)
- GitHub token
- Azure credentials
- Azure DevOps PAT
