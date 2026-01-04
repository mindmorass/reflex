---
description: Ingest local files into Qdrant vector database
allowed-tools: Bash(uvx:*), Bash(python3:*)
argument-hint: <path> [--collection NAME] [--chunk-size WORDS] [--recursive]
---

# File Ingestion

Ingest local documents into Qdrant for semantic search.

## Usage

```bash
uvx --with pymupdf,fastembed,qdrant-client,python-docx,ebooklib,beautifulsoup4 \
    python ${CLAUDE_PLUGIN_ROOT}/scripts/ingest.py <path> [options]
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--collection NAME` | `personal_memories` | Qdrant collection name |
| `--chunk-size N` | `400` | Target words per chunk |
| `--recursive` | `false` | Recursively process directories |
| `--qdrant-url URL` | `http://localhost:6333` | Qdrant server URL |

## Supported Formats

| Format | Extensions |
|--------|------------|
| PDF | `.pdf` |
| Markdown | `.md`, `.markdown` |
| Text | `.txt`, `.rst` |
| HTML | `.html`, `.htm` |
| EPUB | `.epub` |
| Word | `.docx` |
| Jupyter | `.ipynb` |
| Mermaid | `.mmd`, `.mermaid` |
| Code | `.py`, `.js`, `.ts`, `.go`, `.rs`, `.java`, `.c`, `.cpp`, `.rb`, `.sh`, `.sql`, `.yaml` |

## Examples

```bash
# Single PDF
/reflex:ingest ~/Documents/manual.pdf

# Markdown notes
/reflex:ingest ~/notes/decisions.md

# Directory of docs
/reflex:ingest ~/Documentation/ --recursive

# Custom collection
/reflex:ingest ~/research/paper.pdf --collection research_papers

# Larger chunks for context
/reflex:ingest ~/book.epub --chunk-size 600

# Mermaid architecture diagrams
/reflex:ingest ~/diagrams/ --recursive --collection architecture_patterns
```

## After Ingestion

Search ingested content:
```
qdrant-find: "how to configure authentication"
```

Filter by source:
```
qdrant-find with filter:
  source: "local_file"
  filename: "manual.pdf"
```
