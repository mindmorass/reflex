---
description: List available Reflex agents
allowed-tools: Bash(npm start -- agents:*)
---

# Reflex Agents

List all available agents in the Reflex orchestration system.

## Command

```bash
!npm start -- agents 2>&1 | grep -v "DEP0040\|punycode\|node --trace\|INFO\|Creating\|Loaded\|Orchestrator\|sessionId"
```

## Available Agents

| Agent | Purpose | Key Skills |
|-------|---------|------------|
| analyst | Data analysis, troubleshooting | embedding-comparison, troubleshooting |
| coder | Code development | microsoft-code-reference, test-patterns |
| devops | Infrastructure, CI/CD | ci-cd-patterns, docker-patterns |
| harvester | Data collection | github-harvester, site-crawler |
| planner | Task breakdown | task-decomposition, workflow-builder |
| researcher | Investigation | microsoft-docs, embedding-comparison |
| reviewer | Code/security review | code-review-patterns, security-review |
| tester | Test generation | test-patterns |
| writer | Documentation | doc-sync, mermaid-diagrams |
