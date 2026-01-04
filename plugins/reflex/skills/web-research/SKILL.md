---
name: web-research
description: Web search with automatic Qdrant storage for building persistent knowledge
---

# Web Research Skill

Combines WebSearch with automatic Qdrant storage to build a searchable knowledge base.

## Workflow

```
1. Check Qdrant first    → qdrant-find for existing knowledge
2. Search if needed      → WebSearch for current information
3. Store valuable finds  → qdrant-store with metadata
4. Return synthesized    → Combine stored + new knowledge
```

## Step 1: Check Existing Knowledge

Before searching the web, check if the answer already exists:

```
Tool: qdrant-find
Query: "<user's question or topic>"
```

If sufficient information exists with recent `harvested_at`, use it directly.

## Step 2: Web Search

When stored knowledge is insufficient or stale:

```
Tool: WebSearch
Query: "<refined search query>"
```

## Step 3: Store Results

After getting valuable results, store them:

```
Tool: qdrant-store
Information: |
  # <Topic/Question>

  ## Key Findings
  - Finding 1
  - Finding 2

  ## Details
  <Synthesized information from search results>

  ## Sources
  - [Title](URL)

Metadata:
  source: "web_search"
  query: "<original search query>"
  type: "research"
  harvested_at: "2024-01-15T10:30:00Z"
  urls: "https://example.com/1, https://example.com/2"
  topic: "<primary topic>"
```

## When to Store

**Always store:**
- Technical documentation findings
- API patterns and examples
- Error solutions and workarounds
- Best practices and recommendations
- Tool comparisons and evaluations

**Skip storing:**
- Simple factual lookups (dates, definitions)
- Ephemeral information (current weather, stock prices)
- Information already in Qdrant with same content

## Metadata Schema

| Field | Required | Description |
|-------|----------|-------------|
| source | Yes | Always "web_search" |
| query | Yes | Original search query |
| type | Yes | "research", "documentation", "tutorial", "troubleshooting" |
| harvested_at | Yes | ISO 8601 timestamp |
| urls | Yes | Comma-separated source URLs |
| topic | No | Primary topic for categorization |
| language | No | Programming language if applicable |
| framework | No | Framework/library if applicable |

## Example Usage

User asks: "How do I set up GitHub Actions for Python testing?"

```
# Step 1: Check existing
qdrant-find: "GitHub Actions Python testing setup"
→ No relevant results

# Step 2: Search
WebSearch: "GitHub Actions Python pytest workflow 2024"
→ Returns multiple results about CI setup

# Step 3: Store
qdrant-store:
  Information: |
    # GitHub Actions Python Testing Setup

    ## Key Findings
    - Use `actions/setup-python@v5` for Python environment
    - Matrix testing across Python versions: 3.9, 3.10, 3.11, 3.12
    - pytest with coverage using `pytest-cov`

    ## Workflow Template
    ```yaml
    name: Python Tests
    on: [push, pull_request]
    jobs:
      test:
        runs-on: ubuntu-latest
        strategy:
          matrix:
            python-version: ["3.9", "3.10", "3.11", "3.12"]
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-python@v5
            with:
              python-version: ${{ matrix.python-version }}
          - run: pip install -e .[test]
          - run: pytest --cov
    ```

    ## Sources
    - [GitHub Actions Python Guide](https://docs.github.com/en/actions/...)

  Metadata:
    source: "web_search"
    query: "GitHub Actions Python pytest workflow 2024"
    type: "documentation"
    harvested_at: "2024-01-15T10:30:00Z"
    urls: "https://docs.github.com/en/actions/..."
    topic: "CI/CD"
    language: "python"
    framework: "pytest"
```

## Integration with Other Skills

- **research-patterns**: Use web-research for external searches
- **qdrant-patterns**: Follows same metadata conventions
- **knowledge-ingestion-patterns**: Compatible chunking approach
