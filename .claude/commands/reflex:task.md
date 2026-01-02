---
description: Route a task to the appropriate Reflex agent
allowed-tools: Bash(npm start -- task:*)
argument-hint: "<task description>" [-a agent]
---

# Route Task to Agent

Route a task to the appropriate Reflex agent for execution.

## Command

```bash
!npm start -- task "$ARGUMENTS" 2>&1 | grep -v "DEP0040\|punycode\|node --trace"
```

## Options

- `-a, --agent <name>` - Specify preferred agent (analyst, coder, devops, harvester, planner, researcher, reviewer, tester, writer)

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
