---
name: rag-wrapper
description: Patterns for wrapping any agent with RAG context from ChromaDB. Use to add persistent memory to imported or external agents.
---

# RAG Wrapper Patterns

Patterns for augmenting any agent with ChromaDB context retrieval.

## Quick Start

To wrap an agent with RAG:

```
Use rag-proxy agent:
  Target: {agent-to-wrap}
  Task: {the task}
  Project: {project-name}
```

## Manual Wrapping Pattern

If you need custom control, follow this pattern:

### Step 1: Discover Collections

```
Tool: chroma_list_collections
```

Look for collections matching your project prefix.

### Step 2: Query Relevant Context

```
Tool: chroma_query_documents
Collection: {project}-research-{topic}
Query: {key terms from task}
N Results: 5
Include: ["documents", "metadatas"]
```

### Step 3: Format Context Block

```markdown
## Retrieved Context

### Source: {metadata.source}
Harvested: {metadata.harvested_at}
Type: {metadata.type}

{document content}

---
```

### Step 4: Prepend to Task

```markdown
{context blocks}

## Task

{original task}

---
Note: Above context is from stored knowledge. Verify if needed.
```

### Step 5: Delegate

```
Tool: Task
Agent: {target-agent}
Prompt: {enriched prompt}
```

## Enriched Prompt Template

```markdown
# Context from Stored Knowledge

The following relevant information was retrieved from project memory:

{{#each contexts}}
## From: {{collection}}
**Source:** {{metadata.source}}
**Harvested:** {{metadata.harvested_at}}
**Relevance Score:** {{score}}

{{content}}

---
{{/each}}

# Your Task

{{original_task}}

---

**Note:** The context above comes from previously harvested research.
Use it if relevant, but verify currency for time-sensitive information.
The `harvested_at` dates indicate when the content was stored.
```

## Multi-Collection Query Pattern

For comprehensive context, query multiple collection types:

```python
collections_to_query = [
    f"{project}-research-{topic}",   # Research findings
    f"{project}-docs-{domain}",       # Documentation
    f"{project}-code-{language}",     # Code examples
    f"{project}-decisions-*",         # ADRs and decisions
]

all_results = []
for collection in collections_to_query:
    results = chroma_query_documents(
        collection=collection,
        query=task_keywords,
        n_results=3
    )
    all_results.extend(results)

# Deduplicate and rank by relevance
```

## Selective Wrapping

Not all tasks need RAG. Skip for:

| Task Type | Wrap? | Reason |
|-----------|-------|--------|
| Fresh research | No | Need current, not cached data |
| Simple edits | No | Context not needed |
| RAG-aware agents | No | Already query ChromaDB |
| Implementation | Yes | Benefit from patterns, decisions |
| Debugging | Yes | Previous solutions may help |
| Architecture | Yes | Decisions and constraints matter |

## Collection Affinity Map

Map agent types to likely useful collections:

| Agent Type | Primary Collections | Secondary |
|------------|--------------------| ----------|
| frontend-developer | `*-code-react`, `*-docs-design` | `*-decisions-*` |
| backend-architect | `*-docs-api`, `*-decisions-*` | `*-research-*` |
| security-auditor | `*-docs-security`, `*-research-*` | `*-code-*` |
| devops | `*-docs-infra`, `*-code-terraform` | `*-decisions-*` |
| tester | `*-code-tests`, `*-docs-testing` | `*-research-*` |

## Metadata for Filtering

Use metadata filters to narrow results:

```
Tool: chroma_query_documents
Collection: project-research-api
Query: "authentication"
Where: {
    "type": "documentation",
    "harvested_at": {"$gt": "2024-01-01"}
}
```

Common filters:
- `type` - documentation, article, code, transcript
- `harvested_at` - freshness filtering
- `tags` - topic-based filtering
- `source` - specific source filtering

## Result Ranking

When combining results from multiple collections:

1. **Relevance score** - ChromaDB's similarity score
2. **Freshness** - Prefer recent over stale
3. **Source authority** - Official docs > blog posts
4. **Collection match** - Direct topic match > tangential

## Caching Enriched Prompts

For repeated similar tasks, consider:

```
Collection: {project}-prompts-enriched
Document: {
    "original_task": "...",
    "enriched_prompt": "...",
    "collections_queried": [...],
    "created_at": "..."
}
```

Reuse if:
- Same task keywords
- Less than 24 hours old
- Same target agent

## Error Handling

| Scenario | Action |
|----------|--------|
| No collections found | Proceed without context, note absence |
| Empty query results | Proceed without context |
| ChromaDB unavailable | Fall back to unwrapped delegation |
| Target agent fails | Report error, don't retry with less context |
