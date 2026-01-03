---
description: Route a task to the appropriate Reflex agent
allowed-tools: Bash(npm start -- task:*)
argument-hint: "<task description>" [-a agent] [-r] [-p project]
---

# Route Task to Agent

Route a task to the appropriate Reflex agent for execution.

## Command

```bash
!npm start -- task "$ARGUMENTS" 2>&1 | grep -v "DEP0040\|punycode\|node --trace"
```

## Options

- `-a, --agent <name>` - Specify preferred agent (analyst, coder, devops, harvester, planner, researcher, reviewer, tester, writer)
- `-r, --rag` - Enable RAG wrapping: query ChromaDB for context before routing
- `-p, --project <name>` - Project name for RAG collection prefix (default: "reflex")

## RAG Wrapping

When `--rag` is enabled:
1. Routes through `rag-proxy` agent first
2. Queries ChromaDB for relevant stored knowledge
3. Enriches the task with retrieved context
4. Delegates to the target agent with full context

This allows any agent (including imported/external ones) to benefit from stored knowledge without needing RAG-aware descriptions.

### RAG Example

```
/reflex:task "implement OAuth login" -a coder -r -p myapp
```

This will:
1. Query `myapp-research-*`, `myapp-docs-*`, `myapp-code-*` collections
2. Find relevant OAuth documentation and code patterns
3. Enrich the task with this context
4. Delegate to coder with full background

## Routing Logic

Without `-a`, the orchestrator automatically routes based on keywords:
- "analyze", "metrics", "troubleshoot" → analyst
- "code", "implement", "refactor" → coder
- "deploy", "pipeline", "infrastructure" → devops
- "harvest", "collect", "scrape" → harvester
- "research", "investigate", "compare" → researcher
- "review", "audit", "security" → reviewer
- "test", "coverage", "qa" → tester
- "document", "write", "readme" → writer
- Default → planner (for task breakdown)

## Examples

- `/reflex:task "analyze the error logs"` - Routes to analyst
- `/reflex:task "implement user authentication" -a coder` - Force to coder
- `/reflex:task "build API endpoints" -r` - Auto-route with RAG context
- `/reflex:task "fix login bug" -a coder -r -p acme` - Coder with acme project context
