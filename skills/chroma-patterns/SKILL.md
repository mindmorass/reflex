---
name: chroma-patterns
description: Store and retrieve documents using ChromaDB for RAG workflows. Use for persistent memory, research storage, and semantic search.
---

# ChromaDB Patterns

Use the `chroma` MCP server tools for persistent vector storage and semantic retrieval.

## Available Tools

| Tool | Purpose |
|------|---------|
| `chroma_list_collections` | List all collections |
| `chroma_create_collection` | Create a new collection |
| `chroma_add_documents` | Store documents with embeddings |
| `chroma_query_documents` | Semantic search |
| `chroma_get_documents` | Retrieve by ID or filter |
| `chroma_delete_documents` | Remove documents |
| `chroma_get_collection_count` | Get document count |

## Collection Naming Convention

Use descriptive, namespaced collection names:

```
{project}-{type}-{scope}
```

Examples:
- `reflex-research-apis` - API documentation research
- `reflex-code-patterns` - Code pattern examples
- `myapp-docs-architecture` - Architecture documentation

## Storing Documents

When harvesting content, store with rich metadata:

```
Tool: chroma_add_documents
Collection: reflex-research-apis
Documents:
  - id: "github-rest-api-auth"
    content: "GitHub REST API uses OAuth tokens for authentication..."
    metadata:
      source: "https://docs.github.com/rest/authentication"
      type: "documentation"
      harvested_at: "2025-01-02"
      tags: ["github", "api", "authentication"]
```

### Metadata Best Practices

Always include:
- `source` - Original URL or file path
- `type` - Content type (documentation, code, article, etc.)
- `harvested_at` - ISO date of collection
- `tags` - Searchable keywords

Optional but useful:
- `project` - Related project name
- `language` - Programming language if code
- `version` - API or library version
- `summary` - Brief content summary

## Querying Documents

### Semantic Search

Find related content by meaning:

```
Tool: chroma_query_documents
Collection: reflex-research-apis
Query: "how to authenticate with OAuth"
N Results: 5
```

### Filtered Search

Combine semantic search with metadata filters:

```
Tool: chroma_query_documents
Collection: reflex-research-apis
Query: "authentication"
Where: {"type": "documentation", "tags": {"$contains": "github"}}
N Results: 10
```

### Filter Operators

- `$eq` - Equals
- `$ne` - Not equals
- `$gt`, `$gte` - Greater than (or equal)
- `$lt`, `$lte` - Less than (or equal)
- `$in` - In list
- `$nin` - Not in list
- `$contains` - Contains value

## RAG Workflow

### 1. Check Existing Knowledge

Before researching, query for existing content:

```
Tool: chroma_query_documents
Collection: reflex-research-apis
Query: "GitHub Actions workflow syntax"
N Results: 3
```

If results are relevant and recent, use them. Otherwise, harvest fresh content.

### 2. Harvest and Store

When gathering new information:

1. Fetch the content (WebFetch, Read, etc.)
2. Extract key information
3. Store in ChromaDB with metadata
4. Reference the stored content

### 3. Retrieve for Context

When answering questions or implementing features:

1. Query ChromaDB for relevant documents
2. Include top results in context
3. Cite sources from metadata

## Collection Management

### List Collections

```
Tool: chroma_list_collections
```

### Check Collection Size

```
Tool: chroma_get_collection_count
Collection: reflex-research-apis
```

### Delete Old Documents

Remove outdated content:

```
Tool: chroma_delete_documents
Collection: reflex-research-apis
Where: {"harvested_at": {"$lt": "2024-06-01"}}
```

## Example: Research Workflow

1. **Check existing**: Query for topic
2. **Assess freshness**: Check `harvested_at` in results
3. **Harvest if needed**: Fetch new content
4. **Store with metadata**: Add to collection
5. **Use for response**: Include relevant chunks

## Tips

- Keep documents focused (one topic per document)
- Use consistent metadata schemas per collection
- Periodically clean old/outdated content
- Create separate collections for different domains
- Include enough context in each document to be useful standalone
