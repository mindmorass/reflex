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
3. Process images        → Generate thumbnails for visual content
4. Store valuable finds  → qdrant-store with rich metadata
5. Return synthesized    → Combine stored + new knowledge
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

## Step 3: Image Handling

When search results reference images:

**Default behavior:** Create thumbnails, don't download full images.

```bash
# Generate 200px wide thumbnail using ImageMagick
convert "<image_url>" -resize 200x -quality 80 "/tmp/thumb_<hash>.jpg"

# Or using sips on macOS (no ImageMagick needed)
curl -sL "<image_url>" -o /tmp/original.jpg && \
  sips -Z 200 /tmp/original.jpg --out "/tmp/thumb_<hash>.jpg"
```

**Store image reference with thumbnail:**
```
Metadata:
  content_type: "image"
  original_url: "<full image URL>"
  thumbnail_path: "/tmp/thumb_<hash>.jpg"
  dimensions: "1920x1080"
  thumbnail_size: "200x112"
```

**When to download full images:**
- User explicitly requests full resolution
- Image is a diagram/schematic needed for analysis
- Image contains text that needs OCR

## Step 4: Store Results

After getting valuable results, store with rich metadata:

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
  # Required fields
  source: "web_search"
  content_type: "text"
  harvested_at: "2025-01-04T10:30:00Z"

  # Search context
  query: "<original search query>"
  urls: ["https://example.com/1", "https://example.com/2"]

  # Classification (for filtering)
  category: "technology"
  subcategory: "databases"
  type: "documentation"

  # Technical context (when applicable)
  language: "python"
  framework: "fastapi"
  version: "0.100+"

  # Quality signals
  confidence: "high"
  freshness: "current"

  # Relationships
  related_topics: ["vector-search", "embeddings", "rag"]
  project: "reflex"
```

## Rich Metadata Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| source | string | Origin: `web_search`, `api_docs`, `github`, `manual` |
| content_type | string | `text`, `code`, `image`, `diagram`, `video_transcript` |
| harvested_at | string | ISO 8601 timestamp |

### Search Context

| Field | Type | Description |
|-------|------|-------------|
| query | string | Original search query |
| urls | array | Source URLs (array for proper filtering) |
| domain | string | Primary domain (e.g., `github.com`) |

### Classification (Enables Filtering)

| Field | Type | Values |
|-------|------|--------|
| category | string | `technology`, `business`, `science`, `design`, `security`, `devops` |
| subcategory | string | More specific: `databases`, `frontend`, `ml`, `networking` |
| type | string | `documentation`, `tutorial`, `troubleshooting`, `reference`, `comparison`, `news` |

### Technical Context

| Field | Type | Description |
|-------|------|-------------|
| language | string | Programming language: `python`, `typescript`, `rust`, `go` |
| framework | string | Framework/library: `fastapi`, `react`, `tokio` |
| version | string | Version constraint: `3.12+`, `>=2.0`, `latest` |
| platform | string | `linux`, `macos`, `windows`, `docker`, `kubernetes` |

### Quality Signals

| Field | Type | Values |
|-------|------|--------|
| confidence | string | `high`, `medium`, `low` - how reliable is this info |
| freshness | string | `current`, `recent`, `dated`, `historical` |
| depth | string | `overview`, `detailed`, `comprehensive` |

### Relationships

| Field | Type | Description |
|-------|------|-------------|
| related_topics | array | Related concepts for discovery |
| project | string | Associated project name |
| supersedes | string | ID of entry this replaces |
| parent_topic | string | Broader topic this belongs to |

### Image-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| original_url | string | Full resolution image URL |
| thumbnail_path | string | Local path to thumbnail |
| dimensions | string | Original dimensions `WxH` |
| thumbnail_size | string | Thumbnail dimensions `WxH` |
| alt_text | string | Image description |
| image_type | string | `photo`, `diagram`, `screenshot`, `chart`, `icon` |

## Filtering Examples

**Find Python documentation:**
```
qdrant-find with filter:
  category: "technology"
  language: "python"
  type: "documentation"
```

**Find recent troubleshooting:**
```
qdrant-find with filter:
  type: "troubleshooting"
  freshness: "current"
```

**Find project-specific knowledge:**
```
qdrant-find with filter:
  project: "reflex"
```

**Find diagrams and images:**
```
qdrant-find with filter:
  content_type: "image"
  image_type: "diagram"
```

## When to Store

**Always store:**
- Technical documentation findings
- API patterns and examples
- Error solutions and workarounds
- Best practices and recommendations
- Tool comparisons and evaluations
- Architectural diagrams (as thumbnails with references)

**Skip storing:**
- Simple factual lookups (dates, definitions)
- Ephemeral information (current weather, stock prices)
- Information already in Qdrant with same content
- Decorative images with no informational value

## Example: Full Research Flow

User asks: "How do I set up GitHub Actions for Python testing?"

```
# Step 1: Check existing
qdrant-find: "GitHub Actions Python testing setup"
→ No relevant results

# Step 2: Search
WebSearch: "GitHub Actions Python pytest workflow 2025"
→ Returns results with workflow examples

# Step 3: Process images (if any diagrams found)
# E.g., CI/CD pipeline diagram
curl -sL "https://example.com/ci-diagram.png" -o /tmp/ci.png
sips -Z 200 /tmp/ci.png --out /tmp/thumb_ci_abc123.jpg

# Step 4: Store text content
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

  Metadata:
    source: "web_search"
    content_type: "code"
    harvested_at: "2025-01-04T10:30:00Z"
    query: "GitHub Actions Python pytest workflow 2025"
    urls: ["https://docs.github.com/en/actions/..."]
    domain: "github.com"
    category: "technology"
    subcategory: "ci-cd"
    type: "documentation"
    language: "python"
    framework: "pytest"
    platform: "github-actions"
    confidence: "high"
    freshness: "current"
    depth: "detailed"
    related_topics: ["testing", "ci-cd", "yaml", "github"]
    project: null

# Step 5: Store diagram (if found)
qdrant-store:
  Information: |
    CI/CD Pipeline Diagram for Python GitHub Actions
    Shows: checkout → setup-python → install deps → run tests → upload coverage

  Metadata:
    source: "web_search"
    content_type: "image"
    image_type: "diagram"
    harvested_at: "2025-01-04T10:30:00Z"
    original_url: "https://example.com/ci-diagram.png"
    thumbnail_path: "/tmp/thumb_ci_abc123.jpg"
    dimensions: "1200x600"
    thumbnail_size: "200x100"
    alt_text: "GitHub Actions Python CI/CD pipeline flow"
    category: "technology"
    subcategory: "ci-cd"
    related_topics: ["github-actions", "python", "testing"]
```

## Integration with Other Skills

- **research-patterns**: Use web-research for external searches
- **qdrant-patterns**: Follows same metadata conventions
- **knowledge-ingestion-patterns**: Compatible chunking approach
- **github-harvester**: Similar metadata schema for GitHub content
- **pdf-harvester**: Diagram extraction follows same thumbnail pattern
