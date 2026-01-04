---
description: Route a task to the appropriate Reflex agent
argument-hint: "<task description>" [--rag]
---

# Route Task to Agent

Route a task through the rag-proxy agent for RAG-enriched execution.

## Usage

```
/reflex:task "<task description>" --rag
```

## RAG Wrapping

The `--rag` flag:
1. Queries Qdrant for relevant stored knowledge
2. Enriches the task with retrieved context
3. Delegates to the appropriate official plugin agent

## Example

```
/reflex:task "implement OAuth login" --rag
```

This will:
1. Query Qdrant for OAuth documentation and patterns
2. Enrich the task with this context
3. Delegate to the appropriate agent (e.g., python-pro, typescript-pro)

## Without RAG

For tasks without RAG context, use the Task tool directly with official plugin agents:

- **Code**: python-pro, typescript-pro, golang-pro, rust-pro
- **Testing**: test-automator, test-engineer
- **Security**: security-auditor, code-reviewer
- **DevOps**: deployment-engineer, cloud-architect
- **Docs**: docs-architect, technical-writer
