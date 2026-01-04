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
| coder | Code development | microsoft-code-reference, docker-patterns |
| devops | Infrastructure, CI/CD | docker-patterns, workspace-builder |
| harvester | Data collection, Qdrant storage | github-harvester, site-crawler, qdrant-patterns |
| planner | Task breakdown | task-decomposition, workflow-builder |
| rag-proxy | RAG wrapper for any agent | qdrant-patterns, rag-wrapper |
| researcher | Investigation, Qdrant queries | microsoft-docs, qdrant-patterns |
| reviewer | Code/security review | troubleshooting |
| tester | Test generation | troubleshooting |
| writer | Documentation | mermaid-diagrams, graphviz-diagrams |
